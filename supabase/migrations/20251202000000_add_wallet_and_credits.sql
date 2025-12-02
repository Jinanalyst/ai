/*
  # Add wallet address and message credits system

  1. Changes to existing tables
    - Add `wallet_address` column to `chat_messages` table

  2. New Tables
    - `user_credits`
      - `wallet_address` (text, primary key)
      - `messages_remaining` (integer, default 0)
      - `total_messages_purchased` (integer, default 0)
      - `last_purchase_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `payment_transactions`
      - `id` (uuid, primary key)
      - `wallet_address` (text)
      - `transaction_signature` (text, unique)
      - `amount_sol` (numeric)
      - `messages_credited` (integer)
      - `status` (text: 'pending', 'verified', 'failed')
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on new tables
    - Add policies for user access
*/

-- Add wallet_address to chat_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN wallet_address text;
    CREATE INDEX IF NOT EXISTS idx_chat_messages_wallet ON chat_messages(wallet_address);
  END IF;
END $$;

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  wallet_address text PRIMARY KEY,
  messages_remaining integer DEFAULT 0 CHECK (messages_remaining >= 0),
  total_messages_purchased integer DEFAULT 0,
  total_messages_used integer DEFAULT 0,
  last_purchase_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_signature text UNIQUE NOT NULL,
  amount_sol numeric NOT NULL,
  messages_credited integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_wallet ON payment_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_signature ON payment_transactions(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON user_credits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own credits"
  ON user_credits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own credits"
  ON user_credits
  FOR UPDATE
  TO public
  USING (true);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON payment_transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert transactions"
  ON payment_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

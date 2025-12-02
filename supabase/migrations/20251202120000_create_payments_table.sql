-- Create payments table for tracking mainnet SOL transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_signature text NOT NULL UNIQUE,
  payment_id text NOT NULL,
  amount decimal(10, 6) NOT NULL,
  currency text DEFAULT 'SOL',
  network text DEFAULT 'mainnet-beta',
  memo text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  faucet_address text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  block_slot integer,
  error_message text
);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_payments_wallet_address ON payments(wallet_address);

-- Create index for transaction signature lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction_signature ON payments(transaction_signature);

-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read payments
CREATE POLICY "Allow public read access"
  ON payments FOR SELECT
  USING (true);

-- Create policy to allow anonymous inserts
CREATE POLICY "Allow anonymous inserts"
  ON payments FOR INSERT
  WITH CHECK (true);

-- Create policy to update only pending records
CREATE POLICY "Allow updating pending records"
  ON payments FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status IN ('pending', 'confirmed', 'failed'));

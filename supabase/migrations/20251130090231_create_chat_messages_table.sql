/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `role` (text: 'user' or 'assistant')
      - `content` (text: message content)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for anonymous users to insert messages
    - Add policy for all users to read all messages (public chat)
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous to insert messages"
  ON chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);
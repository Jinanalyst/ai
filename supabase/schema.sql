-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  title TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0
);

-- Create index on wallet_address for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_wallet
ON chat_sessions(wallet_address);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated
ON chat_sessions(wallet_address, updated_at DESC);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  reward_tx TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Create index on session_id for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_session
ON chat_messages(session_id, created_at ASC);

-- Create index on wallet_address
CREATE INDEX IF NOT EXISTS idx_chat_messages_wallet
ON chat_messages(wallet_address);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using wallet addresses as auth)
-- Note: In production, you might want to implement proper authentication

-- Policy for chat_sessions
CREATE POLICY "Enable read access for all users" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON chat_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON chat_sessions
  FOR DELETE USING (true);

-- Policy for chat_messages
CREATE POLICY "Enable read access for all users" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON chat_messages
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON chat_messages
  FOR DELETE USING (true);

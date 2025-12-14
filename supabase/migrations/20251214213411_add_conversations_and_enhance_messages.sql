/*
  # Add conversations table and enhance chat_messages

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable for guest users)
      - `title` (text, auto-generated from first message)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to existing tables
    - `chat_messages`
      - Add `conversation_id` (uuid, foreign key to conversations)
      - Add `user_id` (uuid, nullable for backward compatibility)

  3. Security
    - Enable RLS on `conversations` table
    - Add policies for user-specific access
    - Update RLS policies on `chat_messages` for user-specific access
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add columns to chat_messages table
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop old policies on chat_messages
DROP POLICY IF EXISTS "Allow anonymous to insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow public read access" ON chat_messages;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own conversations"
  ON conversations
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.user_id IS NULL)
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


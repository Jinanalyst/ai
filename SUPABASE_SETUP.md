# Supabase Setup Guide

This project uses Supabase as the database for storing chat sessions and messages.

## Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in your project details:
   - Name: Choose a name for your project
   - Database Password: Create a strong password
   - Region: Choose closest to your users
4. Click "Create new project" and wait for it to initialize

### 2. Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" to create the tables

This will create:
- `chat_sessions` table - Stores chat session metadata
- `chat_messages` table - Stores individual messages
- Indexes for performance
- Row Level Security policies

### 3. Get Your API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

### 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 5. Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Connect your wallet and send a message
3. Go to Supabase dashboard > **Table Editor** > `chat_messages`
4. You should see your messages appearing in the table!

## Database Schema

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Unique session ID |
| wallet_address | TEXT | User's wallet address |
| title | TEXT | Auto-generated from first message |
| message_count | INTEGER | Number of messages in session |
| created_at | TIMESTAMP | When session was created |
| updated_at | TIMESTAMP | Last message timestamp |
| display_order | INTEGER | Custom order for drag-drop |

### chat_messages
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Unique message ID |
| session_id | TEXT | Links to chat_sessions |
| wallet_address | TEXT | User's wallet address |
| role | TEXT | 'user' or 'assistant' |
| content | TEXT | Message content |
| reward_tx | TEXT | Solana transaction hash (optional) |
| created_at | TIMESTAMP | When message was sent |

## Security Notes

**Important**: The current setup uses public policies for simplicity. In production, you should:

1. Implement proper authentication with Supabase Auth
2. Update Row Level Security policies to restrict access based on authenticated users
3. Validate wallet signatures on the backend

Example secure policy:
```sql
CREATE POLICY "Users can only access their own sessions"
ON chat_sessions FOR ALL
USING (wallet_address = auth.jwt() ->> 'wallet_address');
```

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure you created `.env.local` file
- Check that variable names match exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after adding env variables

### Tables not found
- Run the SQL script from `supabase/schema.sql` in SQL Editor
- Check that tables were created in Table Editor

### Messages not saving
- Check browser console for errors
- Verify API credentials are correct
- Check Supabase logs in dashboard > Logs

## Production Deployment

When deploying to Vercel or other platforms:

1. Add environment variables in your hosting platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. For Vercel:
   - Go to Project Settings > Environment Variables
   - Add both variables
   - Redeploy your application

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

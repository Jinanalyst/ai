# Setup Instructions

## Environment Variables Configuration

This application requires a HuggingFace API key to function. Follow these steps:

### 1. Get Your HuggingFace API Key

1. Go to [HuggingFace](https://huggingface.co/)
2. Create an account or sign in
3. Navigate to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "Read" permissions
5. Copy the generated API key

### 2. Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Replace `your_huggingface_api_key_here` with your actual API key:
   ```
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save the file

### 3. Start the Development Server

```bash
npm run dev
```

The app should now work at `http://localhost:3000`

## Important Notes

- **This app does NOT use Supabase** for the frontend chat functionality
- The chat API uses HuggingFace Inference API
- The Supabase edge function in `supabase/functions/chat/` is an alternative deployment option
- Make sure `.env.local` is never committed to git (it's already in `.gitignore`)

## Troubleshooting

If you see "AI API key not configured" error:
- Check that `HUGGINGFACE_API_KEY` is set in `.env.local`
- Restart the development server after adding the environment variable
- Verify your API key is valid at https://huggingface.co/settings/tokens

import { NextRequest, NextResponse } from 'next/server';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY.length < 10) {
      return NextResponse.json(
        { error: 'AI API key not configured or invalid. Please check your HUGGINGFACE_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Build conversation prompt for Hugging Face
    let prompt = 'You are a helpful, friendly AI assistant. Keep responses concise and clear. Avoid overly long explanations.\n\n';
    
    // Add history
    history.forEach((msg: { role: string; content: string }) => {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    });
    
    // Add current message
    prompt += `User: ${message}\nAssistant:`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      var response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout: The AI service took too long to respond. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Hugging Face API error:', errorData);
      let errorMessage = `Failed to get AI response (HTTP ${response.status})`;
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.error || parsedError.message || errorMessage;
      } catch {
        // If not JSON, use the text response if it's not empty
        if (errorData && errorData.trim().length > 0) {
          errorMessage = `${errorMessage}: ${errorData.substring(0, 200)}`;
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    
    // Handle Hugging Face response format
    let reply = 'No response received';
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text.trim();
    } else if (data.generated_text) {
      reply = data.generated_text.trim();
    } else if (typeof data === 'string') {
      reply = data.trim();
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Internal server error';
    return NextResponse.json(
      { error: `Chat API error: ${errorMessage}` },
      { status: 500 }
    );
  }
}


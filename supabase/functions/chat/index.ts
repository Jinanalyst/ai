import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  message_history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface ChatResponse {
  reply: string;
  message_id?: string;
  conversation_id?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { message, conversation_id, message_history = [] } = (await req.json()) as ChatRequest;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user ID from auth
    const { data: { user } } = await supabase.auth.getUser();

    // Build message history for context
    const messages = [
      {
        role: "system",
        content: "You are a helpful, friendly AI assistant. Keep responses concise and clear. Avoid overly long explanations.",
      },
      ...message_history,
      {
        role: "user",
        content: message,
      },
    ];

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error: Unable to reach the AI server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    // Store messages in database if conversation_id is provided
    let userMessageId: string | undefined;
    let assistantMessageId: string | undefined;

    if (conversation_id) {
      try {
        // Store user message
        const { data: userMsg, error: userError } = await supabase
          .from("chat_messages")
          .insert({
            role: "user",
            content: message,
            conversation_id,
            user_id: user?.id || null,
          })
          .select()
          .single();

        if (!userError && userMsg) {
          userMessageId = userMsg.id;
        }

        // Store assistant message
        const { data: assistantMsg, error: assistantError } = await supabase
          .from("chat_messages")
          .insert({
            role: "assistant",
            content: reply,
            conversation_id,
            user_id: null,
          })
          .select()
          .single();

        if (!assistantError && assistantMsg) {
          assistantMessageId = assistantMsg.id;
        }
      } catch (dbError) {
        console.error("Error storing messages:", dbError);
        // Continue even if database storage fails
      }
    }

    const result: ChatResponse = {
      reply,
      message_id: assistantMessageId,
      conversation_id: conversation_id || undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Error: Unable to reach the AI server." }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
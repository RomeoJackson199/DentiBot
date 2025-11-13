import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, current_step, business_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a friendly AI assistant helping users create their healthcare business. Your role is to guide them through the setup process conversationally.

Current Step: ${current_step}
Business Data Collected: ${JSON.stringify(business_data || {})}

Guidelines:
- Be warm, encouraging, and conversational
- Ask clarifying questions to understand their needs
- Provide specific recommendations based on their responses
- Keep responses concise (2-3 sentences max)
- Use emojis occasionally to be friendly 😊

Step-specific guidance:
- Template (step 2): Ask about their practice type, specializations, and what features matter most
- Details (step 3): Help them craft a compelling business name, tagline, and bio based on their practice
- Services (step 4): Suggest relevant services based on their template and specialties
- Subscription (step 5): Explain plan benefits and help them choose the right fit

When the user provides information that should fill a form field, respond with JSON in this format:
{
  "message": "Your conversational response",
  "suggested_data": {
    "field_name": "value"
  }
}

Otherwise just respond conversationally.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(conversation_history || []),
          { role: "user", content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I'm here to help! How can I assist you?";

    // Try to parse if it's JSON with suggested_data
    try {
      const parsed = JSON.parse(aiMessage);
      return new Response(
        JSON.stringify({
          message: parsed.message || aiMessage,
          suggested_data: parsed.suggested_data || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      // Not JSON, just return the message
      return new Response(
        JSON.stringify({ message: aiMessage, suggested_data: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("business-creation-ai error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

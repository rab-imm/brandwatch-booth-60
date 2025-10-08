import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare context from conversation history
    const context = conversationHistory?.slice(-5).map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n') || '';

    const systemPrompt = `You are a legal AI assistant that analyzes conversations to identify opportunities to generate formal legal letters.

Analyze the following conversation and determine if a legal letter would be appropriate.

Letter types available:
- employment_termination: For terminating employment contracts
- employment_contract: For creating employment agreements
- lease_agreement: For rental/lease contracts
- lease_termination: For ending lease agreements
- demand_letter: For formal demands (payment, action, etc.)
- nda: For non-disclosure agreements
- settlement_agreement: For dispute settlements
- power_of_attorney: For granting legal authority
- general_legal: For other legal correspondence

Response format (use tool call):
{
  "shouldSuggestLetter": boolean,
  "letterType": string (one of the types above) or null,
  "confidence": number (0-100),
  "reasoning": string,
  "suggestedTitle": string or null
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation context:\n${context}\n\nLatest message: ${message}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_letter_opportunity",
            description: "Analyze if a legal letter should be suggested",
            parameters: {
              type: "object",
              properties: {
                shouldSuggestLetter: { type: "boolean" },
                letterType: { 
                  type: "string",
                  enum: ["employment_termination", "employment_contract", "lease_agreement", 
                         "lease_termination", "demand_letter", "nda", "settlement_agreement",
                         "power_of_attorney", "general_legal"]
                },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                reasoning: { type: "string" },
                suggestedTitle: { type: "string" }
              },
              required: ["shouldSuggestLetter", "confidence", "reasoning"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_letter_opportunity" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ 
          shouldSuggestLetter: false, 
          confidence: 0,
          reasoning: "No letter opportunity detected"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    console.log("Letter analysis result:", analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-message-for-letter:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

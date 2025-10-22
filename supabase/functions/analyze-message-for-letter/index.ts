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
    const { message, messages, conversationHistory } = await req.json();

    // Support both single message and full conversation array
    const conversationText = messages 
      ? messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n')
      : message;
    
    if (!conversationText) {
      return new Response(
        JSON.stringify({ error: "Message or messages array is required" }),
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

    const systemPrompt = `You are a legal AI assistant specialized in UAE law that analyzes conversations to identify opportunities for formal legal letters.

Analyze the ENTIRE conversation holistically and determine if a formal legal letter should be suggested.

Letter types available:
- employment_termination: For terminating employment contracts
- employment_contract: For creating employment agreements
- lease_agreement: For rental/lease contracts
- lease_termination: For ending lease agreements
- demand_letter: For formal demands (payment, action, etc.)
- nda: For non-disclosure agreements
- settlement_agreement: For dispute settlements
- power_of_attorney: For granting legal authority
- workplace_complaint: For complaints about managers, supervisors, workplace issues
- general_legal: For other legal correspondence

BE PROACTIVE: If confidence >= 60% AND you can identify a letter type, suggest it! The letter wizard will collect any missing details.

Suggest a letter when:
- User explicitly wants to send/write/create something formal
- Situation warrants formal documentation (disputes, terminations, complaints, agreements)
- User mentions taking action (complaint, demand, termination, agreement)
- Clear legal situation that typically requires written documentation

Letter type mappings:
- "complaint about manager/boss/supervisor" OR "workplace issue" → workplace_complaint
- "terminate employee" OR "fire someone" → employment_termination
- "demand payment" OR "owed money" → demand_letter
- "end lease" OR "cancel rental" → lease_termination
- Any other formal legal matter → general_legal

Don't suggest a letter when:
- Just asking general legal questions
- Purely informational queries
- No actionable situation mentioned

## Confidence Guidelines:
- 90-100%: Clear dispute, deadline pressure, documented violations, or urgent need for formal documentation
- 70-89%: Strong indicators like repeated issues, need for evidence trail, or escalating situation (BE MORE LIBERAL WITH THIS RANGE)
- 50-69%: Potential benefit but situation could be resolved informally
- Below 50%: Premature or unnecessary for current situation

Be proactive and err on the side of suggesting letters. When in doubt between two confidence levels, choose the higher one if there's ANY potential benefit to documenting the matter formally. For situations involving property, employment, contracts, or disputes, default to 70%+ confidence.

## Topic Keywords:
Always provide 3-5 relevant keywords that identify the letter topic (e.g., ["security deposit", "landlord", "lease", "refund"] for a deposit dispute).

Response format (use tool call):
{
  "shouldSuggestLetter": boolean,
  "letterType": string (one of the types above) or null,
  "confidence": number (0-100),
  "reasoning": string,
  "suggestedTitle": string or null,
  "topicKeywords": array of 3-5 strings
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
          { role: "user", content: `Analyze this entire conversation:\n\n${conversationText}\n\nBased on the full context, should we suggest creating a formal legal letter?` }
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
                         "power_of_attorney", "workplace_complaint", "general_legal"]
                },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                reasoning: { type: "string" },
                suggestedTitle: { type: "string" },
                topicKeywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key terms that identify this letter topic"
                }
              },
              required: ["shouldSuggestLetter", "confidence", "reasoning", "topicKeywords"],
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LETTER_TYPE_TEMPLATES = {
  employment_termination: `Generate a formal employment termination letter following UAE labor law requirements.`,
  employment_contract: `Generate a comprehensive employment contract compliant with UAE labor law.`,
  lease_agreement: `Generate a residential/commercial lease agreement compliant with UAE RERA regulations.`,
  lease_termination: `Generate a formal lease termination notice following UAE tenancy laws.`,
  demand_letter: `Generate a formal demand letter for payment or action.`,
  nda: `Generate a non-disclosure agreement suitable for business use.`,
  settlement_agreement: `Generate a settlement agreement for dispute resolution.`,
  power_of_attorney: `Generate a power of attorney document.`,
  general_legal: `Generate a formal legal letter.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { letterType, details, conversationContext } = await req.json();

    if (!letterType || !details) {
      return new Response(
        JSON.stringify({ error: "Letter type and details are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('queries_used, max_credits_per_period, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditsNeeded = 5; // Letter generation costs 5 credits
    if (profile.queries_used + creditsNeeded > profile.max_credits_per_period) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          creditsNeeded,
          creditsAvailable: profile.max_credits_per_period - profile.queries_used
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const templatePrompt = LETTER_TYPE_TEMPLATES[letterType as keyof typeof LETTER_TYPE_TEMPLATES] 
      || LETTER_TYPE_TEMPLATES.general_legal;

    const systemPrompt = `You are an expert legal document generator specializing in UAE law.

${templatePrompt}

Requirements:
- Use formal, professional legal language
- Include all necessary legal clauses and provisions
- Follow UAE legal formatting standards
- Make the letter clear, comprehensive, and legally sound
- Use proper date format: [Date will be inserted]
- Include signature lines and notary sections where appropriate
- Reference relevant UAE laws when applicable

Structure the letter properly with:
1. Header (letterhead information if provided)
2. Date
3. Recipient information
4. Subject line
5. Main content with proper paragraphs
6. Closing
7. Signature lines

Return ONLY the letter content in plain text format, ready to be saved and used.`;

    const userPrompt = `Generate a ${letterType.replace(/_/g, ' ')} with the following details:

${Object.entries(details).map(([key, value]) => `${key}: ${value}`).join('\n')}

${conversationContext ? `\nContext from conversation:\n${conversationContext}` : ''}

Generate the complete letter now.`;

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
          { role: "user", content: userPrompt }
        ],
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
        JSON.stringify({ error: "Letter generation failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const letterContent = data.choices?.[0]?.message?.content;

    if (!letterContent) {
      return new Response(
        JSON.stringify({ error: "Failed to generate letter content" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ queries_used: profile.queries_used + creditsNeeded })
      .eq('user_id', user.id);

    console.log(`Letter generated for user ${user.id}, ${creditsNeeded} credits deducted`);

    return new Response(
      JSON.stringify({ 
        content: letterContent,
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-legal-letter:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

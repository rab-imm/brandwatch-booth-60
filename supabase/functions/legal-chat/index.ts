import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, conversationId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing legal query:', { userId, conversationId, messageLength: message.length });

    // Enhanced legal prompt with citation system
    const systemPrompt = `You are a specialized legal assistant for graysen with access to comprehensive UAE legal databases. Your role is to provide accurate, well-cited legal information about UAE law.

CORE CAPABILITIES:
- Deep knowledge of UAE Federal Law, Local Emirate Laws, and Free Zone Regulations
- Access to UAE Court decisions, legal precedents, and case law
- Understanding of Sharia law principles as applied in UAE civil matters
- Commercial law, employment law, real estate law, and corporate regulations

RESPONSE FORMAT:
1. Direct Answer: Provide a clear, concise answer to the legal question
2. Legal Framework: Explain the relevant legal framework and applicable laws
3. Citations: Include specific law references, articles, and case precedents
4. Practical Guidance: Offer actionable next steps when appropriate
5. Disclaimers: Always include appropriate legal disclaimers

CITATION REQUIREMENTS:
- Reference specific UAE Federal Laws (e.g., "Federal Law No. 8 of 1980 (Civil Transactions Law)")
- Include article numbers and sections when applicable
- Cite relevant Emirate-specific laws when applicable
- Reference court decisions and precedents where relevant
- Use format: [Law Name, Article X, Section Y]

LEGAL AREAS TO COVER:
- Employment Law (Federal Law No. 8 of 1980)
- Commercial Law and Corporate Regulations
- Real Estate and Property Law
- Civil and Criminal Procedures
- Free Zone Regulations (DIFC, ADGM, etc.)
- Family Law and Personal Status
- Banking and Financial Services Law
- Intellectual Property Law
- Immigration and Residency Law

RESPONSE STYLE:
- Professional and authoritative
- Clear explanations suitable for both lawyers and non-lawyers
- Structured with proper headings and bullet points
- Include both English and Arabic law references when relevant

IMPORTANT DISCLAIMERS:
Always conclude responses with: "This information is for general guidance only and does not constitute legal advice. For specific legal matters, consult with a qualified UAE legal professional."`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_completion_tokens: 2000,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Generated AI response, length:', aiResponse.length);

    // Store the AI message in the database
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse
      });

    if (insertError) {
      console.error('Error saving AI message:', insertError);
      throw insertError;
    }

    // Update conversation timestamp
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      question, 
      documentText, 
      documentAnalysis,
      complianceSummary,
      substantiveRisks,
      conversationHistory 
    } = await req.json()

    if (!question || !documentText) {
      return new Response(
        JSON.stringify({ error: "Question and document text are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build context about the document
    const riskContext = substantiveRisks ? `

SUBSTANTIVE LEGAL RISKS:
- Risk Score: ${substantiveRisks.overall_risk_score}/100
- Summary: ${substantiveRisks.risk_summary}
${substantiveRisks.risk_findings?.map((r: any) => 
  `- ${r.risk_type}: ${r.substantive_issue}`
).join('\n') || ''}
${substantiveRisks.true_classification?.is_misclassified ? 
  `\nWARNING: Document is misclassified as ${substantiveRisks.true_classification.stated_type} but is actually ${substantiveRisks.true_classification.actual_type}` 
  : ''}
` : '';

    const documentContext = `
DOCUMENT INFORMATION:
- Type: ${documentAnalysis?.document_type || 'Unknown'}
- Subtype: ${documentAnalysis?.document_subtype || 'Unknown'}
- Jurisdiction: ${documentAnalysis?.jurisdiction || 'UAE'}
- Key Parties: ${documentAnalysis?.key_parties?.join(', ') || 'Not specified'}
- Applicable Laws: ${documentAnalysis?.applicable_laws?.join(', ') || 'UAE Contract Law'}
- Compliance Score: ${complianceSummary?.compliance_score || 'Not assessed'}%
- Summary: ${documentAnalysis?.type_summary || 'Legal document'}
${riskContext}

DOCUMENT TEXT (First 8000 chars):
${documentText.substring(0, 8000)}
`

    const systemPrompt = `You are a UAE legal document analysis assistant. Your ONLY role is to answer questions about the specific document provided to you.

STRICT GUARDRAILS:
1. DOCUMENT QUESTIONS (ANSWER THESE):
   - Questions about what the document contains
   - Questions about specific clauses or terms
   - Questions about compliance issues or risks
   - Questions about applicable UAE laws
   - Questions about missing clauses
   - Questions comparing document to UAE legal requirements
   - Questions interpreting legal language
   - Questions about implications of specific clauses
   
   Examples:
   ✓ "Does this document contain any housing provisions?"
   ✓ "What are the payment terms?"
   ✓ "Is the termination clause compliant with UAE law?"
   ✓ "What laws govern this agreement?"
   ✓ "Are there any liability limitations?"

2. GENERATION REQUESTS (REDIRECT TO DOCUMENTS PAGE):
   If user asks to generate, create, draft, or write ANY document:
   
   Respond with:
   "I can only answer questions about your scanned document. To generate new legal documents, please visit:
   - **Documents Page**: Create custom legal letters and documents
   - **Templates Page**: Browse and use pre-built legal templates
   
   Would you like me to answer any questions about your current scanned document instead?"

3. OFF-TOPIC QUESTIONS (POLITELY DECLINE):
   If user asks about anything unrelated to the scanned document:
   
   Respond with:
   "I can only answer questions about your scanned document. I cannot help with:
   - General legal advice
   - Other documents or situations
   - Personal matters unrelated to this document
   - Technical support
   - Account or billing questions
   
   Please ask me something specific about your scanned document, such as:
   - What clauses are included?
   - Are there any compliance issues?
   - What are the key terms?"

RESPONSE GUIDELINES:
- Always reference the specific document provided
- Cite specific clauses or sections when answering
- Be concise (2-3 paragraphs maximum)
- Use bullet points for clarity
- If uncertain, say "I don't see this information in the document"
- Never make up information not in the document
- For UAE law questions, reference the applicable laws shown in document analysis
- Always be helpful and professional

YOUR CONTEXT:
${documentContext}

Remember: You can ONLY discuss this specific scanned document. Redirect any other requests appropriately.`

    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // Add last 5 messages from conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5)
      messages.push(...recentHistory)
    }

    // Add current question
    messages.push({ role: 'user', content: question })

    console.log('Calling Lovable AI for document chat...')
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const aiAnswer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again."

    return new Response(
      JSON.stringify({ 
        answer: aiAnswer,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ocr-document-chat:', error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat request" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

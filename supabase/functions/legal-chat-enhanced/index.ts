import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, conversationId } = await req.json()

    // Create Supabase client with service role key for full access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization header")
    
    const token = authHeader.replace("Bearer ", "")
    const { data: userData } = await supabase.auth.getUser(token)
    const user = userData.user
    if (!user) throw new Error("User not authenticated")

    // Search for relevant documents using embedding similarity
    let documentContext = ""
    try {
      // Generate embedding for the user's message
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message,
        }),
      })

      const embeddingData = await embeddingResponse.json()
      const messageEmbedding = embeddingData.data[0].embedding

      // Search for similar documents
      const { data: similarDocs, error: searchError } = await supabase.rpc('search_documents', {
        query_embedding: messageEmbedding,
        match_threshold: 0.7,
        match_count: 5
      })

      if (!searchError && similarDocs && similarDocs.length > 0) {
        documentContext = similarDocs
          .map((doc: any) => `Document: ${doc.title}\nContent: ${doc.content.substring(0, 1000)}...`)
          .join('\n\n')
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      // Continue without document context if search fails
    }

    // Enhanced system prompt with UAE law specialization
    const systemPrompt = `You are an AI legal assistant specializing in UAE law and employment regulations. You have access to a comprehensive database of UAE legal documents.

Key responsibilities:
1. Provide accurate legal information based on UAE federal law and emirate-specific regulations
2. Focus heavily on UAE employment law, labor regulations, and workplace rights
3. Always cite specific legal sources when available
4. Indicate when legal advice requires a qualified lawyer
5. Provide practical guidance while emphasizing legal compliance

Available document context:
${documentContext || "No specific documents found for this query."}

Guidelines:
- Always prioritize UAE law over other jurisdictions
- Mention relevant UAE labor law articles and regulations
- Suggest when to consult with a qualified UAE lawyer
- Provide actionable advice within legal boundaries
- Include disclaimers about the need for professional legal advice

Remember: You are providing legal information, not legal advice. Always recommend consulting with a qualified UAE lawyer for specific legal matters.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Update query usage for the user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        queries_used: supabase.sql`queries_used + 1`
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating query usage:', updateError)
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      documentSources: documentContext ? "Based on UAE legal documents" : "General legal knowledge"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in legal-chat-enhanced function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')

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
    console.log('Legal chat request received:', { message: message.substring(0, 100), conversationId })

    // Validate API keys
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured')
    }

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

    // Step 1: Search internal documents using embedding similarity
    let documentContext = ""
    try {
      console.log('Searching internal documents...')
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

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`)
      }

      const embeddingData = await embeddingResponse.json()
      const messageEmbedding = embeddingData.data[0].embedding

      // Search for similar documents
      const { data: similarDocs, error: searchError } = await supabase.rpc('search_documents', {
        query_embedding: messageEmbedding,
        match_threshold: 0.7,
        match_count: 3
      })

      if (!searchError && similarDocs && similarDocs.length > 0) {
        documentContext = similarDocs
          .map((doc: any) => `Document: ${doc.title}\nContent: ${doc.content.substring(0, 800)}...`)
          .join('\n\n')
        console.log(`Found ${similarDocs.length} relevant internal documents`)
      }
    } catch (error) {
      console.error('Error searching internal documents:', error)
    }

    // Step 2: Get real-time UAE legal research from Perplexity
    let researchContext = ""
    let researchSources: any[] = []
    try {
      console.log('Fetching real-time UAE legal research...')
      const perplexityQuery = `UAE law ${message} legal information federal emirates regulations 2024 2025`
      
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a UAE legal research assistant. Provide current, accurate UAE law information with specific citations and sources. Focus on federal UAE law and emirate-specific regulations.'
            },
            {
              role: 'user',
              content: perplexityQuery
            }
          ],
          max_tokens: 1000,
          search_domain_filter: ['uaelaws.com', 'government.ae', 'moj.gov.ae', 'mohre.gov.ae'],
          search_recency_filter: 'year'
        }),
      })

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json()
        researchContext = perplexityData.choices[0].message.content
        researchSources = perplexityData.citations || []
        console.log(`Perplexity research completed with ${researchSources.length} sources`)
      } else {
        console.error('Perplexity API error:', perplexityResponse.status)
      }
    } catch (error) {
      console.error('Error fetching Perplexity research:', error)
    }

    // Step 3: Get conversation context for better responses
    let conversationContext = ""
    try {
      if (conversationId) {
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6)

        if (recentMessages && recentMessages.length > 0) {
          conversationContext = recentMessages
            .reverse()
            .map(msg => `${msg.role}: ${msg.content.substring(0, 200)}`)
            .join('\n')
        }
      }
    } catch (error) {
      console.error('Error fetching conversation context:', error)
    }

    // Step 4: Create comprehensive system prompt
    const systemPrompt = `You are an expert UAE Legal Research Assistant with access to real-time legal information. You specialize in UAE federal law, emirate-specific regulations, and particularly UAE employment law.

CURRENT UAE LEGAL RESEARCH:
${researchContext || "No current research available"}

INTERNAL LEGAL DOCUMENTS:
${documentContext || "No internal documents found"}

CONVERSATION CONTEXT:
${conversationContext || "New conversation"}

INSTRUCTIONS:
1. Provide accurate, current UAE legal information based on the research above
2. Always cite specific UAE laws, regulations, and official sources when available
3. Include article numbers, decree references, and official publication dates
4. Distinguish between federal UAE law and emirate-specific regulations
5. For employment matters, reference UAE Labor Law and MOHRE regulations
6. Always include proper legal disclaimers
7. Suggest when to consult qualified UAE lawyers
8. Provide practical, actionable advice within legal boundaries

RESPONSE FORMAT:
- Start with a direct answer to the user's question
- Include relevant legal citations with sources
- Provide practical implications and next steps
- End with appropriate legal disclaimers

CRITICAL: You provide legal information, not legal advice. Always recommend consulting qualified UAE legal professionals for specific matters.`

    // Step 5: Generate response using GPT-5
    console.log('Generating AI response with GPT-5...')
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        max_completion_tokens: 1500,
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await aiResponse.json()
    const finalResponse = data.choices[0].message.content

    // Step 6: Update query usage (fix the syntax error)
    try {
      // First get current value, then increment
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('queries_used')
        .eq('user_id', user.id)
        .single()
      
      if (currentProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ queries_used: (currentProfile.queries_used || 0) + 1 })
          .eq('user_id', user.id)
        
        if (updateError) {
          console.error('Error updating query usage:', updateError)
        }
      }
    } catch (queryError) {
      console.error('Error with query usage update:', queryError)
    }


    // Step 7: Log the successful interaction
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'ai_chat_query',
        resource_type: 'legal_chat',
        resource_id: conversationId,
        metadata: {
          message_length: message.length,
          has_research: !!researchContext,
          has_documents: !!documentContext,
          sources_count: researchSources.length
        }
      })
      .select()

    // Prepare source information
    const sourceInfo = {
      hasResearch: !!researchContext,
      hasDocuments: !!documentContext,
      sourcesCount: researchSources.length,
      researchSources: researchSources.slice(0, 5).map(source => ({
        title: source.title || 'UAE Legal Source',
        url: source.url || '',
        snippet: source.text?.substring(0, 150) || ''
      }))
    }

    console.log('Legal chat response generated successfully')

    return new Response(JSON.stringify({ 
      response: finalResponse,
      sources: {
        research: researchSources,
        documents: documentSources
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in legal-chat-enhanced function:', error)
    
    // Return a helpful error response
    const errorMessage = error.message.includes('API key') 
      ? 'Service temporarily unavailable. Please try again later.'
      : 'Unable to process your legal query at this time. Please try again.'

    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
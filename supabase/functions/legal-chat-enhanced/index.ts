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

    // Check credit limits with rollover support
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("queries_used, max_credits_per_period, rollover_credits, credit_rollover_enabled")
      .eq("user_id", user.id)

    if (profileError || !profileData || profileData.length === 0) {
      throw new Error("Unable to fetch user profile")
    }

    const profile = profileData[0]
    const creditsUsed = profile.queries_used || 0
    const rolloverCredits = profile.rollover_credits || 0
    const creditsLimit = profile.max_credits_per_period || 10
    const totalAvailableCredits = creditsLimit + rolloverCredits

    // Detect query complexity (basic = 1 credit, complex = 2 credits)
    const messageLength = message?.length || 0
    const isComplexQuery = messageLength > 200 || 
                          /\b(explain|analyze|compare|detailed|comprehensive|multiple|several)\b/i.test(message || '')
    const creditCost = isComplexQuery ? 2 : 1
    
    console.log(`Query complexity: ${isComplexQuery ? 'complex' : 'basic'}, cost: ${creditCost} credits`)

    if (creditsUsed + creditCost > totalAvailableCredits) {
      console.log("Insufficient credits for user:", user.id, `Need ${creditCost}, have ${totalAvailableCredits - creditsUsed}`)
      return new Response(
        JSON.stringify({
          error: `Insufficient credits. This ${isComplexQuery ? 'complex' : 'basic'} query requires ${creditCost} credit${creditCost > 1 ? 's' : ''}. Please upgrade your plan or wait for your credits to reset.`,
          code: "INSUFFICIENT_CREDITS",
          required: creditCost,
          available: totalAvailableCredits - creditsUsed
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Step 1: Search internal documents using embedding similarity
    let documentContext = ""
    let documentSources: any[] = []
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
        
        // Store document sources for response
        documentSources = similarDocs.map((doc: any) => ({
          title: doc.title || 'Legal Document',
          category: doc.category || 'legal',
          content: doc.content?.substring(0, 200) || '',
          similarity: doc.similarity || 0
        }))
        
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
      
      // Search using Perplexity sonar-pro model with UAE government domain filters
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a UAE legal research assistant. ONLY cite information from official UAE government sources, federal gazettes, and official legal portals. Prioritize uaelegislation.gov.ae, u.ae, moj.gov.ae, and elaws.moj.gov.ae domains. Do not use news articles or unofficial sources.'
            },
            {
              role: 'user',
              content: perplexityQuery
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          search_domain_filter: [
            'uaelegislation.gov.ae',  // Primary federal legislation database
            'u.ae',                    // Official UAE government portal
            'moj.gov.ae',              // Ministry of Justice
            'elaws.moj.gov.ae',        // Electronic Laws Portal
            'dfsaen.thomsonreuters.com', // DIFC laws
            'dlp.dubai.gov.ae',        // Dubai legislation portal
            'en.adgm.thomsonreuters.com', // ADGM laws
            'adgm.com',                // ADGM official framework
            'mohre.gov.ae',            // Ministry of Human Resources
            'economy.gov.ae',          // Ministry of Economy
            'uaecabinet.ae'            // UAE Cabinet
          ],
          return_citations: true
        }),
      })

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json()
        console.log('Perplexity response keys:', Object.keys(perplexityData))
        
        if (perplexityData.choices && perplexityData.choices[0]) {
          researchContext = perplexityData.choices[0].message.content
          
          // Extract sources from search_results (not citations)
          if (perplexityData.search_results && perplexityData.search_results.length > 0) {
            researchSources = perplexityData.search_results.map((result: any) => ({
              title: result.title || 'UAE Legal Source',
              url: result.url || '',
              text: result.content || `Source from ${result.title || 'UAE Legal Database'}`
            }))
          }
          
          console.log(`Perplexity research completed with ${researchSources.length} sources`)
        }
      } else {
        const errorData = await perplexityResponse.json()
        console.error('Perplexity API error:', perplexityResponse.status, errorData)
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

    // Step 5: Generate response using GPT-4o
    console.log('Generating AI response with GPT-4o...')
    let finalResponse = ""
    
    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1500,
        }),
      })

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json()
        console.error('OpenAI API error:', errorData)
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await aiResponse.json()
      console.log('OpenAI response received, choices length:', data.choices?.length)
      
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        finalResponse = data.choices[0].message.content.trim()
        console.log('AI response length:', finalResponse.length)
      }
      
      // Fallback if empty response
      if (!finalResponse) {
        console.log('Empty response from GPT-4o, providing fallback')
        finalResponse = "I apologize, but I'm unable to process your legal query at this moment. This could be due to temporary service limitations. Please try rephrasing your question or contact a qualified UAE legal professional for immediate assistance."
      }
      
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      finalResponse = "I apologize, but there was an error processing your legal query. Please try again later or consult with a qualified UAE legal professional for immediate assistance."
    }

    // Step 6: Update credit usage - deduct from rollover first, then from regular credits
    try {
      let newCreditsUsed = creditsUsed
      let newRolloverCredits = rolloverCredits
      
      if (rolloverCredits >= creditCost) {
        // Deduct from rollover credits first
        newRolloverCredits = rolloverCredits - creditCost
      } else if (rolloverCredits > 0) {
        // Use remaining rollover credits, then regular credits
        const remainingCost = creditCost - rolloverCredits
        newRolloverCredits = 0
        newCreditsUsed = creditsUsed + remainingCost
      } else {
        // Use regular credits
        newCreditsUsed = creditsUsed + creditCost
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          queries_used: newCreditsUsed,
          rollover_credits: newRolloverCredits
        })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('Error updating credit usage:', updateError)
      }
      
      console.log(`Credits updated: used ${creditsUsed} -> ${newCreditsUsed}, rollover ${rolloverCredits} -> ${newRolloverCredits}`)
    } catch (creditError) {
      console.error('Error with credit usage update:', creditError)
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
          sources_count: researchSources.length,
          credit_cost: creditCost,
          query_complexity: isComplexQuery ? 'complex' : 'basic'
        }
      })
      .select()

    // Prepare source information - match frontend expected format
    const sourceInfo = {
      research: researchSources.slice(0, 5).map(source => ({
        title: source.title || 'UAE Legal Source',
        url: source.url || '',
        snippet: source.text?.substring(0, 150) || ''
      })),
      documents: documentSources.map(doc => ({
        title: doc.title,
        category: doc.category,
        similarity: doc.similarity
      }))
    }

    // Step 8: Analyze message for letter generation opportunity
    let letterSuggestion = null
    try {
      console.log('Analyzing message for letter opportunities...')
      
      // Get conversation history for context
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const conversationHistory = recentMessages?.reverse() || []

      const analysisResponse = await supabase.functions.invoke('analyze-message-for-letter', {
        body: { 
          message,
          conversationHistory 
        }
      })

      if (analysisResponse.data && analysisResponse.data.shouldSuggestLetter) {
        letterSuggestion = {
          letterType: analysisResponse.data.letterType,
          confidence: analysisResponse.data.confidence,
          reasoning: analysisResponse.data.reasoning,
          suggestedTitle: analysisResponse.data.suggestedTitle
        }
        console.log('Letter opportunity detected:', letterSuggestion)
      }
    } catch (error) {
      console.error('Error analyzing for letter opportunity:', error)
      // Don't fail the entire request if letter analysis fails
    }

    console.log('Legal chat response generated successfully')

    return new Response(JSON.stringify({ 
      response: finalResponse,
      sources: {
        research: researchSources.slice(0, 5).map(source => ({
          title: source.title || 'UAE Legal Source',
          url: source.url || '',
          snippet: source.text?.substring(0, 150) || ''
        })),
        documents: documentSources
      },
      suggestedLetter: letterSuggestion,
      creditCost,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in legal-chat-enhanced function:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    })
    
    // Return a helpful error response
    const errorMessage = error.message.includes('API key') 
      ? 'Service temporarily unavailable. Please try again later.'
      : 'Unable to process your legal query at this time. Please try again.'

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

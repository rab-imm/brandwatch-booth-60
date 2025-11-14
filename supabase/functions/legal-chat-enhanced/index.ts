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

    // Step 2: Get real-time research from Perplexity
    let researchContext = ""
    let researchSources: any[] = []
    try {
      console.log('Fetching real-time legal research...')
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
              content: 'You are a legal research assistant working for graysen. ONLY cite information from official UAE government sources, federal gazettes, and official legal portals. Prioritize uaelegislation.gov.ae, u.ae, moj.gov.ae, and elaws.moj.gov.ae domains. Do not use news articles or unofficial sources.'
            },
            {
              role: 'user',
              content: perplexityQuery
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          search_domain_filter: [
            // === PRIMARY OFFICIAL SOURCES ===
            'uaelegislation.gov.ae',        // Federal legislation database
            'u.ae',                          // Official UAE government portal
            'moj.gov.ae',                    // Ministry of Justice
            'elaws.moj.gov.ae',              // Electronic Laws Portal
            'dlp.dubai.gov.ae',              // Dubai legislation portal
            'mohre.gov.ae',                  // Ministry of Human Resources
            'economy.gov.ae',                // Ministry of Economy
            'uaecabinet.ae',                 // UAE Cabinet
            
            // === FREE ZONES & SPECIAL JURISDICTIONS ===
            'dfsaen.thomsonreuters.com',    // DIFC laws (Thomson Reuters)
            'difc.com',                      // DIFC business laws & regulations
            'difccourts.ae',                 // DIFC Courts case law
            'en.adgm.thomsonreuters.com',   // ADGM laws (Thomson Reuters)
            'adgm.com',                      // ADGM official framework
            
            // === COURTS & CASE LAW ===
            'dc.gov.ae',                     // Dubai Courts verdicts
            
            // === REPUTABLE LAW FIRM INSIGHTS ===
            'tamimi.com',                    // Al Tamimi & Company
            'hadefpartners.com',             // Hadef & Partners
            'whitecase.com',                 // White & Case
            'galadarilaw.com',               // Galadari Law
            'pinsentmasons.com',             // Pinsent Masons
            'bsalaw.com',                    // BSA Law
            'alsuwaidi.ae',                  // Al Suwaidi & Company
            'habibalmulla.com'               // Habib Al Mulla & Partners
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
    const systemPrompt = `You are an expert legal assistant for graysen with access to real-time legal information. You specialize in UAE federal law, emirate-specific regulations, and particularly UAE employment law.

Your responses are informed by:
- Official UAE government sources and legislation databases
- DIFC and ADGM regulations and case law from official sources and Thomson Reuters
- Dubai Courts judgments and DIFC Courts precedents
- Analysis from leading UAE law firms (Al Tamimi & Company, Hadef & Partners, White & Case, Galadari Law, Pinsent Masons, BSA Law, Al Suwaidi & Company, Habib Al Mulla & Partners)

CURRENT LEGAL RESEARCH:
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
6. Reference court judgments and case law when relevant (DIFC Courts, Dubai Courts)
7. Always include proper legal disclaimers
8. Suggest when to consult qualified UAE lawyers
9. Provide practical, actionable advice within legal boundaries

RESPONSE FORMAT:
- Start with a direct answer to the user's question
- Include relevant legal citations with sources
- Reference applicable case law or court precedents when relevant
- Provide practical implications and next steps
- End with appropriate legal disclaimers

CRITICAL: You provide legal information, not legal advice. Always recommend consulting qualified UAE legal professionals for specific matters.`

    // Step 5: Update credits BEFORE streaming starts
    try {
      let newCreditsUsed = creditsUsed
      let newRolloverCredits = rolloverCredits
      
      if (rolloverCredits >= creditCost) {
        newRolloverCredits = rolloverCredits - creditCost
      } else if (rolloverCredits > 0) {
        const remainingCost = creditCost - rolloverCredits
        newRolloverCredits = 0
        newCreditsUsed = creditsUsed + remainingCost
      } else {
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

    // Step 6: Log the interaction
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

    // Step 7: Generate streaming response using GPT-4o
    console.log('Generating AI response with GPT-4o (streaming)...')
    
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
        stream: true
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    // Stream the response back to client
    const reader = aiResponse.body?.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body to stream')
    }

    // Prepare letter analysis before streaming
    let letterSuggestion = null
    try {
      const { data: analysisResult } = await supabase.functions.invoke('analyze-message-for-letter', {
        body: { message, response: "" }
      })
      
      if (analysisResult && analysisResult.shouldSuggest) {
        letterSuggestion = analysisResult
        console.log('Letter suggestion available:', letterSuggestion)
      }
    } catch (error) {
      console.error('Error analyzing message for letter:', error)
    }

    // Prepare source information
    const sourceInfo = {
      research: researchSources.slice(0, 5).map(source => ({
        title: source.title || 'UAE Legal Source',
        url: source.url || '',
        snippet: source.text?.substring(0, 150) || '',
        domain: source.url ? new URL(source.url).hostname : 'uae-legal-source'
      })),
      documents: documentSources
    }

    // Create a TransformStream to handle SSE formatting
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ""
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  // Send final metadata
                  const metadata = {
                    sources: sourceInfo,
                    suggestedLetter: letterSuggestion,
                    creditCost,
                    timestamp: new Date().toISOString()
                  }
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: metadata })}\n\n`)
                  )
                  
                  // Save complete AI response to database
                  await supabase
                    .from('messages')
                    .insert({
                      user_id: user.id,
                      conversation_id: conversationId,
                      role: 'assistant',
                      content: fullResponse,
                      metadata: {
                        sources: sourceInfo,
                        suggestedLetter: letterSuggestion
                      }
                    })
                  
                  // Update conversation timestamp
                  await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', conversationId)
                  
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                  controller.close()
                  break
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  
                  if (content) {
                    fullResponse += content
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
                    )
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e)
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    // Return SSE stream
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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

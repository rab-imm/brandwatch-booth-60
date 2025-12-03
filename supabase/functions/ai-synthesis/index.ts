import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  analyzeWithGemini, 
  analyzeWithGrok, 
  analyzeWithPerplexity,
  detectLanguages,
  type AIAnalysisResult,
  type LanguageDetectionResult,
  type BilingualAnalysis
} from "../_shared/ai-providers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SynthesisRequest {
  document_text: string;
  context?: string;
  providers?: ('gemini' | 'grok' | 'perplexity')[];
  language_info?: LanguageDetectionResult;
}

interface SynthesisResult {
  synthesized_analysis: {
    document_classification: any;
    risk_findings: any[];
    compliance_issues: any[];
    overall_confidence: number;
    synthesis_reasoning: string;
    bilingual_synthesis?: BilingualSynthesis;
  };
  sources_used: string[];
  source_responses: Record<string, AIAnalysisResult>;
  consensus_items: any[];
  disagreements: any[];
  processing_summary: {
    total_time_ms: number;
    successful_providers: number;
    failed_providers: string[];
  };
  language_detection: LanguageDetectionResult;
}

interface BilingualSynthesis {
  is_bilingual: boolean;
  languages_detected: string[];
  primary_language: string;
  arabic_percentage: number;
  translation_consistency_consensus: string;
  arabic_precedent_risks: {
    clause: string;
    arabic_meaning: string;
    english_meaning: string;
    legal_implication: string;
    severity: string;
    sources_detecting: string[];
  }[];
  untranslatable_terms: {
    arabic_term: string;
    approximate_english: string;
    legal_significance: string;
    sources_detecting: string[];
  }[];
  bilingual_risk_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { 
      document_text, 
      context = '', 
      providers = ['gemini', 'grok', 'perplexity'],
      language_info 
    }: SynthesisRequest = await req.json();

    if (!document_text || document_text.trim().length === 0) {
      throw new Error('document_text is required');
    }

    // Detect languages if not provided
    const languageDetection = language_info || detectLanguages(document_text);
    
    console.log(`Language detection: ${languageDetection.arabicPercentage}% Arabic, ${languageDetection.englishPercentage}% English`);
    console.log(`Primary language: ${languageDetection.primaryLanguage}, Bilingual: ${languageDetection.isBilingual}`);
    console.log(`Starting AI synthesis with providers: ${providers.join(', ')}`);

    // Call all AI providers in parallel with language context
    const analysisPromises = [];
    
    if (providers.includes('gemini')) {
      analysisPromises.push(analyzeWithGemini(document_text, context, languageDetection));
    }
    
    if (providers.includes('grok')) {
      analysisPromises.push(analyzeWithGrok(document_text, context, languageDetection));
    }
    
    if (providers.includes('perplexity')) {
      analysisPromises.push(analyzeWithPerplexity(document_text, context, languageDetection));
    }

    // Wait for all analyses (handle failures gracefully)
    const results = await Promise.allSettled(analysisPromises);
    
    // Extract successful results
    const successfulResults: AIAnalysisResult[] = results
      .filter((result): result is PromiseFulfilledResult<AIAnalysisResult> => 
        result.status === 'fulfilled' && !result.value.error
      )
      .map(result => result.value);

    const failedProviders = results
      .filter((result, index) => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.error)
      )
      .map((_, index) => providers[index]);

    if (successfulResults.length === 0) {
      throw new Error('All AI providers failed to analyze the document');
    }

    console.log(`Successful analyses: ${successfulResults.length}/${providers.length}`);
    console.log(`Provider results: ${successfulResults.map(r => `${r.provider} (${r.confidence_score}%)`).join(', ')}`);

    // Prepare source responses
    const sourceResponses: Record<string, AIAnalysisResult> = {};
    successfulResults.forEach(result => {
      sourceResponses[result.provider] = result;
    });

    // Build bilingual synthesis section
    const bilingualSynthesisSection = languageDetection.isBilingual ? `

CRITICAL BILINGUAL ANALYSIS SECTION:
This is a BILINGUAL document (${languageDetection.arabicPercentage}% Arabic, ${languageDetection.englishPercentage}% English).

⚠️ UAE LEGAL PRECEDENCE RULE: Arabic version ALWAYS takes legal precedence in UAE courts.

BILINGUAL FINDINGS FROM EACH PROVIDER:
${successfulResults.map(result => `
--- ${result.provider.toUpperCase()} Bilingual Analysis ---
${result.bilingual_analysis ? JSON.stringify(result.bilingual_analysis, null, 2) : 'No bilingual analysis provided'}
`).join('\n')}

BILINGUAL SYNTHESIS REQUIREMENTS:
1. Translation Consistency: Determine consensus on translation quality
   - If 2+ providers flag "major_discrepancies" → mark as CRITICAL
   - If providers disagree on consistency → investigate further
   
2. Arabic-Precedent Risks: Synthesize all identified risks
   - Merge duplicate findings across providers
   - Keep HIGHEST severity when duplicates exist
   - Track which providers identified each risk
   - Arabic-specific risks are HIGH PRIORITY
   
3. Untranslatable Terms: Compile complete list
   - Deduplicate across providers
   - Note which providers identified each term
   - These are inherent legal risks
   
4. Calculate Bilingual Risk Score (0-100):
   - major_discrepancies = +40 points
   - Each critical arabic_precedent_risk = +15 points
   - Each high arabic_precedent_risk = +10 points
   - Each untranslatable_term = +5 points
   - Cap at 100

5. CRITICAL: Flag any finding where Arabic version imposes greater obligations or penalties than English version
` : '';

    // Use Gemini as synthesis AI to evaluate all responses
    const synthesisPrompt = `You are a meta-analyzer evaluating multiple AI analyses of a UAE legal document. You must synthesize the following ${successfulResults.length} analyses into a single, best analysis.

ANALYSES TO SYNTHESIZE:
${successfulResults.map((result, idx) => `
--- Analysis ${idx + 1} from ${result.provider.toUpperCase()} (Confidence: ${result.confidence_score}%) ---
Document Classification: ${JSON.stringify(result.document_classification)}
Risk Findings: ${JSON.stringify(result.risk_findings)}
Compliance Issues: ${JSON.stringify(result.compliance_issues)}
Reasoning: ${result.reasoning}
`).join('\n')}
${bilingualSynthesisSection}

SYNTHESIS INSTRUCTIONS:
1. Document Classification: Choose the most accurate classification. Consider:
   - Which provider gave the highest confidence?
   - Do multiple providers agree?
   - Which reasoning is most specific to UAE law?

2. Risk Findings: Merge all unique risk findings:
   - Deduplicate similar findings
   - Keep the most severe severity rating when duplicates exist
   - Prefer findings with specific UAE law article references
   - Attribute source provider to each finding
   - ${languageDetection.isBilingual ? 'PRIORITIZE bilingual/translation risks - these are CRITICAL' : ''}

3. Compliance Issues: Combine all unique compliance issues:
   - Deduplicate similar issues
   - Keep most severe severity
   - Prefer specific over generic issues

4. Consensus Items: List findings where multiple providers agree (mark as high confidence)

5. Disagreements: Note significant disagreements between providers

6. Overall Confidence: Calculate based on:
   - Agreement level between providers (high agreement = high confidence)
   - Individual provider confidence scores
   - Specificity of findings
   ${languageDetection.isBilingual ? '- REDUCE confidence if providers disagree on bilingual issues' : ''}

Provide your synthesis in the requested JSON format.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build tool schema with optional bilingual fields
    const toolSchema: any = {
      type: 'object',
      properties: {
        document_classification: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            category: { type: 'string' },
            confidence: { type: 'number' },
            reasoning: { type: 'string' },
            sources_agreeing: { type: 'array', items: { type: 'string' } }
          },
          required: ['document_type', 'category', 'confidence', 'reasoning', 'sources_agreeing']
        },
        risk_findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              article_reference: { type: 'string' },
              recommendation: { type: 'string' },
              source_providers: { type: 'array', items: { type: 'string' } },
              is_bilingual_risk: { type: 'boolean' }
            },
            required: ['title', 'description', 'severity', 'recommendation', 'source_providers']
          }
        },
        compliance_issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clause_type: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' },
              source_providers: { type: 'array', items: { type: 'string' } }
            },
            required: ['clause_type', 'issue', 'severity', 'recommendation', 'source_providers']
          }
        },
        consensus_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              agreed_by: { type: 'array', items: { type: 'string' } }
            },
            required: ['finding', 'agreed_by']
          }
        },
        disagreements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              provider_opinions: { 
                type: 'object',
                additionalProperties: { type: 'string' }
              }
            },
            required: ['aspect', 'provider_opinions']
          }
        },
        overall_confidence: { type: 'number' },
        synthesis_reasoning: { type: 'string' }
      },
      required: ['document_classification', 'risk_findings', 'compliance_issues', 'consensus_items', 'disagreements', 'overall_confidence', 'synthesis_reasoning']
    };

    // Add bilingual synthesis schema if document is bilingual
    if (languageDetection.isBilingual) {
      toolSchema.properties.bilingual_synthesis = {
        type: 'object',
        properties: {
          is_bilingual: { type: 'boolean' },
          languages_detected: { type: 'array', items: { type: 'string' } },
          primary_language: { type: 'string' },
          arabic_percentage: { type: 'number' },
          translation_consistency_consensus: { type: 'string', enum: ['consistent', 'minor_discrepancies', 'major_discrepancies'] },
          arabic_precedent_risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                clause: { type: 'string' },
                arabic_meaning: { type: 'string' },
                english_meaning: { type: 'string' },
                legal_implication: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                sources_detecting: { type: 'array', items: { type: 'string' } }
              },
              required: ['clause', 'arabic_meaning', 'english_meaning', 'legal_implication', 'severity', 'sources_detecting']
            }
          },
          untranslatable_terms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                arabic_term: { type: 'string' },
                approximate_english: { type: 'string' },
                legal_significance: { type: 'string' },
                sources_detecting: { type: 'array', items: { type: 'string' } }
              },
              required: ['arabic_term', 'approximate_english', 'legal_significance', 'sources_detecting']
            }
          },
          bilingual_risk_score: { type: 'number' }
        },
        required: ['is_bilingual', 'languages_detected', 'primary_language', 'translation_consistency_consensus', 'arabic_precedent_risks', 'untranslatable_terms', 'bilingual_risk_score']
      };
    }

    const synthesisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a meta-analyzer that synthesizes multiple AI analyses into the best possible result. For bilingual UAE documents, pay special attention to Arabic-English discrepancies as these have critical legal implications.' },
          { role: 'user', content: synthesisPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'synthesize_analyses',
            description: 'Synthesize multiple AI analyses into a single best analysis with bilingual evaluation',
            parameters: toolSchema
          }
        }],
        tool_choice: { type: 'function', function: { name: 'synthesize_analyses' } }
      }),
    });

    if (!synthesisResponse.ok) {
      const errorText = await synthesisResponse.text();
      throw new Error(`Synthesis API error: ${synthesisResponse.status} - ${errorText}`);
    }

    const synthesisData = await synthesisResponse.json();
    const synthesisToolCall = synthesisData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!synthesisToolCall) {
      throw new Error('No tool call in synthesis response');
    }

    const synthesizedAnalysis = JSON.parse(synthesisToolCall.function.arguments);

    const totalTime = Date.now() - startTime;

    // Log bilingual findings if applicable
    if (languageDetection.isBilingual && synthesizedAnalysis.bilingual_synthesis) {
      console.log(`Bilingual synthesis completed:`);
      console.log(`- Translation consistency: ${synthesizedAnalysis.bilingual_synthesis.translation_consistency_consensus}`);
      console.log(`- Arabic-precedent risks: ${synthesizedAnalysis.bilingual_synthesis.arabic_precedent_risks?.length || 0}`);
      console.log(`- Untranslatable terms: ${synthesizedAnalysis.bilingual_synthesis.untranslatable_terms?.length || 0}`);
      console.log(`- Bilingual risk score: ${synthesizedAnalysis.bilingual_synthesis.bilingual_risk_score}`);
    }

    const result: SynthesisResult = {
      synthesized_analysis: synthesizedAnalysis,
      sources_used: successfulResults.map(r => r.provider),
      source_responses: sourceResponses,
      consensus_items: synthesizedAnalysis.consensus_items || [],
      disagreements: synthesizedAnalysis.disagreements || [],
      processing_summary: {
        total_time_ms: totalTime,
        successful_providers: successfulResults.length,
        failed_providers: failedProviders
      },
      language_detection: languageDetection
    };

    console.log(`AI synthesis completed in ${totalTime}ms with ${successfulResults.length} sources`);
    console.log(`Overall confidence: ${synthesizedAnalysis.overall_confidence}%`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI synthesis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

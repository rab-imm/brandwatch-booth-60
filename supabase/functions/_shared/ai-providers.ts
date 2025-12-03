// Shared AI Provider Functions for Multi-Source Analysis

export interface DocumentClassification {
  document_type: string;
  category: string;
  confidence: number;
  reasoning: string;
}

export interface RiskFinding {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  article_reference: string | null;
  recommendation: string;
}

export interface ComplianceIssue {
  clause_type: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

// Bilingual Analysis Types
export interface BilingualAnalysis {
  languages_detected: ('arabic' | 'english')[];
  primary_language: 'arabic' | 'english' | 'mixed';
  arabic_percentage: number;
  translation_consistency: 'consistent' | 'minor_discrepancies' | 'major_discrepancies' | 'not_applicable';
  arabic_precedent_risks: {
    clause: string;
    arabic_meaning: string;
    english_meaning: string;
    legal_implication: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }[];
  untranslatable_terms: {
    arabic_term: string;
    approximate_english: string;
    legal_significance: string;
  }[];
}

export interface LanguageDetectionResult {
  hasArabic: boolean;
  hasEnglish: boolean;
  arabicPercentage: number;
  englishPercentage: number;
  primaryLanguage: 'arabic' | 'english' | 'mixed';
  isBilingual: boolean;
}

export interface AIAnalysisResult {
  provider: 'gemini' | 'grok' | 'perplexity';
  document_classification: DocumentClassification;
  risk_findings: RiskFinding[];
  compliance_issues: ComplianceIssue[];
  confidence_score: number;
  reasoning: string;
  raw_response: string;
  processing_time_ms: number;
  error?: string;
  bilingual_analysis?: BilingualAnalysis;
}

/**
 * Detect languages present in document text
 */
export function detectLanguages(text: string): LanguageDetectionResult {
  // Arabic Unicode ranges: Arabic (0600-06FF), Arabic Supplement (0750-077F), Arabic Extended (08A0-08FF)
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  // English/Latin characters
  const englishRegex = /[a-zA-Z]/g;
  
  const arabicMatches = text.match(arabicRegex) || [];
  const englishMatches = text.match(englishRegex) || [];
  
  const totalAlphaChars = arabicMatches.length + englishMatches.length;
  
  if (totalAlphaChars === 0) {
    return {
      hasArabic: false,
      hasEnglish: false,
      arabicPercentage: 0,
      englishPercentage: 0,
      primaryLanguage: 'english',
      isBilingual: false
    };
  }
  
  const arabicPercentage = Math.round((arabicMatches.length / totalAlphaChars) * 100);
  const englishPercentage = Math.round((englishMatches.length / totalAlphaChars) * 100);
  
  // Determine primary language
  let primaryLanguage: 'arabic' | 'english' | 'mixed';
  if (arabicPercentage > 70) {
    primaryLanguage = 'arabic';
  } else if (englishPercentage > 70) {
    primaryLanguage = 'english';
  } else {
    primaryLanguage = 'mixed';
  }
  
  // Document is bilingual if both languages have significant presence (>15%)
  const isBilingual = arabicPercentage > 15 && englishPercentage > 15;
  
  return {
    hasArabic: arabicPercentage > 5,
    hasEnglish: englishPercentage > 5,
    arabicPercentage,
    englishPercentage,
    primaryLanguage,
    isBilingual
  };
}

const LEGAL_ANALYSIS_PROMPT = `You are a UAE legal expert analyzing contracts and legal documents.

⚠️ BILINGUAL DOCUMENT HANDLING (CRITICAL FOR UAE):
This document may contain Arabic (العربية) and English text. In UAE law:
1. Arabic version ALWAYS takes LEGAL PRECEDENCE in disputes (per UAE Civil Procedures Law)
2. You MUST analyze BOTH language versions if present
3. Flag any translation discrepancies - these are HIGH RISK issues
4. Certain Arabic legal terms have no exact English equivalent and may alter legal meaning

ANALYSIS REQUIREMENTS:
1. Document Classification: Type, category, confidence level
2. Risk Findings: Material legal risks, unfair terms, regulatory compliance gaps
3. Compliance Issues: Specific clause problems with UAE law references
4. Bilingual Analysis (if applicable):
   - Languages detected and their proportion
   - Translation consistency assessment
   - Arabic-precedent risks (where Arabic differs from English)
   - Untranslatable legal concepts that may affect interpretation
5. Overall Confidence: Your confidence in this analysis (0-100)
6. Reasoning: Brief explanation of your analysis approach

Focus on substantive legal issues, not just format compliance. Consider UAE Civil Code, Commercial Code, PDPL, Labor Law, and relevant regulations.

CRITICAL BILINGUAL RISKS TO FLAG:
- Different penalty amounts in Arabic vs English
- Different notice periods between versions
- Jurisdiction/governing law discrepancies
- Party obligations that differ between languages
- Definitions that vary between Arabic and English sections`;

const BILINGUAL_ANALYSIS_PROMPT_ADDITION = `

ADDITIONAL BILINGUAL FOCUS:
- Compare Arabic and English sections for semantic equivalence
- Identify any Arabic legal terms (مصطلحات قانونية) that may be mistranslated
- Flag clauses where Arabic is more/less restrictive than English
- Note any untranslatable Islamic law concepts (Sharia terms like "غرر" / uncertainty)
- Identify if document follows UAE bilingual drafting standards`;

/**
 * Analyze document with Gemini via Lovable AI Gateway
 */
export async function analyzeWithGemini(
  documentText: string,
  context: string = '',
  languageInfo?: LanguageDetectionResult
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context with language information
    const bilingualContext = languageInfo?.isBilingual 
      ? `\n\n⚠️ BILINGUAL DOCUMENT DETECTED: ${languageInfo.arabicPercentage}% Arabic, ${languageInfo.englishPercentage}% English. Primary: ${languageInfo.primaryLanguage}. APPLY BILINGUAL ANALYSIS RULES.`
      : '';

    const fullPrompt = languageInfo?.isBilingual 
      ? LEGAL_ANALYSIS_PROMPT + BILINGUAL_ANALYSIS_PROMPT_ADDITION
      : LEGAL_ANALYSIS_PROMPT;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: `Context: ${context}${bilingualContext}\n\nDocument Text:\n${documentText.substring(0, 8000)}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_legal_document',
            description: 'Analyze legal document for classification, risks, and bilingual issues',
            parameters: {
              type: 'object',
              properties: {
                document_classification: {
                  type: 'object',
                  properties: {
                    document_type: { type: 'string' },
                    category: { type: 'string' },
                    confidence: { type: 'number' },
                    reasoning: { type: 'string' }
                  },
                  required: ['document_type', 'category', 'confidence', 'reasoning']
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
                      is_bilingual_issue: { type: 'boolean' }
                    },
                    required: ['title', 'description', 'severity', 'recommendation']
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
                      recommendation: { type: 'string' }
                    },
                    required: ['clause_type', 'issue', 'severity', 'recommendation']
                  }
                },
                bilingual_analysis: {
                  type: 'object',
                  properties: {
                    languages_detected: { type: 'array', items: { type: 'string', enum: ['arabic', 'english'] } },
                    primary_language: { type: 'string', enum: ['arabic', 'english', 'mixed'] },
                    arabic_percentage: { type: 'number' },
                    translation_consistency: { type: 'string', enum: ['consistent', 'minor_discrepancies', 'major_discrepancies', 'not_applicable'] },
                    arabic_precedent_risks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          clause: { type: 'string' },
                          arabic_meaning: { type: 'string' },
                          english_meaning: { type: 'string' },
                          legal_implication: { type: 'string' },
                          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                        },
                        required: ['clause', 'arabic_meaning', 'english_meaning', 'legal_implication', 'severity']
                      }
                    },
                    untranslatable_terms: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          arabic_term: { type: 'string' },
                          approximate_english: { type: 'string' },
                          legal_significance: { type: 'string' }
                        },
                        required: ['arabic_term', 'approximate_english', 'legal_significance']
                      }
                    }
                  }
                },
                confidence_score: { type: 'number' },
                reasoning: { type: 'string' }
              },
              required: ['document_classification', 'risk_findings', 'compliance_issues', 'confidence_score', 'reasoning']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_legal_document' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in Gemini response');
    }

    const analysisData = JSON.parse(toolCall.function.arguments);
    const processingTime = Date.now() - startTime;

    return {
      provider: 'gemini',
      document_classification: analysisData.document_classification,
      risk_findings: analysisData.risk_findings || [],
      compliance_issues: analysisData.compliance_issues || [],
      confidence_score: analysisData.confidence_score,
      reasoning: analysisData.reasoning,
      raw_response: JSON.stringify(data),
      processing_time_ms: processingTime,
      bilingual_analysis: analysisData.bilingual_analysis
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Gemini analysis error:', error);
    return {
      provider: 'gemini',
      document_classification: {
        document_type: 'unknown',
        category: 'error',
        confidence: 0,
        reasoning: 'Analysis failed'
      },
      risk_findings: [],
      compliance_issues: [],
      confidence_score: 0,
      reasoning: 'Analysis failed due to error',
      raw_response: '',
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze document with Grok via xAI
 */
export async function analyzeWithGrok(
  documentText: string,
  context: string = '',
  languageInfo?: LanguageDetectionResult
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const xaiApiKey = Deno.env.get('XAI_API_KEY');
    if (!xaiApiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    // Build bilingual context
    const bilingualContext = languageInfo?.isBilingual 
      ? `\n\n⚠️ BILINGUAL DOCUMENT: ${languageInfo.arabicPercentage}% Arabic, ${languageInfo.englishPercentage}% English. In UAE law, Arabic ALWAYS takes legal precedence. Flag any translation discrepancies as HIGH RISK.`
      : '';

    const bilingualJsonFields = languageInfo?.isBilingual
      ? `, bilingual_analysis: { languages_detected, primary_language, translation_consistency, arabic_precedent_risks: [{ clause, arabic_meaning, english_meaning, legal_implication, severity }], untranslatable_terms: [{ arabic_term, approximate_english, legal_significance }] }`
      : '';

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: LEGAL_ANALYSIS_PROMPT + (languageInfo?.isBilingual ? BILINGUAL_ANALYSIS_PROMPT_ADDITION : '') },
          { role: 'user', content: `Context: ${context}${bilingualContext}\n\nDocument Text:\n${documentText.substring(0, 8000)}\n\nProvide your analysis in JSON format with keys: document_classification, risk_findings, compliance_issues, confidence_score, reasoning${bilingualJsonFields}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Grok response');
    }

    // Parse JSON from response (Grok may wrap in markdown)
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
      analysisData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      throw new Error('Failed to parse Grok JSON response');
    }

    const processingTime = Date.now() - startTime;

    return {
      provider: 'grok',
      document_classification: analysisData.document_classification || {
        document_type: 'unknown',
        category: 'unclassified',
        confidence: 50,
        reasoning: 'Default classification'
      },
      risk_findings: analysisData.risk_findings || [],
      compliance_issues: analysisData.compliance_issues || [],
      confidence_score: analysisData.confidence_score || 50,
      reasoning: analysisData.reasoning || 'Analysis completed',
      raw_response: JSON.stringify(data),
      processing_time_ms: processingTime,
      bilingual_analysis: analysisData.bilingual_analysis
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Grok analysis error:', error);
    return {
      provider: 'grok',
      document_classification: {
        document_type: 'unknown',
        category: 'error',
        confidence: 0,
        reasoning: 'Analysis failed'
      },
      risk_findings: [],
      compliance_issues: [],
      confidence_score: 0,
      reasoning: 'Analysis failed due to error',
      raw_response: '',
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze document with Perplexity (real-time UAE legal research)
 */
export async function analyzeWithPerplexity(
  documentText: string,
  context: string = '',
  languageInfo?: LanguageDetectionResult
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    // Build bilingual context
    const bilingualContext = languageInfo?.isBilingual 
      ? `\n\n⚠️ BILINGUAL UAE DOCUMENT: ${languageInfo.arabicPercentage}% Arabic, ${languageInfo.englishPercentage}% English. Search for UAE precedents on Arabic-English contract discrepancies. Arabic version has LEGAL PRECEDENCE.`
      : '';

    const bilingualJsonFields = languageInfo?.isBilingual
      ? `, bilingual_analysis: { languages_detected, primary_language, translation_consistency, arabic_precedent_risks: [{ clause, arabic_meaning, english_meaning, legal_implication, severity }], untranslatable_terms: [{ arabic_term, approximate_english, legal_significance }] }`
      : '';

    // Extended UAE legal domains for Arabic search
    const searchDomains = languageInfo?.hasArabic 
      ? ['uae.gov.ae', 'dld.gov.ae', 'moec.gov.ae', 'adjd.gov.ae', 'dc.gov.ae', 'mohre.gov.ae', 'tamm.abudhabi']
      : ['uae.gov.ae', 'dld.gov.ae', 'moec.gov.ae'];

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: `${LEGAL_ANALYSIS_PROMPT}${languageInfo?.isBilingual ? BILINGUAL_ANALYSIS_PROMPT_ADDITION : ''}\n\nUse real-time web search to validate against current UAE laws and regulations. For bilingual documents, search for UAE court rulings on Arabic-English discrepancy cases.` },
          { role: 'user', content: `Context: ${context}${bilingualContext}\n\nDocument Text:\n${documentText.substring(0, 6000)}\n\nProvide analysis in JSON format with keys: document_classification, risk_findings, compliance_issues, confidence_score, reasoning${bilingualJsonFields}` }
        ],
        temperature: 0.2,
        search_domain_filter: searchDomains,
        search_recency_filter: 'year',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in Perplexity response');
    }

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
      analysisData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      throw new Error('Failed to parse Perplexity JSON response');
    }

    const processingTime = Date.now() - startTime;

    return {
      provider: 'perplexity',
      document_classification: analysisData.document_classification || {
        document_type: 'unknown',
        category: 'unclassified',
        confidence: 50,
        reasoning: 'Default classification'
      },
      risk_findings: analysisData.risk_findings || [],
      compliance_issues: analysisData.compliance_issues || [],
      confidence_score: analysisData.confidence_score || 50,
      reasoning: analysisData.reasoning || 'Analysis completed with real-time legal research',
      raw_response: JSON.stringify(data),
      processing_time_ms: processingTime,
      bilingual_analysis: analysisData.bilingual_analysis
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Perplexity analysis error:', error);
    return {
      provider: 'perplexity',
      document_classification: {
        document_type: 'unknown',
        category: 'error',
        confidence: 0,
        reasoning: 'Analysis failed'
      },
      risk_findings: [],
      compliance_issues: [],
      confidence_score: 0,
      reasoning: 'Analysis failed due to error',
      raw_response: '',
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

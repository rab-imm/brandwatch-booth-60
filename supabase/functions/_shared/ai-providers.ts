// Shared AI Provider Functions for Multi-Source Analysis

// ============= ERROR TYPES & LOGGING =============

export type AIErrorType = 
  | 'rate_limit'           // 429 - Too many requests
  | 'quota_exceeded'       // 402/403 - Payment/quota issues
  | 'network_error'        // Connection failed
  | 'timeout'              // Request timed out
  | 'api_key_invalid'      // 401 - Invalid API key
  | 'api_key_missing'      // No API key configured
  | 'server_error'         // 500+ - Server-side issues
  | 'parse_error'          // Failed to parse response
  | 'unknown';             // Other errors

export interface AIError {
  type: AIErrorType;
  message: string;
  userMessage: string;
  provider: string;
  statusCode?: number;
  retryAfter?: number;
  timestamp: string;
}

/**
 * Classify error type and generate user-friendly message
 */
export function classifyAIError(error: unknown, provider: string, statusCode?: number): AIError {
  const timestamp = new Date().toISOString();
  
  // Check for network/connectivity issues
  if (error instanceof TypeError && error.message.includes('fetch')) {
    console.error(`[${timestamp}] [${provider}] NETWORK ERROR: Unable to connect to AI server`, { error: error.message });
    return {
      type: 'network_error',
      message: error.message,
      userMessage: 'Unable to connect to AI server. Please check your internet connection and try again.',
      provider,
      timestamp
    };
  }
  
  // Check for timeout
  if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'))) {
    console.error(`[${timestamp}] [${provider}] TIMEOUT: AI request timed out`, { error: error.message });
    return {
      type: 'timeout',
      message: error.message,
      userMessage: 'AI server is taking too long to respond. Please try again in a moment.',
      provider,
      timestamp
    };
  }
  
  // Check status codes
  if (statusCode) {
    if (statusCode === 429) {
      console.error(`[${timestamp}] [${provider}] RATE LIMIT: Too many requests (429)`, { statusCode });
      return {
        type: 'rate_limit',
        message: `Rate limit exceeded (${statusCode})`,
        userMessage: 'AI service is currently busy. Please wait a moment and try again.',
        provider,
        statusCode,
        retryAfter: 30,
        timestamp
      };
    }
    
    if (statusCode === 402 || statusCode === 403) {
      console.error(`[${timestamp}] [${provider}] QUOTA EXCEEDED: Payment/quota issue (${statusCode})`, { statusCode });
      return {
        type: 'quota_exceeded',
        message: `Quota or payment issue (${statusCode})`,
        userMessage: 'AI service quota exceeded. Please contact support or try again later.',
        provider,
        statusCode,
        timestamp
      };
    }
    
    if (statusCode === 401) {
      console.error(`[${timestamp}] [${provider}] AUTH ERROR: Invalid API key (401)`, { statusCode });
      return {
        type: 'api_key_invalid',
        message: `Invalid API key (${statusCode})`,
        userMessage: 'AI service authentication failed. Please contact support.',
        provider,
        statusCode,
        timestamp
      };
    }
    
    if (statusCode >= 500) {
      console.error(`[${timestamp}] [${provider}] SERVER ERROR: AI server error (${statusCode})`, { statusCode });
      return {
        type: 'server_error',
        message: `Server error (${statusCode})`,
        userMessage: 'AI server is experiencing issues. Please try again in a few minutes.',
        provider,
        statusCode,
        timestamp
      };
    }
  }
  
  // Check for API key missing
  if (error instanceof Error && error.message.includes('not configured')) {
    console.error(`[${timestamp}] [${provider}] CONFIG ERROR: API key not configured`, { error: error.message });
    return {
      type: 'api_key_missing',
      message: error.message,
      userMessage: 'AI service is not properly configured. Please contact support.',
      provider,
      timestamp
    };
  }
  
  // Check for parse errors
  if (error instanceof Error && (error.message.includes('parse') || error.message.includes('JSON'))) {
    console.error(`[${timestamp}] [${provider}] PARSE ERROR: Failed to parse AI response`, { error: error.message });
    return {
      type: 'parse_error',
      message: error.message,
      userMessage: 'Received invalid response from AI. Please try again.',
      provider,
      timestamp
    };
  }
  
  // Unknown error
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${timestamp}] [${provider}] UNKNOWN ERROR: ${errorMessage}`, { error, statusCode });
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected error occurred with the AI service. Please try again.',
    provider,
    statusCode,
    timestamp
  };
}

/**
 * Log AI request start
 */
export function logAIRequestStart(provider: string, documentLength: number, context?: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${provider}] REQUEST START: Analyzing document (${documentLength} chars)`, {
    provider,
    documentLength,
    hasContext: !!context
  });
}

/**
 * Log AI request success
 */
export function logAIRequestSuccess(provider: string, processingTime: number, confidence: number): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${provider}] REQUEST SUCCESS: Completed in ${processingTime}ms (confidence: ${confidence}%)`, {
    provider,
    processingTime,
    confidence
  });
}

/**
 * Log AI request failure
 */
export function logAIRequestFailure(provider: string, error: AIError, processingTime: number): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${provider}] REQUEST FAILED: ${error.type} - ${error.message} (${processingTime}ms)`, {
    provider,
    errorType: error.type,
    errorMessage: error.message,
    userMessage: error.userMessage,
    statusCode: error.statusCode,
    processingTime
  });
}

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
  errorDetails?: AIError;
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
  const provider = 'gemini';
  
  logAIRequestStart(provider, documentText.length, context);
  
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

    console.log(`[${new Date().toISOString()}] [${provider}] Sending request to Lovable AI Gateway...`);
    
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

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const aiError = classifyAIError(new Error(errorText), provider, response.status);
      logAIRequestFailure(provider, aiError, processingTime);
      
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
        reasoning: aiError.userMessage,
        raw_response: errorText,
        processing_time_ms: processingTime,
        error: aiError.userMessage,
        errorDetails: aiError
      };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      const aiError = classifyAIError(new Error('No tool call in response'), provider);
      logAIRequestFailure(provider, aiError, processingTime);
      throw new Error('No tool call in Gemini response');
    }

    const analysisData = JSON.parse(toolCall.function.arguments);

    logAIRequestSuccess(provider, processingTime, analysisData.confidence_score || 0);

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
    const aiError = classifyAIError(error, provider);
    logAIRequestFailure(provider, aiError, processingTime);
    
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
      reasoning: aiError.userMessage,
      raw_response: '',
      processing_time_ms: processingTime,
      error: aiError.userMessage,
      errorDetails: aiError
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
  const provider = 'grok';
  
  logAIRequestStart(provider, documentText.length, context);
  
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

    console.log(`[${new Date().toISOString()}] [${provider}] Sending request to xAI API...`);

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

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const aiError = classifyAIError(new Error(errorText), provider, response.status);
      logAIRequestFailure(provider, aiError, processingTime);
      
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
        reasoning: aiError.userMessage,
        raw_response: errorText,
        processing_time_ms: processingTime,
        error: aiError.userMessage,
        errorDetails: aiError
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      const aiError = classifyAIError(new Error('No content in response'), provider);
      logAIRequestFailure(provider, aiError, processingTime);
      throw new Error('No content in Grok response');
    }

    // Parse JSON from response (Grok may wrap in markdown)
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
      analysisData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      const aiError = classifyAIError(new Error('Failed to parse JSON response'), provider);
      logAIRequestFailure(provider, aiError, processingTime);
      throw new Error('Failed to parse Grok JSON response');
    }

    logAIRequestSuccess(provider, processingTime, analysisData.confidence_score || 50);

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
    const aiError = classifyAIError(error, provider);
    logAIRequestFailure(provider, aiError, processingTime);
    
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
      reasoning: aiError.userMessage,
      raw_response: '',
      processing_time_ms: processingTime,
      error: aiError.userMessage,
      errorDetails: aiError
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
  const provider = 'perplexity';
  
  logAIRequestStart(provider, documentText.length, context);
  
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

    // Use limited domains to avoid Perplexity's 20 domain limit error
    const searchDomains = ['uae.gov.ae', 'dld.gov.ae', 'moec.gov.ae', 'adjd.gov.ae', 'dc.gov.ae'];

    console.log(`[${new Date().toISOString()}] [${provider}] Sending request to Perplexity API...`);

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

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const aiError = classifyAIError(new Error(errorText), provider, response.status);
      logAIRequestFailure(provider, aiError, processingTime);
      
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
        reasoning: aiError.userMessage,
        raw_response: errorText,
        processing_time_ms: processingTime,
        error: aiError.userMessage,
        errorDetails: aiError
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      const aiError = classifyAIError(new Error('No content in response'), provider);
      logAIRequestFailure(provider, aiError, processingTime);
      throw new Error('No content in Perplexity response');
    }

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
      analysisData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      const aiError = classifyAIError(new Error('Failed to parse JSON response'), provider);
      logAIRequestFailure(provider, aiError, processingTime);
      throw new Error('Failed to parse Perplexity JSON response');
    }

    logAIRequestSuccess(provider, processingTime, analysisData.confidence_score || 50);

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
    const aiError = classifyAIError(error, provider);
    logAIRequestFailure(provider, aiError, processingTime);
    
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
      reasoning: aiError.userMessage,
      raw_response: '',
      processing_time_ms: processingTime,
      error: aiError.userMessage,
      errorDetails: aiError
    };
  }
}

/**
 * Aggregate error messages from multiple AI providers
 */
export function aggregateAIErrors(results: AIAnalysisResult[]): string | null {
  const errors = results.filter(r => r.errorDetails);
  
  if (errors.length === 0) return null;
  
  // If all providers failed
  if (errors.length === results.length) {
    const rateLimit = errors.find(e => e.errorDetails?.type === 'rate_limit');
    if (rateLimit) {
      return 'AI services are currently busy. Please wait a moment and try again.';
    }
    
    const networkError = errors.find(e => e.errorDetails?.type === 'network_error');
    if (networkError) {
      return 'Unable to connect to AI servers. Please check your internet connection and try again.';
    }
    
    const quotaError = errors.find(e => e.errorDetails?.type === 'quota_exceeded');
    if (quotaError) {
      return 'AI service quota exceeded. Please contact support or try again later.';
    }
    
    return 'All AI analysis services are currently unavailable. Please try again later.';
  }
  
  // Some providers succeeded
  return null;
}

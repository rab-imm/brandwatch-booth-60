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
}

const LEGAL_ANALYSIS_PROMPT = `You are a UAE legal expert analyzing contracts and legal documents. Analyze the following document text and provide:

1. Document Classification: Type, category, and confidence level
2. Risk Findings: Identify material legal risks, unfair terms, regulatory compliance gaps
3. Compliance Issues: Specific clause problems with UAE law references
4. Overall Confidence: Your confidence in this analysis (0-100)
5. Reasoning: Brief explanation of your analysis approach

Focus on substantive legal issues, not just format compliance. Consider UAE Civil Code, Commercial Code, PDPL, and relevant regulations.`;

/**
 * Analyze document with Gemini via Lovable AI Gateway
 */
export async function analyzeWithGemini(
  documentText: string,
  context: string = ''
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: LEGAL_ANALYSIS_PROMPT },
          { role: 'user', content: `Context: ${context}\n\nDocument Text:\n${documentText.substring(0, 8000)}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_legal_document',
            description: 'Analyze legal document for classification and risks',
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
                      recommendation: { type: 'string' }
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
      processing_time_ms: processingTime
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
  context: string = ''
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const xaiApiKey = Deno.env.get('XAI_API_KEY');
    if (!xaiApiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: LEGAL_ANALYSIS_PROMPT },
          { role: 'user', content: `Context: ${context}\n\nDocument Text:\n${documentText.substring(0, 8000)}\n\nProvide your analysis in JSON format with keys: document_classification, risk_findings, compliance_issues, confidence_score, reasoning` }
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
      processing_time_ms: processingTime
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
  context: string = ''
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: `${LEGAL_ANALYSIS_PROMPT}\n\nUse real-time web search to validate against current UAE laws and regulations.` },
          { role: 'user', content: `Context: ${context}\n\nDocument Text:\n${documentText.substring(0, 6000)}\n\nProvide analysis in JSON format with keys: document_classification, risk_findings, compliance_issues, confidence_score, reasoning` }
        ],
        temperature: 0.2,
        search_domain_filter: ['uae.gov.ae', 'dld.gov.ae', 'moec.gov.ae'],
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
      processing_time_ms: processingTime
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

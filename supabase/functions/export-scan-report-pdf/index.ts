import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { scanId, scanResult } = await req.json()

    if (!scanResult) {
      throw new Error('Missing scan result data')
    }

    // Generate professional HTML for PDF
    const complianceScore = scanResult.metadata?.compliance_summary?.overall_compliance_percentage || 0
    const riskScore = scanResult.substantive_risk_analysis?.overall_risk_score || 0
    const detectedClauses = scanResult.metadata?.detected_clauses || []
    const keyIssues = scanResult.metadata?.compliance_summary?.violations || []
    const riskFindings = scanResult.substantive_risk_analysis?.risk_findings || []
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Scan Report - ${scanResult.file_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Crimson+Pro:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4; 
      margin: 2.5cm 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.75em;
      page-break-after: avoid;
    }
    
    h1 { font-size: 24pt; margin-top: 0; }
    h2 { font-size: 18pt; margin-top: 1.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
    h3 { font-size: 14pt; margin-top: 1em; }
    h4 { font-size: 12pt; margin-top: 0.8em; }
    
    p {
      margin-bottom: 1em;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .brand {
      font-family: 'Inter', sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .doc-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 10pt;
    }
    
    .score-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .score-card {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      background: #f8fafc;
    }
    
    .score-value {
      font-size: 36pt;
      font-weight: 700;
      color: #2563eb;
      font-family: 'Inter', sans-serif;
    }
    
    .score-label {
      font-size: 11pt;
      color: #64748b;
      margin-top: 5px;
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .issue-card {
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 15px 0;
      background: #fef2f2;
      page-break-inside: avoid;
    }
    
    .issue-card.high { border-color: #f59e0b; background: #fffbeb; }
    .issue-card.medium { border-color: #eab308; background: #fefce8; }
    .issue-card.low { border-color: #84cc16; background: #f7fee7; }
    
    .issue-title {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 8px;
      color: #0f172a;
    }
    
    .issue-desc {
      font-size: 10pt;
      color: #475569;
      line-height: 1.6;
    }
    
    .clause-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .clause-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    
    .clause-name {
      font-weight: 600;
      font-size: 10pt;
      margin-bottom: 5px;
      color: #0f172a;
    }
    
    .clause-confidence {
      font-size: 9pt;
      color: #64748b;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 9pt;
    }
    
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .score-card, .issue-card, .clause-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Graysen.AI</div>
    <div class="doc-meta">
      <span><strong>Contract Scan Report</strong></span>
      <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  </div>

  <h1>${scanResult.file_name}</h1>
  
  <div class="score-grid">
    <div class="score-card">
      <div class="score-value">${Math.round(complianceScore)}</div>
      <div class="score-label">Compliance Score</div>
    </div>
    <div class="score-card">
      <div class="score-value">${Math.round(100 - riskScore)}</div>
      <div class="score-label">Risk Assessment</div>
    </div>
  </div>

  <div class="section">
    <h2>AI Summary</h2>
    <p>${scanResult.ai_summary || 'No summary available'}</p>
  </div>

  ${keyIssues.length > 0 ? `
  <div class="section">
    <h2>Key Compliance Issues</h2>
    ${keyIssues.map((issue: any) => `
      <div class="issue-card ${issue.severity}">
        <div class="issue-title">${issue.rule.requirement}</div>
        <div class="issue-desc">${issue.details}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${riskFindings.length > 0 ? `
  <div class="section">
    <h2>Substantive Legal Risks</h2>
    ${riskFindings.map((risk: any) => `
      <div class="issue-card ${risk.severity}">
        <div class="issue-title">${risk.risk_type.replace(/_/g, ' ').toUpperCase()}</div>
        <div class="issue-desc">${risk.substantive_issue}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${detectedClauses.length > 0 ? `
  <div class="section">
    <h2>Detected Clauses</h2>
    <div class="clause-grid">
      ${detectedClauses.map((clause: any) => `
        <div class="clause-card">
          <div class="clause-name">${clause.type.replace(/_/g, ' ').toUpperCase()}</div>
          <div class="clause-confidence">Confidence: ${Math.round((clause.ai_confidence || 0) * 100)}%</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Graysen.AI</strong> - Professional Contract Analysis</p>
    <p>Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
    <p style="margin-top: 15px; font-size: 8pt; color: #94a3b8;">
      This analysis is generated by AI and is for general information only. It is not legal advice and Graysen.ai is not a law firm. 
      The output may not identify all risks or issues and accuracy is not guaranteed. You are responsible for all decisions and actions 
      based on this analysis. For legal advice or interpretation of UAE law, consult a licensed lawyer.
    </p>
  </div>
</body>
</html>
    `

    // Encode HTML to base64
    const encoder = new TextEncoder()
    const htmlBytes = encoder.encode(htmlContent)
    const base64Html = btoa(String.fromCharCode(...htmlBytes))

    const filename = `scan-report-${scanResult.file_name.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.pdf`

    return new Response(
      JSON.stringify({
        pdfData: base64Html,
        filename,
        contentType: 'text/html'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DetectedClause {
  type: string
  text: string
  start_index: number
  end_index: number
  confidence: 'pattern' | 'ai'
  keywords: string[]
  ai_confidence?: number
  reasoning?: string
}

function detectClausesByPattern(text: string): DetectedClause[] {
  const patterns = {
    termination: [
      /\b(terminat(e|ion|ed)|cancel(lation)?|end of (contract|agreement)|notice period|early exit)\b/gi,
      /\b(dissolution|expiration|cessation|withdrawal)\b/gi,
      /\b(إنهاء|إلغاء|فسخ|إخطار|نهاية العقد|إنتهاء|الإنهاء)\b/gu
    ],
    confidentiality: [
      /\b(confidential(ity)?|non-disclosure|NDA|proprietary|trade secret|private information)\b/gi,
      /\b(data protection|privacy|sensitive (data|information))\b/gi,
      /\b(سرية|السرية|عدم الإفصاح|معلومات سرية|حماية البيانات|سري)\b/gu
    ],
    payment: [
      /\b(payment|fee(s)?|pricing|invoice|cost|compensation|remuneration)\b/gi,
      /\b(late payment|interest rate|due date|billing cycle)\b/gi,
      /\b(دفع|رسوم|تسعير|فاتورة|تكلفة|تعويض|مستحقات|أتعاب|الدفع)\b/gu
    ],
    liability: [
      /\b(liabilit(y|ies)|indemnif(y|ication)|disclaimer|limitation of liability)\b/gi,
      /\b(hold harmless|damages|loss|injury|claim)\b/gi,
      /\b(مسؤولية|مسئولية|تعويض|إخلاء مسؤولية|ضمان|تعهد|المسؤولية)\b/gu
    ],
    intellectual_property: [
      /\b(intellectual property|IP|copyright|trademark|patent|license)\b/gi,
      /\b(ownership|proprietary rights|work product)\b/gi,
      /\b(الملكية الفكرية|حقوق الملكية|براءة اختراع|علامة تجارية|ملكية)\b/gu
    ],
    dispute_resolution: [
      /\b(dispute|arbitration|mediation|jurisdiction|governing law|venue)\b/gi,
      /\b(legal proceedings|court|litigation)\b/gi,
      /\b(نزاع|خلاف|تحكيم|وساطة|اختصاص قضائي|القانون الواجب|محكمة)\b/gu
    ],
    warranties: [
      /\b(warrant(y|ies)|guarantee|represent(ation)?|assurance)\b/gi,
      /\b(fitness for purpose|merchantability|as-is)\b/gi,
      /\b(ضمان|ضمانات|كفالة|تعهد|إقرار|الضمان)\b/gu
    ],
    duration: [
      /\b(term|duration|period|effective date|commencement|renewal)\b/gi,
      /\b(initial term|extension|anniversary)\b/gi,
      /\b(مدة|فترة|مهلة|تاريخ السريان|بداية|نفاذ|المدة)\b/gu
    ],
    parties: [
      /\b(party|parties|contractor|vendor|client|customer|provider)\b/gi,
      /\b(between|undersigned|hereinafter|referred to as)\b/gi,
      /\b(طرف|أطراف|المتعاقد|البائع|العميل|المشتري|الموقعين|الطرف)\b/gu
    ],
    obligations: [
      /\b(obligation(s)?|requirement(s)?|must|shall|responsible for|duty)\b/gi,
      /\b(deliverable(s)?|performance|compliance)\b/gi,
      /\b(التزام|التزامات|واجب|يجب|مسؤول عن|متطلبات|الالتزام)\b/gu
    ],
    force_majeure: [
      /\b(force majeure|act of god|unforeseeable|natural disaster|pandemic)\b/gi,
      /\b(war|terrorism|strike|riot)\b/gi,
      /\b(قوة قاهرة|ظروف قاهرة|حدث غير متوقع|كارثة طبيعية)\b/gu
    ],
    non_compete: [
      /\b(non-compete|non-competition|restrictive covenant|non-solicitation)\b/gi,
      /\b(prohibited activities|competitive business)\b/gi,
      /\b(عدم المنافسة|حظر المنافسة|قيود تنافسية)\b/gu
    ],
    amendments: [
      /\b(amendment|modification|change|alteration|revision)\b/gi,
      /\b(written consent|mutual agreement|change order)\b/gi,
      /\b(تعديل|تغيير|تحوير|تنقيح|التعديل)\b/gu
    ],
    notices: [
      /\b(notice|notification|written notice|communication)\b/gi,
      /\b(address|contact|email|registered office)\b/gi,
      /\b(إخطار|إشعار|إبلاغ|إعلام|تبليغ|الإخطار)\b/gu
    ],
    definitions: [
      /\b(definition(s)?|means|defined as|refers to|interpretation)\b/gi,
      /\b(for purposes of|hereinafter defined)\b/gi,
      /\b(تعريف|تعاريف|يعني|يقصد به|المقصود|التعريف)\b/gu
    ]
  }
  
  const paragraphs = text.split(/\n\n+/)
  const detectedClauses: DetectedClause[] = []
  let currentIndex = 0
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 50) {
      currentIndex += paragraph.length + 2
      continue
    }
    
    for (const [clauseType, regexList] of Object.entries(patterns)) {
      let matchCount = 0
      const foundKeywords: string[] = []
      
      for (const regex of regexList) {
        const matches = paragraph.match(regex)
        if (matches) {
          matchCount += matches.length
          foundKeywords.push(...matches.map(m => m.toLowerCase()))
        }
      }
      
      if (matchCount >= 1 && paragraph.length > 100) {
        detectedClauses.push({
          type: clauseType,
          text: paragraph.trim(),
          start_index: currentIndex,
          end_index: currentIndex + paragraph.length,
          confidence: 'pattern',
          keywords: [...new Set(foundKeywords)]
        })
      }
    }
    
    currentIndex += paragraph.length + 2
  }
  
  return detectedClauses
}

async function classifyClausesWithAI(
  text: string, 
  patternClauses: DetectedClause[],
  lovableApiKey: string
): Promise<DetectedClause[]> {
  const truncatedText = text.substring(0, 8000)
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a legal document analyzer that works with documents in ANY language (Arabic, English, etc.).

Identify and classify legal clauses regardless of language.

Clause Types: termination, confidentiality, payment, liability, intellectual_property, dispute_resolution, warranties, duration, parties, obligations, force_majeure, non_compete, amendments, notices, definitions

For each clause found, return a JSON object:
{"clauses": [{"type": "clause_type", "text": "full clause text in original language", "confidence": 0.95, "reasoning": "why this classification"}]}

CRITICAL: Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences like \`\`\`json. Just the plain JSON.`
        },
        {
          role: 'user',
          content: `Analyze this document and extract all legal clauses:\n\n${truncatedText}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    console.error('AI clause classification failed:', response.status)
    return []
  }
  
  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content || '{}'
  
  try {
    // Strip markdown code fences if present
    let cleanedResponse = aiResponse.trim()
    
    // Remove ```json ... ``` or ``` ... ```
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(cleanedResponse)
    const aiClauses = parsed.clauses || []
    
    return aiClauses.map((clause: any, index: number) => ({
      type: clause.type,
      text: clause.text.substring(0, 1000),
      start_index: index * 100,
      end_index: index * 100 + clause.text.length,
      confidence: 'ai',
      keywords: [],
      ai_confidence: clause.confidence || 0.9,
      reasoning: clause.reasoning
    }))
  } catch (parseError) {
    console.error('Failed to parse AI clause response:', parseError)
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const { file_path, user_id, company_id, file_name, file_type } = await req.json()

    console.log('Processing OCR request:', { file_name, file_type, user_id, company_id })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ocr-documents')
      .download(file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    console.log('File downloaded successfully, size:', fileData.size)

    // Extract text based on file type
    let extractedText = ''
    
    if (file_type === 'application/pdf') {
      console.log('Processing PDF with PDF.js...')
      
      try {
        // Convert blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
        const pdfDoc = await loadingTask.promise
        
        console.log(`PDF loaded: ${pdfDoc.numPages} pages`)
        
        // Extract text from all pages
        const textPromises = []
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          textPromises.push(
            pdfDoc.getPage(pageNum).then(async (page) => {
              const textContent = await page.getTextContent()
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
              return pageText
            })
          )
        }
        
        const pageTexts = await Promise.all(textPromises)
        extractedText = pageTexts.join('\n\n').trim()
        
        if (!extractedText || extractedText.length < 10) {
          // If no text found, it might be a scanned PDF
          extractedText = `Scanned PDF Document: ${file_name}\n\nThis appears to be a scanned PDF with no extractable text. The document contains ${pdfDoc.numPages} page(s).\n\nTo extract text from scanned PDFs, please:\n1. Convert the PDF pages to images\n2. Upload each page as a separate image file for OCR\n\nFile Information:\n- File Name: ${file_name}\n- File Size: ${(fileData.size / 1024).toFixed(2)} KB\n- Pages: ${pdfDoc.numPages}`
        } else {
          console.log(`Extracted ${extractedText.length} characters from PDF`)
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        extractedText = `Error processing PDF: ${file_name}\n\nThe PDF file could not be processed. It may be encrypted, corrupted, or in an unsupported format.\n\nError: ${pdfError.message}\n\nPlease try:\n1. Converting the PDF to images\n2. Ensuring the PDF is not password-protected\n3. Re-saving the PDF with a different tool`
      }
      
    } else if (file_type.startsWith('image/')) {
      // For images, convert to base64 and use AI vision
      const arrayBuffer = await fileData.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      console.log('Processing image with AI vision...')
      
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all visible text from this image using OCR. Return ONLY the extracted text without any additional commentary or formatting.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file_type};base64,${base64}`
                  }
                }
              ]
            }
          ]
        })
      })

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text()
        console.error('AI extraction error:', extractResponse.status, errorText)
        throw new Error(`AI extraction failed: ${extractResponse.status}`)
      }

      const extractData = await extractResponse.json()
      extractedText = extractData.choices?.[0]?.message?.content || ''
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document')
    }
    
    // Generate AI summary
    let aiSummary = ''
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document')
    }
    
    console.log('Text extracted, length:', extractedText.length)

    // Generate AI summary
    console.log('Generating AI summary...')
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a document summarization expert. Provide ultra-concise, bullet-point summaries focusing only on the most critical information.'
            },
            {
              role: 'user',
              content: `Analyze this document and provide a SHORT summary with:

### Summary
- 1-2 sentence overview

### Key Points
- Max 3 bullet points of most important info only

### Details
- Document type (if identifiable)
- Critical dates/amounts/names (if any)

Keep it brief and scannable.

Text:
${extractedText.substring(0, 4000)}`
            }
          ]
        })
      })

    if (!summaryResponse.ok) {
      console.error('AI summary error:', summaryResponse.status)
      throw new Error('Failed to generate AI summary')
    }

    const summaryData = await summaryResponse.json()
    aiSummary = summaryData.choices?.[0]?.message?.content || ''

    console.log('AI summary generated')

    // Detect clauses using pattern matching
    console.log('Detecting clauses by pattern...')
    const patternClauses = detectClausesByPattern(extractedText)
    console.log(`Found ${patternClauses.length} clauses by pattern`)

    // Enhance with AI classification
    console.log('Classifying clauses with AI...')
    const aiClauses = await classifyClausesWithAI(extractedText, patternClauses, lovableApiKey)
    console.log(`Found ${aiClauses.length} clauses by AI`)

    // Merge and deduplicate clauses
    const allClauses = [...patternClauses, ...aiClauses]
    const clausesByType = allClauses.reduce((acc, clause) => {
      if (!acc[clause.type]) acc[clause.type] = []
      acc[clause.type].push(clause)
      return acc
    }, {} as Record<string, DetectedClause[]>)

    // Calculate clause statistics
    const clauseStats = Object.entries(clausesByType).map(([type, clauses]) => ({
      type,
      count: clauses.length,
      total_characters: clauses.reduce((sum, c) => sum + c.text.length, 0)
    }))

    // Calculate statistics
    const characterCount = extractedText.length
    const wordCount = extractedText.trim().split(/\s+/).length
    const processingTime = Date.now() - startTime

    // Save to database
    const { data: historyData, error: dbError } = await supabase
      .from('ocr_history')
      .insert({
        user_id,
        company_id,
        file_name,
        file_type,
        file_size: fileData.size,
        extracted_text: extractedText,
        ai_summary: aiSummary,
        character_count: characterCount,
        word_count: wordCount,
        processing_time_ms: processingTime,
        credits_used: 1,
        metadata: {
          processed_at: new Date().toISOString(),
          clauses: allClauses,
          clause_stats: clauseStats,
          clause_types_found: Object.keys(clausesByType),
          total_clauses: allClauses.length
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save OCR history: ${dbError.message}`)
    }

    console.log('OCR processing complete:', { 
      characters: characterCount, 
      words: wordCount, 
      time: processingTime 
    })

    return new Response(
      JSON.stringify({
        success: true,
        extracted_text: extractedText,
        ai_summary: aiSummary,
        statistics: {
          characters: characterCount,
          words: wordCount,
          processing_time_ms: processingTime,
          clauses_detected: allClauses.length
        },
        clauses: allClauses,
        clause_stats: clauseStats,
        history_id: historyData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('OCR processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to process document'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

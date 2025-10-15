import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      // For PDFs, we need to use a text-based approach since vision API doesn't support PDFs
      // We'll ask the AI to help extract structured information from the file metadata
      console.log('Processing PDF - note: full OCR for PDFs requires additional libraries')
      
      // For now, provide a helpful message that PDF OCR requires additional setup
      extractedText = `PDF Document: ${file_name}
      
This PDF file has been uploaded successfully. However, full OCR text extraction from PDFs requires additional PDF processing libraries.

To enable full PDF OCR capabilities, you would need to:
1. Use a PDF parsing library (like pdf-parse or pdfjs-dist)
2. Extract text page by page
3. Handle embedded images separately with OCR

For now, you can:
- Convert PDFs to images and scan those
- Use the image-based OCR for scanned PDF pages
- Upload individual pages as images

File Information:
- File Name: ${file_name}
- File Size: ${(fileData.size / 1024).toFixed(2)} KB
- Type: PDF Document`
      
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
    
    // Skip AI summary for PDFs since we're providing an informational message
    let aiSummary = ''
    if (file_type === 'application/pdf') {
      aiSummary = 'PDF OCR is currently limited. Please convert to images for full text extraction.'
    } else {

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
              content: 'You are a document summarization expert. Analyze documents and provide clear, professional summaries.'
            },
            {
              role: 'user',
              content: `Analyze the following extracted text and provide:

1. A concise summary (2-3 sentences)
2. Key points identified (bullet list, max 5 points)
3. Document type classification (if recognizable)
4. Any important dates, names, or amounts mentioned

Extracted Text:
${extractedText.substring(0, 4000)}

Provide the summary in a clear, professional format.`
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
    }

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
          processed_at: new Date().toISOString()
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
          processing_time_ms: processingTime
        },
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379"

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
    
    if (file_type === 'text/plain') {
      // Handle plain text files
      console.log('Processing plain text file...')
      const textContent = await fileData.text()
      extractedText = textContent.trim()
      
      if (!extractedText || extractedText.length < 1) {
        throw new Error('Text file is empty')
      }
      
      console.log(`Extracted ${extractedText.length} characters from text file`)
      
    } else if (file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file_type === 'application/msword') {
      // Word documents are not directly supported - provide helpful message
      console.log('Word document detected - providing conversion instructions')
      extractedText = `Word Document: ${file_name}\n\nWord documents (.doc, .docx) cannot be directly scanned with OCR.\n\nPlease convert your document to one of these formats:\n\n✓ PDF format - Best for maintaining layout\n✓ Plain text (.txt) - Copy and paste text into a text file\n✓ Images (JPG/PNG) - Take screenshots of each page\n\nHow to convert:\n1. Open the Word document\n2. Go to File → Save As\n3. Choose PDF or TXT format\n4. Upload the converted file here\n\nFile Information:\n- File Name: ${file_name}\n- File Size: ${(fileData.size / 1024).toFixed(2)} KB`
      
    } else if (file_type === 'application/pdf') {
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

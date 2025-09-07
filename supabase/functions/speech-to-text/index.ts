import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Processing audio transcription...')

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    
    // Prepare form data with English language specification
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')  // Force English language
    formData.append('temperature', '0')  // Lower temperature for more accurate transcription
    formData.append('prompt', 'This is a voice message about real estate properties, projects, and pricing in English.')  // Context prompt for better accuracy

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const result = await response.json()
    console.log('Transcription result:', result.text)

    // Clean up and validate the transcribed text
    let cleanText = result.text?.trim() || ''
    
    // Remove excessive punctuation and normalize
    cleanText = cleanText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[.,!?]+$/g, '')  // Remove trailing punctuation
      .trim()

    // Validate that we have meaningful English text
    if (cleanText.length < 2) {
      throw new Error('Transcription too short or unclear. Please speak more clearly.')
    }

    // Check if text contains mostly English characters
    const englishPattern = /^[a-zA-Z0-9\s.,!?'-]+$/
    if (!englishPattern.test(cleanText)) {
      console.log('Non-English text detected:', cleanText)
      throw new Error('Please speak in English only.')
    }

    console.log('Cleaned transcription:', cleanText)

    return new Response(
      JSON.stringify({ text: cleanText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Speech-to-text error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
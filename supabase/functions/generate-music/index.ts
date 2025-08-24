const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateRequest {
  prompt: string
  options?: {
    customMode?: boolean
    instrumental?: boolean
    model?: string
    style?: string
    title?: string
    negativeTags?: string
  }
}

interface KieAIResponse {
  code: number
  msg: string
  data: {
    taskId?: string
    sunoData?: Array<{
      id: string
      title: string
      audioUrl: string
      duration: number
      tags: string
    }>
    status?: string
    errorMessage?: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { prompt, options = {} }: GenerateRequest = await req.json()

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Music AI API key from environment - use the hardcoded key as fallback
    const apiKey = Deno.env.get('MUSIC_AI_API_KEY') || '4f52e3f37a67bb5aed649a471e9989b9'
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Music AI API key not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make request to Kie AI
    const kieResponse = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        customMode: options.customMode || false,
        instrumental: options.instrumental || false,
        model: options.model || 'V3_5',
        style: options.style || '',
        title: options.title || '',
        negativeTags: options.negativeTags || ''
      })
    })

    const result: KieAIResponse = await kieResponse.json()

    if (result.code !== 200) {
      return new Response(
        JSON.stringify({ success: false, error: `Generation failed: ${result.msg}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data.taskId,
        message: 'Generation started successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Generation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false, error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
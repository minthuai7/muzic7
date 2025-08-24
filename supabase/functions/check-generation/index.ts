const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface KieAIStatusResponse {
  code: number
  msg: string
  data: {
    status?: string
    errorMessage?: string
    response?: {
      sunoData: Array<{
        id: string
        title: string
        audioUrl: string
        duration: number
        tags: string
      }>
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body for POST requests
    let taskId: string | null = null;
    
    if (req.method === 'POST') {
      const body = await req.json()
      taskId = body.taskId
    } else {
      const url = new URL(req.url)
      taskId = url.searchParams.get('taskId')
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Task ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Music AI API key from environment - use the hardcoded key as fallback
    const apiKey = Deno.env.get('MUSIC_AI_API_KEY') || '4f52e3f37a67bb5aed649a471e9989b9'
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Music AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check generation status
    const kieResponse = await fetch(
      `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const result: KieAIStatusResponse = await kieResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        status: result.data.status,
        data: result.data.response?.sunoData || [],
        error: result.data.errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Status check error:', error)
    
    return new Response(
      JSON.stringify({
        success: false, error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
)
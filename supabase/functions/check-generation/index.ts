import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const taskId = url.searchParams.get('taskId')

    if (!taskId) {
      throw new Error('Task ID is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get available API key
    const { data: apiKey, error: keyError } = await supabaseClient
      .rpc('get_available_api_key')

    if (keyError || !apiKey) {
      throw new Error('No available API keys')
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
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
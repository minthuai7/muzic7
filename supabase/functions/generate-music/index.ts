import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    // Check user usage limits
    const { data: usageResult, error: usageError } = await supabaseClient
      .rpc('check_and_increment_usage', { p_user_id: user.id })

    if (usageError) {
      throw new Error('Failed to check usage limits')
    }

    if (!usageResult.success) {
      return new Response(
        JSON.stringify({
          error: usageResult.message,
          usage: {
            current: usageResult.current_usage,
            limit: usageResult.monthly_limit,
            planType: usageResult.plan_type,
            resetDate: usageResult.reset_date
          }
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Music AI API key from environment
    const apiKey = Deno.env.get('MUSIC_AI_API_KEY')
    if (!apiKey) {
      throw new Error('Music AI API key not configured')
    }

    // Parse request body
    const { prompt, options = {} }: GenerateRequest = await req.json()

    if (!prompt?.trim()) {
      throw new Error('Prompt is required')
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
        negativeTags: options.negativeTags || '',
        callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/music-callback`
      })
    })

    const result: KieAIResponse = await kieResponse.json()

    if (result.code !== 200) {
      throw new Error(`Generation failed: ${result.msg}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data.taskId,
        usage: {
          current: usageResult.current_usage,
          limit: usageResult.monthly_limit,
          planType: usageResult.plan_type,
          resetDate: usageResult.reset_date
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Generation error:', error)
    
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
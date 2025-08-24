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
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Music AI API key from environment
    const apiKey = Deno.env.get('MUSIC_AI_API_KEY')
    if (!apiKey) {
      console.error('MUSIC_AI_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Music AI API key not configured. Please set MUSIC_AI_API_KEY in Supabase Edge Function environment variables.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { prompt, options = {} }: GenerateRequest = await req.json()

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user's generation limit before proceeding
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking subscription:', subError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check usage limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create default subscription if none exists
    let userSubscription = subscription;
    if (!userSubscription) {
      const nextResetDate = new Date();
      nextResetDate.setMonth(nextResetDate.getMonth() + 1, 1);
      nextResetDate.setHours(0, 0, 0, 0);
      
      const { data: newSub, error: createError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          monthly_limit: 1,
          current_usage: 0,
          reset_date: nextResetDate.toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating subscription:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create user subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userSubscription = newSub;
    }

    // Check if usage needs to be reset
    const now = new Date();
    const resetDate = new Date(userSubscription.reset_date);
    
    if (now >= resetDate) {
      const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { data: updatedSub, error: updateError } = await supabaseClient
        .from('user_subscriptions')
        .update({
          current_usage: 0,
          reset_date: nextResetDate.toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error resetting usage:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to reset usage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userSubscription = updatedSub;
    }

    // Check if user has remaining generations
    const remaining = userSubscription.monthly_limit - userSubscription.current_usage;
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Generation limit exceeded. You have used ${userSubscription.current_usage}/${userSubscription.monthly_limit} generations this month. Limit resets on ${new Date(userSubscription.reset_date).toLocaleDateString()}.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        negativeTags: options.negativeTags || '',
        callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/music-callback`
      })
    })

    const result: KieAIResponse = await kieResponse.json()

    if (result.code !== 200) {
      return new Response(
        JSON.stringify({ success: false, error: `Generation failed: ${result.msg}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment usage count after successful generation
    const { error: incrementError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        current_usage: userSubscription.current_usage + 1
      })
      .eq('user_id', user.id)

    if (incrementError) {
      console.error('Error incrementing usage:', incrementError);
      // Don't fail the request, just log the error
    }
    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data.taskId,
        message: 'Generation started successfully',
        usage: {
          current: userSubscription.current_usage + 1,
          limit: userSubscription.monthly_limit,
          remaining: remaining - 1
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
        success: false, error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
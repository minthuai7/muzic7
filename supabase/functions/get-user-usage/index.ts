import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Get user subscription info
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      throw subError
    }

    // If no subscription exists, create default free plan
    if (!subscription) {
      const { data: newSub, error: createError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          monthly_limit: 1,
          current_usage: 0
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return new Response(
        JSON.stringify({
          success: true,
          usage: {
            current: 0,
            limit: 1,
            planType: 'free',
            resetDate: newSub.reset_date,
            remaining: 1
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if we need to reset usage
    const now = new Date()
    const resetDate = new Date(subscription.reset_date)
    
    if (now >= resetDate) {
      const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      
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
        throw updateError
      }

      return new Response(
        JSON.stringify({
          success: true,
          usage: {
            current: 0,
            limit: updatedSub.monthly_limit,
            planType: updatedSub.plan_type,
            resetDate: updatedSub.reset_date,
            remaining: updatedSub.monthly_limit
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        usage: {
          current: subscription.current_usage,
          limit: subscription.monthly_limit,
          planType: subscription.plan_type,
          resetDate: subscription.reset_date,
          remaining: subscription.monthly_limit - subscription.current_usage
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Usage check error:', error)
    
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
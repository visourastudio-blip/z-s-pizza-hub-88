import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { billingId } = await req.json();

    if (!billingId) {
      return new Response(JSON.stringify({ success: false, error: 'Billing ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!apiKey) {
      throw new Error('ABACATEPAY_API_KEY not configured');
    }

    // Check payment status with AbacatePay
    const response = await fetch(`https://api.abacatepay.com/v1/billing/status/${billingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('AbacatePay status response:', data);

    const status = data.data?.status || data.status || 'PENDING';
    const isPaid = status === 'PAID' || status === 'COMPLETED';

    // If paid, update order status
    if (isPaid) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'recebido' })
        .eq('billing_id', billingId)
        .eq('status', 'aguardando_pagamento');

      if (updateError) {
        console.error('Error updating order:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      status,
      isPaid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking payment:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

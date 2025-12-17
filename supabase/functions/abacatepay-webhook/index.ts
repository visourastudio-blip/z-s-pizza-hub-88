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
    const payload = await req.json();
    console.log('AbacatePay webhook received:', JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // AbacatePay sends billing updates with status changes
    const billingId = payload.data?.billing?.id || payload.billing?.id || payload.id;
    const status = payload.data?.billing?.status || payload.billing?.status || payload.status;

    console.log('Processing webhook - billingId:', billingId, 'status:', status);

    if (!billingId) {
      console.log('No billing ID found in webhook payload');
      return new Response(JSON.stringify({ success: true, message: 'No billing ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if payment was completed
    if (status === 'PAID' || status === 'COMPLETED') {
      console.log('Payment confirmed for billing:', billingId);

      // Update order status from aguardando_pagamento to recebido
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('billing_id', billingId)
        .single();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (order.status === 'aguardando_pagamento') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'recebido' })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating order status:', updateError);
          return new Response(JSON.stringify({ success: false, error: 'Failed to update order' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Order', order.id, 'status updated to recebido');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

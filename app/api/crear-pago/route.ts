import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { monto, descripcion, servicioId, clienteEmail, prestadorId } = await request.json();

    let esReferido = false;

    if (prestadorId) {
      const { data: flekser } = await supabase
        .from('usuarios')
        .select('referido_por, primer_trabajo_completado')
        .eq('id', prestadorId)
        .single();

      if (flekser?.referido_por && !flekser?.primer_trabajo_completado) {
        esReferido = true;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: monto * 100,
      currency: 'mxn',
      description: descripcion,
      metadata: {
        servicio_id: servicioId,
        prestador_id: prestadorId || '',
        es_referido: esReferido ? 'true' : 'false',
      },
      receipt_email: clienteEmail,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      esReferido,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
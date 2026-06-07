import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Validar sesión
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Rate limiting: max 10 pagos por usuario por hora
    const rl = await checkRateLimit(`crear-pago:${user.id}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hora
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    // Rate limiting por IP: max 20 por hora
    const ip = getClientIP(request);
    const rlIP = await checkRateLimit(`crear-pago-ip:${ip}`, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!rlIP.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes desde esta red.' },
        { status: 429 }
      );
    }

    const { monto, descripcion, servicioId, clienteEmail, prestadorId } = await request.json();

    if (!monto || !servicioId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    let esReferido = false;

    if (prestadorId) {
      const { data: flekser } = await supabaseAdmin
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
        cliente_id: user.id,
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
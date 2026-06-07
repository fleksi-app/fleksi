import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

      // Rate limiting: max 50 push por usuario por hora
      const rl = await checkRateLimit(`push:${user.id}`, {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Demasiadas solicitudes.' },
          { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
        );
      }
    }

    const { usuario_id, titulo, mensaje, link } = await request.json();

    const { data: suscripciones } = await supabaseAdmin
      .from('push_suscripciones')
      .select('*')
      .eq('usuario_id', usuario_id);

    if (!suscripciones || suscripciones.length === 0) {
      return NextResponse.json({ success: true, mensaje: 'Sin suscripciones' });
    }

    const payload = JSON.stringify({ titulo, mensaje, link });

    const resultados = await Promise.allSettled(
      suscripciones.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('push_suscripciones').delete().eq('id', sub.id);
          }
          throw err;
        }
      })
    );

    const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
    return NextResponse.json({ success: true, enviados: exitosos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Rate limiting: max 10 registros de suscripción por usuario por hora
    const ip = getClientIP(request);
    const rl = await checkRateLimit(`push-register:${user.id}:${ip}`, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const { usuario_id, subscription } = await request.json();
    if (usuario_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    await supabaseAdmin.from('push_suscripciones').upsert({
      usuario_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'usuario_id,endpoint' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
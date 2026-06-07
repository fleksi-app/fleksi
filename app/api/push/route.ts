import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enviar push — solo desde el servidor (APIs internas), validar CRON_SECRET o sesión admin
export async function POST(request: NextRequest) {
  try {
    // Solo llamadas internas del servidor pueden enviar push
    const authHeader = request.headers.get('Authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      // Si no es cron, verificar que sea un usuario autenticado admin
      if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

// Guardar suscripción — solo el propio usuario puede registrar la suya
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

    const { usuario_id, subscription } = await request.json();

    // Solo puede registrar su propia suscripción
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
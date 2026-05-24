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

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, titulo, mensaje, link } = await request.json();

    // Obtener suscripciones del usuario
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
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          // Si la suscripción expiró, eliminarla
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin
              .from('push_suscripciones')
              .delete()
              .eq('id', sub.id);
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

// Guardar suscripción
export async function PUT(request: NextRequest) {
  try {
    const { usuario_id, subscription } = await request.json();

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
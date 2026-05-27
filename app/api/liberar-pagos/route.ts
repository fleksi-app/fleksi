import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*, aplicaciones(id, prestador_id, precio_ofrecido, payment_intent_id, usuarios(nombre, email))')
      .eq('estado', 'completado')
      .eq('pago_retenido', true)
      .is('disputa_at', null)
      .lt('completado_at', hace24h);

    if (error) throw error;
    if (!servicios || servicios.length === 0) {
      return NextResponse.json({ liberados: 0, mensaje: 'Sin pagos pendientes' });
    }

    let liberados = 0;

    for (const servicio of servicios) {
      try {
        const appAceptada = servicio.aplicaciones?.find(
          (a: any) => a.estado === 'aceptado' || a.estado === 'completado'
        );
        if (!appAceptada) continue;

        const precio = appAceptada.precio_ofrecido || servicio.presupuesto;

        await supabase.from('servicios').update({ estado: 'pagado' }).eq('id', servicio.id);
        await supabase.from('aplicaciones').update({ pago_liberado: true, estado: 'completado' }).eq('id', appAceptada.id);

        try { await supabase.rpc('incrementar_trabajos', { user_id: appAceptada.prestador_id }); } catch (e) {}

        await supabase.from('notificaciones').insert({
          usuario_id: appAceptada.prestador_id,
          tipo: 'pago_liberado',
          titulo: '💰 Pago liberado automáticamente',
          mensaje: `Tu pago de $${precio} MXN fue liberado. El cliente no reportó problemas en 24h.`,
          link: '/earnings',
        });

        await supabase.from('notificaciones').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'pago_liberado',
          titulo: '✅ Pago liberado',
          mensaje: `El pago del trabajo "${servicio.titulo}" fue liberado automáticamente después de 24h.`,
          link: '/mis-trabajos',
        });

        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/enviar-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'pago_completado',
              destinatario: appAceptada?.usuarios?.email || 'fernando.najera.nm@gmail.com',
              datos: {
                nombre: appAceptada?.usuarios?.nombre || 'Flekser',
                prestador_id: appAceptada?.prestador_id,
                trabajo: servicio.titulo,
                presupuesto: precio,
                monto: precio,
              },
            }),
          });
        } catch (e) {}

        liberados++;
      } catch (e) {
        console.error(`Error liberando servicio ${servicio.id}:`, e);
      }
    }

    return NextResponse.json({ liberados, mensaje: `${liberados} pagos liberados automáticamente` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
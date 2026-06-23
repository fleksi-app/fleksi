import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('id, titulo, cliente_id, fecha, hora, estado, urgente, created_at');

    if (error) throw error;
    if (!servicios || servicios.length === 0) {
      return NextResponse.json({ vencidos: 0, mensaje: 'Sin servicios activos' });
    }

    // Solo servicios activos
    const activos = servicios.filter(s => s.estado === 'activo');

    const ahora = new Date();
    let vencidos = 0;
    let urgentesVencidos = 0;

    for (const servicio of activos) {
      try {

        // ── SERVICIO CON FECHA (normal o urgente con fecha) ──
        if (servicio.fecha) {
          const limite = new Date(servicio.fecha + 'T' + (servicio.hora || '23:59'));
          if (limite >= ahora) continue; // No venció aún

          await supabase.from('servicios').update({ estado: 'vencido' }).eq('id', servicio.id);

          try {
            await supabase.from('notificaciones').insert({
              usuario_id: servicio.cliente_id,
              tipo: 'servicio_vencido',
              titulo: '⏰ Tu solicitud venció',
              mensaje: 'Tu solicitud "' + servicio.titulo + '" venció porque nadie fue aceptado antes de la fecha y hora indicadas. Puedes publicar de nuevo si lo necesitas.',
              link: '/aplicaciones',
            });
          } catch (e) {}

          vencidos++;
          continue;
        }

        // ── SERVICIO URGENTE SIN FECHA ──
        // Solo se vence si lleva más de 24 horas sin que nadie aplique
        if (servicio.urgente && !servicio.fecha) {
          const creado = new Date(servicio.created_at);
          const horasTranscurridas = (ahora.getTime() - creado.getTime()) / (1000 * 60 * 60);

          if (horasTranscurridas < 24) continue; // Menos de 24h, no hacer nada

          // Verificar si tiene aplicaciones pendientes o aceptadas
          const { data: apps } = await supabase
            .from('aplicaciones')
            .select('id, estado')
            .eq('servicio_id', servicio.id)
            .in('estado', ['pendiente', 'aceptado']);

          if (apps && apps.length > 0) continue; // Tiene aplicaciones, no vencer

          // Sin aplicaciones después de 24h → vencer
          await supabase.from('servicios').update({ estado: 'vencido' }).eq('id', servicio.id);

          try {
            await supabase.from('notificaciones').insert({
              usuario_id: servicio.cliente_id,
              tipo: 'servicio_vencido',
              titulo: '⏰ Tu solicitud urgente expiró',
              mensaje: 'Tu solicitud urgente "' + servicio.titulo + '" lleva más de 24 horas sin recibir propuestas. Puedes publicarla de nuevo.',
              link: '/aplicaciones',
            });
          } catch (e) {}

          urgentesVencidos++;
          continue;
        }

        // ── SERVICIO SIN FECHA Y NO URGENTE ──
        // No hacer nada — son servicios sin fecha definida, el cliente decide cuándo cancelar

      } catch (e) {
        console.error('Error venciendo servicio ' + servicio.id + ':', e);
      }
    }

    return NextResponse.json({
      vencidos,
      urgentesVencidos,
      mensaje: (vencidos + urgentesVencidos) + ' solicitudes marcadas como vencidas (' + vencidos + ' con fecha, ' + urgentesVencidos + ' urgentes sin aplicaciones)',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
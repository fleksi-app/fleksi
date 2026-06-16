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
      .select('id, titulo, cliente_id, fecha, hora, estado')
      .eq('estado', 'activo');

    if (error) throw error;
    if (!servicios || servicios.length === 0) {
      return NextResponse.json({ vencidos: 0, mensaje: 'Sin servicios activos' });
    }

    const ahora = new Date();
    let vencidos = 0;

    for (const servicio of servicios) {
      try {
        if (!servicio.fecha) continue;
        const limite = new Date(servicio.fecha + 'T' + (servicio.hora || '23:59'));
        if (limite >= ahora) continue;

        await supabase.from('servicios').update({ estado: 'vencido' }).eq('id', servicio.id);

        try {
          await supabase.from('notificaciones').insert({
            usuario_id: servicio.cliente_id,
            tipo: 'servicio_vencido',
            titulo: '⏰ Tu solicitud venció',
            mensaje: 'Tu solicitud "' + servicio.titulo + '" venció porque nadie fue aceptado antes de la fecha y hora indicadas. Puedes publicar de nuevo si lo necesitas.',
            link: '/mis-trabajos',
          });
        } catch (e) {}

        vencidos++;
      } catch (e) {
        console.error('Error venciendo servicio ' + servicio.id + ':', e);
      }
    }

    return NextResponse.json({ vencidos, mensaje: vencidos + ' solicitudes marcadas como vencidas' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
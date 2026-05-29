import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Verificar token secreto
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const ahora = new Date();
    const en2horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
    const en2h15 = new Date(ahora.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);

    // Fecha de hoy
    const hoy = ahora.toISOString().split('T')[0];

    // Hora en formato HH:MM para comparar
    const horaEn2h = `${String(en2horas.getHours()).padStart(2,'0')}:${String(en2horas.getMinutes()).padStart(2,'0')}`;
    const horaEn2h15 = `${String(en2h15.getHours()).padStart(2,'0')}:${String(en2h15.getMinutes()).padStart(2,'0')}`;

    // Buscar aplicaciones aceptadas para hoy en el rango de 2 horas
    const { data: aplicaciones, error } = await supabase
      .from('aplicaciones')
      .select('*, servicios(id, titulo, fecha, hora, cliente_id), usuarios!prestador_id(id, nombre)')
      .eq('estado', 'aceptado')
      .is('checkin_at', null)
      .eq('servicios.fecha', hoy)
      .gte('servicios.hora', horaEn2h)
      .lte('servicios.hora', horaEn2h15);

    if (error) throw error;

    let enviados = 0;

    for (const app of aplicaciones || []) {
      if (!app.servicios) continue;

      // Notificar al prestador
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: app.prestador_id,
          tipo: 'recordatorio_trabajo',
          titulo: '⏰ Tu trabajo empieza en 2 horas',
          mensaje: `Recuerda que tienes "${app.servicios.titulo}" hoy a las ${app.servicios.hora?.slice(0,5)}. ¡Prepárate!`,
          link: '/checkin',
        });
        enviados++;
      } catch (e) {}

      // Notificar al cliente también
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: app.servicios.cliente_id,
          tipo: 'recordatorio_trabajo',
          titulo: '⏰ Tu servicio empieza en 2 horas',
          mensaje: `${app.usuarios?.nombre} llegará en 2 horas para "${app.servicios.titulo}".`,
          link: `/aplicaciones?servicio=${app.servicios.id}`,
        });
      } catch (e) {}
    }

    return NextResponse.json({
      ok: true,
      revisados: aplicaciones?.length || 0,
      notificaciones_enviadas: enviados,
      hora_actual: ahora.toISOString(),
      rango: `${horaEn2h} - ${horaEn2h15}`,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
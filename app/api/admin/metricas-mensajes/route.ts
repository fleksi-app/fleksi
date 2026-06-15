import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'fernando.najera.nm@gmail.com';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Trae TODAS las notificaciones de tipo admin_mensaje (sin restricción de RLS)
    const { data: notifs, error: errNotifs } = await supabaseAdmin
      .from('notificaciones')
      .select('titulo, mensaje, created_at, leida, usuario_id')
      .eq('tipo', 'admin_mensaje')
      .order('created_at', { ascending: false });

    if (errNotifs) throw errNotifs;
    if (!notifs || notifs.length === 0) return NextResponse.json({ mensajes: [] });

    // Trae nombres/emails de todos los usuarios involucrados
    const usuarioIds = Array.from(new Set(notifs.map((n: any) => n.usuario_id)));
    const { data: usuarios, error: errUsuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email')
      .in('id', usuarioIds);

    if (errUsuarios) throw errUsuarios;

    const usuariosMap: Record<string, { nombre: string; email: string }> = {};
    (usuarios || []).forEach((u: any) => { usuariosMap[u.id] = { nombre: u.nombre, email: u.email }; });

    // Agrupa por título + minuto de creación (mismo criterio que antes)
    const grupos: Record<string, any> = {};
    notifs.forEach((n: any) => {
      const key = n.titulo + '||' + n.created_at.slice(0, 16);
      if (!grupos[key]) {
        grupos[key] = {
          titulo: n.titulo,
          mensaje: n.mensaje,
          fecha: n.created_at,
          total: 0,
          leidos: 0,
          noLeidos: 0,
          destinatarios: [] as any[],
        };
      }
      const g = grupos[key];
      g.total++;
      if (n.leida) g.leidos++; else g.noLeidos++;
      const u = usuariosMap[n.usuario_id] || { nombre: 'Usuario', email: '' };
      g.destinatarios.push({
        usuario_id: n.usuario_id,
        nombre: u.nombre,
        email: u.email,
        leida: !!n.leida,
      });
    });

    const lista = Object.values(grupos).sort((a: any, b: any) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return NextResponse.json({ mensajes: lista });
  } catch (error: any) {
    console.error('Error en metricas-mensajes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
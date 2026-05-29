'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function Calificar() {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [calificando, setCalificando] = useState<any>(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });

    const items: any[] = [];

    const { data: svcsCliente } = await supabase
      .from('servicios')
      .select('*, aplicaciones(*, usuarios(id, nombre, calificacion, trabajos_completados, foto_url))')
      .eq('cliente_id', user.id)
      .in('estado', ['completado', 'pagado'])
      .order('created_at', { ascending: false });

    for (const svc of svcsCliente || []) {
      const appAceptada = svc.aplicaciones?.find(
        (a: any) => a.estado === 'completado' || a.estado === 'aceptado'
      );
      if (!appAceptada) continue;
      const { data: reseñaExistente } = await supabase
        .from('reseñas').select('id')
        .eq('servicio_id', svc.id).eq('cliente_id', user.id).single();
      if (!reseñaExistente) {
        items.push({
          tipo: 'cliente_a_prestador',
          servicio: svc,
          aplicacion: appAceptada,
          calificarA: appAceptada.usuarios,
          label: 'Califica al prestador',
        });
      }
    }

    const { data: appsP } = await supabase
      .from('aplicaciones')
      .select('*, servicios(*, usuarios!cliente_id(id, nombre, calificacion, foto_url))')
      .eq('prestador_id', user.id)
      .in('estado', ['completado', 'aceptado'])
      .order('created_at', { ascending: false });

    for (const app of appsP || []) {
      const { data: reseñaExistente } = await supabase
        .from('reseñas').select('id')
        .eq('servicio_id', app.servicio_id).eq('prestador_id', user.id).single();
      if (!reseñaExistente) {
        items.push({
          tipo: 'prestador_a_cliente',
          servicio: app.servicios,
          aplicacion: app,
          calificarA: app.servicios?.usuarios,
          label: 'Califica al cliente',
        });
      }
    }

    setPendientes(items);
    setCargando(false);
  };

  const handleCalificar = async () => {
    if (!calificando || !usuario) return;
    setGuardando(true);
    try {
      if (calificando.tipo === 'cliente_a_prestador') {
        const { error } = await supabase.from('reseñas').insert({
          servicio_id: calificando.servicio.id,
          cliente_id: usuario.authId,
          prestador_id: calificando.aplicacion.prestador_id,
          estrellas,
          comentario,
        });
        if (error) throw error;

        const { data: reseñas } = await supabase
          .from('reseñas').select('estrellas')
          .eq('prestador_id', calificando.aplicacion.prestador_id);
        if (reseñas) {
          const promedio = reseñas.reduce((acc, r) => acc + r.estrellas, 0) / reseñas.length;
          await supabase.from('usuarios')
            .update({ calificacion: Math.round(promedio * 10) / 10 })
            .eq('id', calificando.aplicacion.prestador_id);
        }

        try {
          await supabase.from('notificaciones').insert({
            usuario_id: calificando.aplicacion.prestador_id,
            tipo: 'nueva_calificacion',
            titulo: `⭐ ${usuario.nombre} te calificó con ${estrellas} estrella${estrellas !== 1 ? 's' : ''}`,
            mensaje: `Por "${calificando.servicio.titulo}". ¡Califícalo tú también para cerrar el ciclo!`,
            link: '/calificar',
          });
        } catch (e) {}

      } else {
        const { error } = await supabase.from('reseñas').insert({
          servicio_id: calificando.servicio.id,
          cliente_id: calificando.servicio.cliente_id,
          prestador_id: usuario.authId,
          estrellas,
          comentario,
          es_del_prestador: true,
        });
        if (error) throw error;

        const { data: reseñas } = await supabase
          .from('reseñas').select('estrellas')
          .eq('cliente_id', calificando.servicio.cliente_id)
          .eq('es_del_prestador', true);
        if (reseñas && reseñas.length > 0) {
          const promedio = reseñas.reduce((acc, r) => acc + r.estrellas, 0) / reseñas.length;
          await supabase.from('usuarios')
            .update({ calificacion: Math.round(promedio * 10) / 10 })
            .eq('id', calificando.servicio.cliente_id);
        }

        try {
          await supabase.from('notificaciones').insert({
            usuario_id: calificando.servicio.cliente_id,
            tipo: 'nueva_calificacion',
            titulo: `⭐ ${usuario.nombre} te calificó con ${estrellas} estrella${estrellas !== 1 ? 's' : ''}`,
            mensaje: `Por "${calificando.servicio.titulo}".`,
            link: '/perfil',
          });
        } catch (e) {}
      }

      setExito(true);
      setCalificando(null);
      await cargarDatos();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  if (exito) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⭐</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Gracias por calificar!</h1>
          <p className="text-gray-400 mb-8 font-light">Tu reseña ayuda a otros usuarios a encontrar los mejores prestadores.</p>
          <a href="/home" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            Volver al inicio
          </a>
          <button onClick={() => setExito(false)}
            className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
            Ver más por calificar
          </button>
        </div>
      </main>
    );
  }

  if (calificando) {
    return (
      <main className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <button onClick={() => setCalificando(null)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</button>
            <h1 className="font-extrabold text-gray-900 text-lg">Calificar servicio</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-extrabold text-xl overflow-hidden">
                {calificando.calificarA?.foto_url ? (
                  <img src={calificando.calificarA.foto_url} className="w-full h-full object-cover"/>
                ) : (calificando.calificarA?.nombre?.charAt(0) || '?')}
              </div>
              <div>
                <p className="font-extrabold text-gray-900">{calificando.calificarA?.nombre}</p>
                <p className="text-sm text-gray-400">{calificando.servicio?.titulo}</p>
                <p className="text-xs text-purple-600 font-semibold mt-0.5">{calificando.label}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4 text-center">¿Cómo calificarías el servicio?</h3>
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setEstrellas(star)}
                  className="text-4xl transition-transform hover:scale-110 active:scale-95">
                  {star <= estrellas ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm font-semibold">
              {estrellas === 1 ? 'Muy malo' : estrellas === 2 ? 'Malo' : estrellas === 3 ? 'Regular' : estrellas === 4 ? 'Bueno' : 'Excelente'} — {estrellas}/5
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">💬 Cuéntanos tu experiencia</h3>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4}
              placeholder="¿Cómo fue el servicio? ¿Lo recomendarías?"
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none"/>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">🏷️ ¿Qué destacarías?</h3>
            <div className="flex flex-wrap gap-2">
              {['Puntual', 'Profesional', 'Limpio', 'Buen precio', 'Rápido', 'Amable', 'Recomendado'].map((tag) => (
                <button key={tag}
                  onClick={() => setComentario(prev => prev ? prev + ', ' + tag : tag)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-md mx-auto">
            <button onClick={handleCalificar} disabled={guardando}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {guardando ? 'Guardando...' : `⭐ Publicar reseña — ${estrellas} estrellas`}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Calificar servicios</h1>
          <p className="text-gray-400 text-sm">Ayuda a otros usuarios con tu reseña</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        {pendientes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">⭐</p>
            <p className="font-bold text-gray-900 mb-2">Sin servicios por calificar</p>
            <p className="text-gray-400 text-sm mb-6">Cuando completes un servicio podrás dejar tu reseña</p>
            <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">
              Buscar servicios
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((item, i) => (
              <button key={i}
                onClick={() => { setCalificando(item); setEstrellas(5); setComentario(''); }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full active:scale-95 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {item.calificarA?.foto_url ? (
                      <img src={item.calificarA.foto_url} className="w-full h-full object-cover"/>
                    ) : (item.calificarA?.nombre?.charAt(0) || '?')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-900 text-sm">{item.calificarA?.nombre}</p>
                      <span className="text-xs bg-yellow-100 text-yellow-600 font-bold px-2 py-1 rounded-full">⭐ Calificar</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.servicio?.titulo}</p>
                    <p className="text-xs text-purple-600 font-semibold mt-0.5">{item.label}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Nav activo="perfil" />
    </main>
  );
}
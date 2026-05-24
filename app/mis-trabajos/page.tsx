'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function MisTrabajos() {
  const [tab, setTab] = useState<'aplicaciones' | 'publicaciones'>('aplicaciones');
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('*, servicios(id, titulo, fecha, hora, presupuesto, urgente, usuarios(nombre))')
      .eq('prestador_id', user.id)
      .order('created_at', { ascending: false });
    setAplicaciones(apps || []);

    const { data: pubs } = await supabase
      .from('servicios')
      .select('*, aplicaciones(count)')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });
    setPublicaciones(pubs || []);

    setCargando(false);
  };

  const estadoColor: any = {
    pendiente: 'bg-yellow-100 text-yellow-600',
    aceptado: 'bg-green-100 text-green-600',
    rechazado: 'bg-red-100 text-red-600',
    activo: 'bg-blue-100 text-blue-600',
    completado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
    en_proceso: 'bg-purple-100 text-purple-600',
    pagado: 'bg-green-100 text-green-600',
  };

  const estadoLabel: any = {
    pendiente: '⏳ Pendiente',
    aceptado: '✅ Aceptado',
    rechazado: '❌ Rechazado',
    activo: '🟢 Activo',
    completado: '✅ Completado',
    cancelado: '❌ Cancelado',
    en_proceso: '🔄 En proceso',
    pagado: '💰 Pagado',
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

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-4">Mis Trabajos</h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setTab('aplicaciones')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === 'aplicaciones' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              ✋ Mis aplicaciones
            </button>
            <button onClick={() => setTab('publicaciones')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === 'publicaciones' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              📋 Mis solicitudes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {tab === 'aplicaciones' && (
          <div>
            {aplicaciones.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">✋</p>
                <p className="font-bold text-gray-900 mb-2">Sin aplicaciones todavía</p>
                <p className="text-gray-400 text-sm mb-6">Explora trabajos disponibles y aplica</p>
                <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">
                  Ver trabajos disponibles
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {aplicaciones.map((app) => (
                  <a key={app.id}
                    href={app.estado === 'aceptado' ? '/checkin' : `/trabajo?id=${app.servicios?.id}`}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 block active:scale-95 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">
                        {app.servicios?.titulo || 'Trabajo'}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${estadoColor[app.estado]}`}>
                        {estadoLabel[app.estado]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Cliente: {app.servicios?.usuarios?.nombre || 'Cliente'}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        📅 {app.servicios?.fecha} {app.servicios?.hora?.slice(0,5)}
                      </p>
                      <p className="font-extrabold text-purple-600 text-sm">
                        ${app.precio_ofrecido || app.servicios?.presupuesto} MXN
                      </p>
                    </div>
                    {app.estado === 'aceptado' && (
                      <div className="mt-3 bg-green-50 rounded-xl p-2 text-center">
                        <p className="text-green-600 text-xs font-bold">✅ Aceptado — Toca para hacer Check-in</p>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'publicaciones' && (
          <div>
            <a href="/publicar"
              className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4">
              + Publicar nueva solicitud
            </a>

            {publicaciones.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📋</p>
                <p className="font-bold text-gray-900 mb-2">Sin solicitudes todavía</p>
                <p className="text-gray-400 text-sm">Publica lo que necesitas y recibe ofertas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {publicaciones.map((pub) => {
                  const numApps = pub.aplicaciones?.[0]?.count || 0;
                  const necesitaPago = pub.estado === 'completado';
                  return (
                    <div key={pub.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <button onClick={() => window.location.href = `/aplicaciones?servicio=${pub.id}`}
                        className="w-full text-left">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">
                            {pub.titulo}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${estadoColor[pub.estado]}`}>
                            {estadoLabel[pub.estado]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <p className="text-xs text-gray-400">📅 {pub.fecha}</p>
                            <p className={`text-xs mt-0.5 font-semibold ${numApps > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                              👥 {numApps} aplicacion{numApps !== 1 ? 'es' : ''} recibida{numApps !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="font-extrabold text-purple-600 text-sm">${pub.presupuesto} MXN</p>
                        </div>
                        {numApps > 0 && pub.estado === 'activo' && (
                          <div className="mt-3 bg-purple-50 rounded-xl p-2 text-center">
                            <p className="text-purple-600 text-xs font-bold">Toca para ver y aceptar aplicaciones →</p>
                          </div>
                        )}
                      </button>
                      {necesitaPago && (
                        <div className="mt-3">
                          <a href={`/pago?id=${pub.id}`}
                            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm text-center shadow-sm hover:opacity-90 transition">
                            💳 Pagar ahora — ${pub.presupuesto + (pub.seguro ? 45 : 0)} MXN
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      <Nav activo="trabajos" />

    </main>
  );
}
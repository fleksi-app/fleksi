'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Aplicaciones() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [servicioActivo, setServicioActivo] = useState<any>(null);
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: svcs } = await supabase
      .from('servicios')
      .select('*')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });

    setServicios(svcs || []);
    setCargando(false);
  };

  const verAplicaciones = async (servicio: any) => {
    setServicioActivo(servicio);
    const { data } = await supabase
      .from('aplicaciones')
      .select('*, usuarios(nombre, calificacion, trabajos_completados, habilidades, foto_url, email)')
      .eq('servicio_id', servicio.id)
      .order('created_at', { ascending: false });
    setAplicaciones(data || []);
  };

  const handleDecision = async (aplicacionId: string, decision: 'aceptado' | 'rechazado') => {
    setProcesando(aplicacionId);
    try {
      await supabase.from('aplicaciones')
        .update({ estado: decision })
        .eq('id', aplicacionId);

      if (decision === 'aceptado') {
        await supabase.from('servicios')
          .update({ estado: 'en_proceso' })
          .eq('id', servicioActivo.id);

        await supabase.from('aplicaciones')
          .update({ estado: 'rechazado' })
          .eq('servicio_id', servicioActivo.id)
          .neq('id', aplicacionId);

        const appAceptada = aplicaciones.find(a => a.id === aplicacionId);
        try {
          await fetch('/api/enviar-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'aplicacion_aceptada',
              destinatario: appAceptada?.usuarios?.email || 'fernando.najera.nm@gmail.com',
              datos: {
                prestador: appAceptada?.usuarios?.nombre || 'Prestador',
                cliente: usuario?.nombre || 'Cliente',
                trabajo: servicioActivo.titulo,
                precio: appAceptada?.precio_ofrecido || servicioActivo.presupuesto,
                fecha: servicioActivo.fecha,
              },
            }),
          });
        } catch (emailErr) {
          console.log('Email no enviado pero aplicación aceptada');
        }
      }

      await verAplicaciones(servicioActivo);
    } catch (err) {
      console.error(err);
    } finally {
      setProcesando('');
    }
  };

  const estadoColor: any = {
    pendiente: 'bg-yellow-100 text-yellow-600',
    aceptado: 'bg-green-100 text-green-600',
    rechazado: 'bg-red-100 text-red-600',
  };

  const estadoLabel: any = {
    pendiente: '⏳ Pendiente',
    aceptado: '✅ Aceptado',
    rechazado: '❌ Rechazado',
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

  if (servicioActivo) {
    return (
      <main className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setServicioActivo(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                ←
              </button>
              <div>
                <h1 className="font-extrabold text-gray-900 text-lg">Aplicaciones recibidas</h1>
                <p className="text-gray-400 text-xs truncate max-w-xs">{servicioActivo.titulo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-4">
          {aplicaciones.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">⏳</p>
              <p className="font-bold text-gray-900 mb-2">Sin aplicaciones todavía</p>
              <p className="text-gray-400 text-sm">Los prestadores verán tu publicación y aplicarán pronto</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {aplicaciones.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {app.usuarios?.foto_url ? (
                        <img src={app.usuarios.foto_url} alt={app.usuarios.nombre} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {app.usuarios?.nombre?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{app.usuarios?.nombre || 'Prestador'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-yellow-500">⭐ {app.usuarios?.calificacion || '5.0'}</p>
                        <p className="text-xs text-gray-400">· {app.usuarios?.trabajos_completados || 0} trabajos</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor[app.estado]}`}>
                      {estadoLabel[app.estado]}
                    </span>
                  </div>

                  {app.usuarios?.habilidades?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {app.usuarios.habilidades.slice(0, 3).map((h: string) => (
                        <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">Precio ofrecido</span>
                      <span className="font-extrabold text-purple-600">${app.precio_ofrecido || servicioActivo.presupuesto} MXN</span>
                    </div>
                    {app.mensaje && (
                      <p className="text-sm text-gray-600 italic mt-2">"{app.mensaje}"</p>
                    )}
                  </div>

                  {app.estado === 'pendiente' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleDecision(app.id, 'rechazado')}
                        disabled={procesando === app.id}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-red-400 hover:text-red-500 transition disabled:opacity-50">
                        ❌ Rechazar
                      </button>
                      <button onClick={() => handleDecision(app.id, 'aceptado')}
                        disabled={procesando === app.id}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
                        {procesando === app.id ? 'Procesando...' : '✅ Aceptar'}
                      </button>
                    </div>
                  )}

                  {app.estado === 'aceptado' && (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-green-600 font-bold text-sm">✅ Trabajador confirmado</p>
                      <p className="text-green-500 text-xs mt-1">El servicio está en proceso</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="max-w-md mx-auto flex justify-around">
            <a href="/home" className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-xs text-gray-400">Inicio</span>
            </a>
            <a href="/publicar" className="flex flex-col items-center gap-1">
              <span className="text-xl">➕</span>
              <span className="text-xs text-gray-400">Publicar</span>
            </a>
            <a href="/aplicaciones" className="flex flex-col items-center gap-1">
              <span className="text-xl">📋</span>
              <span className="text-xs font-bold text-purple-600">Solicitudes</span>
            </a>
            <a href="/chat" className="flex flex-col items-center gap-1">
              <span className="text-xl">💬</span>
              <span className="text-xs text-gray-400">Mensajes</span>
            </a>
            <a href="/perfil" className="flex flex-col items-center gap-1">
              <span className="text-xl">👤</span>
              <span className="text-xs text-gray-400">Perfil</span>
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Mis solicitudes</h1>
          <p className="text-gray-400 text-sm">Gestiona las aplicaciones que has recibido</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        <a href="/publicar"
          className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4">
          + Publicar nueva solicitud
        </a>

        {servicios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-bold text-gray-900 mb-2">Sin solicitudes todavía</p>
            <p className="text-gray-400 text-sm">Publica lo que necesitas y recibe ofertas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {servicios.map((svc) => (
              <button key={svc.id} onClick={() => verAplicaciones(svc)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full active:scale-95 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">{svc.titulo}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    svc.estado === 'activo' ? 'bg-blue-100 text-blue-600' :
                    svc.estado === 'en_proceso' ? 'bg-purple-100 text-purple-600' :
                    svc.estado === 'completado' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {svc.estado === 'activo' ? '🟢 Activo' :
                     svc.estado === 'en_proceso' ? '🔄 En proceso' :
                     svc.estado === 'completado' ? '✅ Completado' : svc.estado}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">📅 {svc.fecha}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-purple-600 text-sm">${svc.presupuesto} MXN</p>
                    <span className="text-xs text-gray-400">Ver aplicaciones →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <a href="/home" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">Inicio</span>
          </a>
          <a href="/publicar" className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Publicar</span>
          </a>
          <a href="/aplicaciones" className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs font-bold text-purple-600">Solicitudes</span>
          </a>
          <a href="/chat" className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs text-gray-400">Mensajes</span>
          </a>
          <a href="/perfil" className="flex flex-col items-center gap-1">
            <span className="text-xl">👤</span>
            <span className="text-xs text-gray-400">Perfil</span>
          </a>
        </div>
      </div>
    </main>
  );
}
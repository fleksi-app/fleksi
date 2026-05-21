'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CheckIn() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
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

    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('*, servicios(*, usuarios(nombre, telefono))')
      .eq('prestador_id', user.id)
      .in('estado', ['aceptado', 'completado'])
      .order('created_at', { ascending: false });

    setTrabajos(apps || []);
    setCargando(false);
  };

  const handleCheckin = async (aplicacionId: string, servicioId: string) => {
    setProcesando(aplicacionId);
    try {
      const { error: e1 } = await supabase.from('aplicaciones')
        .update({ checkin_at: new Date().toISOString() })
        .eq('id', aplicacionId);

      if (e1) { alert('Error check-in: ' + e1.message); return; }

      const { error: e2 } = await supabase.from('servicios')
        .update({ estado: 'en_proceso' })
        .eq('id', servicioId);

      if (e2) { alert('Error servicio: ' + e2.message); return; }

      await cargarDatos();
    } finally {
      setProcesando('');
    }
  };

  const handleCheckout = async (aplicacionId: string, servicioId: string) => {
    setProcesando(aplicacionId);
    try {
      const { error: e1 } = await supabase.from('aplicaciones')
        .update({
          checkout_at: new Date().toISOString(),
          estado: 'completado'
        })
        .eq('id', aplicacionId);

      if (e1) { alert('Error checkout aplicacion: ' + e1.message); return; }

      const { error: e2 } = await supabase.from('servicios')
        .update({ estado: 'completado' })
        .eq('id', servicioId);

      if (e2) { alert('Error checkout servicio: ' + e2.message); return; }

      await cargarDatos();
    } finally {
      setProcesando('');
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

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Mis turnos activos</h1>
          <p className="text-gray-400 text-sm">Registra tu entrada y salida de cada trabajo</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        {trabajos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-bold text-gray-900 mb-2">Sin turnos activos</p>
            <p className="text-gray-400 text-sm mb-6">Cuando te acepten en un trabajo aparecerá aquí</p>
            <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trabajos.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">

                <div className="mb-4">
                  <h3 className="font-extrabold text-gray-900 mb-1">{app.servicios?.titulo}</h3>
                  <p className="text-sm text-gray-400">Cliente: {app.servicios?.usuarios?.nombre}</p>
                  <p className="text-sm text-gray-400">📅 {app.servicios?.fecha} {app.servicios?.hora?.slice(0,5)}</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tu pago</span>
                  <span className="font-extrabold text-purple-600 text-lg">${app.precio_ofrecido || app.servicios?.presupuesto} MXN</span>
                </div>

                {/* Sin checkin */}
                {!app.checkin_at && app.estado === 'aceptado' && (
                  <div>
                    <div className="bg-yellow-50 rounded-xl p-3 mb-3 text-center">
                      <p className="text-yellow-700 font-semibold text-sm">⏳ Esperando que inicies el trabajo</p>
                    </div>
                    <button
                      onClick={() => handleCheckin(app.id, app.servicios?.id)}
                      disabled={procesando === app.id}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                      {procesando === app.id ? 'Registrando...' : '📍 Check-in — Llegué'}
                    </button>
                  </div>
                )}

                {/* Con checkin, sin checkout */}
                {app.checkin_at && !app.checkout_at && (
                  <div>
                    <div className="bg-green-50 rounded-xl p-3 mb-3">
                      <p className="text-green-700 font-semibold text-sm text-center">✅ Check-in registrado</p>
                      <p className="text-green-600 text-xs text-center mt-1">
                        Entrada: {new Date(app.checkin_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                      <p className="text-blue-700 font-semibold text-sm">🔄 Trabajo en curso</p>
                      <p className="text-blue-600 text-xs mt-1">Presiona Check-out cuando termines</p>
                    </div>
                    <button
                      onClick={() => handleCheckout(app.id, app.servicios?.id)}
                      disabled={procesando === app.id}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                      {procesando === app.id ? 'Registrando...' : '✅ Check-out — Terminé'}
                    </button>
                  </div>
                )}

                {/* Completado */}
                {app.estado === 'completado' && app.checkout_at && (
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-green-700 font-extrabold">¡Trabajo completado!</p>
                    <p className="text-green-600 text-sm mt-1">Tu pago será procesado pronto</p>
                    <div className="flex justify-between mt-3 text-xs text-green-600">
                      <span>Entrada: {new Date(app.checkin_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</span>
                      <span>Salida: {new Date(app.checkout_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
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
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs text-gray-400">Buscar</span>
          </button>
          <a href="/checkin" className="flex flex-col items-center gap-1">
            <span className="text-xl">📍</span>
            <span className="text-xs font-bold text-purple-600">Check-in</span>
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
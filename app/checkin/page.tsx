'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function CheckIn() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [fotosAntes, setFotosAntes] = useState<{ [key: string]: File[] }>({});
  const [fotosDespues, setFotosDespues] = useState<{ [key: string]: File[] }>({});
  const [previasAntes, setPreviasAntes] = useState<{ [key: string]: string[] }>({});
  const [previasDespues, setPreviasDespues] = useState<{ [key: string]: string[] }>({});
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const inputAntesRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const inputDespuesRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const seleccionarFotos = (appId: string, tipo: 'antes' | 'despues', archivos: FileList | null) => {
    if (!archivos) return;
    const lista = Array.from(archivos).slice(0, 3);
    const previews = lista.map(f => URL.createObjectURL(f));

    if (tipo === 'antes') {
      setFotosAntes(prev => ({ ...prev, [appId]: lista }));
      setPreviasAntes(prev => ({ ...prev, [appId]: previews }));
    } else {
      setFotosDespues(prev => ({ ...prev, [appId]: lista }));
      setPreviasDespues(prev => ({ ...prev, [appId]: previews }));
    }
  };

  const subirFotos = async (appId: string, tipo: 'antes' | 'despues'): Promise<string[]> => {
    const fotos = tipo === 'antes' ? fotosAntes[appId] : fotosDespues[appId];
    if (!fotos || fotos.length === 0) return [];

    const urls: string[] = [];
    for (const foto of fotos) {
      const ext = foto.name.split('.').pop();
      const nombre = `${appId}/${tipo}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('fotos-trabajo')
        .upload(nombre, foto, { contentType: foto.type });

      if (error) { console.error('Error subiendo foto:', error); continue; }

      const { data: urlData } = supabase.storage
        .from('fotos-trabajo')
        .getPublicUrl(nombre);

      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleCheckin = async (aplicacionId: string, servicioId: string) => {
    setProcesando(aplicacionId);
    setSubiendoFotos(true);
    try {
      const urlsAntes = await subirFotos(aplicacionId, 'antes');

      const { error: e1 } = await supabase.from('aplicaciones')
        .update({
          checkin_at: new Date().toISOString(),
          ...(urlsAntes.length > 0 && { fotos_antes: urlsAntes })
        })
        .eq('id', aplicacionId);

      if (e1) { alert('Error check-in: ' + e1.message); return; }

      const { error: e2 } = await supabase.from('servicios')
        .update({ estado: 'en_proceso' })
        .eq('id', servicioId);

      if (e2) { alert('Error servicio: ' + e2.message); return; }

      setFotosAntes(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      setPreviasAntes(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      await cargarDatos();
    } finally {
      setProcesando('');
      setSubiendoFotos(false);
    }
  };

  const handleCheckout = async (aplicacionId: string, servicioId: string) => {
    setProcesando(aplicacionId);
    setSubiendoFotos(true);
    try {
      const urlsDespues = await subirFotos(aplicacionId, 'despues');

      const { error: e1 } = await supabase.from('aplicaciones')
        .update({
          checkout_at: new Date().toISOString(),
          estado: 'completado',
          ...(urlsDespues.length > 0 && { fotos_despues: urlsDespues })
        })
        .eq('id', aplicacionId);

      if (e1) { alert('Error checkout aplicacion: ' + e1.message); return; }

      const { error: e2 } = await supabase.from('servicios')
        .update({ estado: 'completado' })
        .eq('id', servicioId);

      if (e2) { alert('Error checkout servicio: ' + e2.message); return; }

      setFotosDespues(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      setPreviasDespues(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      await cargarDatos();
    } finally {
      setProcesando('');
      setSubiendoFotos(false);
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

                    {/* Fotos antes */}
                    <div className="mb-4">
                      <p className="text-sm font-bold text-gray-700 mb-2">📸 Foto antes de empezar <span className="text-gray-400 font-normal">(opcional, máx 3)</span></p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={el => { inputAntesRef.current[app.id] = el; }}
                        onChange={(e) => seleccionarFotos(app.id, 'antes', e.target.files)}
                      />
                      {previasAntes[app.id]?.length > 0 ? (
                        <div className="flex gap-2 mb-2">
                          {previasAntes[app.id].map((url, i) => (
                            <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                          ))}
                          <button
                            onClick={() => { setPreviasAntes(p => ({...p, [app.id]: []})); setFotosAntes(p => ({...p, [app.id]: []})); }}
                            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                            ✕ Quitar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => inputAntesRef.current[app.id]?.click()}
                          className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 font-semibold text-sm hover:bg-blue-50 transition">
                          + Agregar fotos del estado inicial
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleCheckin(app.id, app.servicios?.id)}
                      disabled={procesando === app.id}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                      {procesando === app.id ? (subiendoFotos ? '📤 Subiendo fotos...' : 'Registrando...') : '📍 Check-in — Llegué'}
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

                    {/* Mostrar fotos antes si existen */}
                    {app.fotos_antes?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-500 mb-2">📸 Fotos al llegar</p>
                        <div className="flex gap-2">
                          {app.fotos_antes.map((url: string, i: number) => (
                            <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                      <p className="text-blue-700 font-semibold text-sm">🔄 Trabajo en curso</p>
                      <p className="text-blue-600 text-xs mt-1">Presiona Check-out cuando termines</p>
                    </div>

                    {/* Fotos después */}
                    <div className="mb-4">
                      <p className="text-sm font-bold text-gray-700 mb-2">📸 Foto del resultado final <span className="text-gray-400 font-normal">(opcional, máx 3)</span></p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={el => { inputDespuesRef.current[app.id] = el; }}
                        onChange={(e) => seleccionarFotos(app.id, 'despues', e.target.files)}
                      />
                      {previasDespues[app.id]?.length > 0 ? (
                        <div className="flex gap-2 mb-2">
                          {previasDespues[app.id].map((url, i) => (
                            <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                          ))}
                          <button
                            onClick={() => { setPreviasDespues(p => ({...p, [app.id]: []})); setFotosDespues(p => ({...p, [app.id]: []})); }}
                            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                            ✕ Quitar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => inputDespuesRef.current[app.id]?.click()}
                          className="w-full py-3 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 font-semibold text-sm hover:bg-purple-50 transition">
                          + Agregar fotos del trabajo terminado
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleCheckout(app.id, app.servicios?.id)}
                      disabled={procesando === app.id}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                      {procesando === app.id ? (subiendoFotos ? '📤 Subiendo fotos...' : 'Registrando...') : '✅ Check-out — Terminé'}
                    </button>
                  </div>
                )}

                {/* Completado */}
                {app.estado === 'completado' && app.checkout_at && (
                  <div>
                    <div className="bg-green-50 rounded-xl p-4 text-center mb-3">
                      <p className="text-2xl mb-2">🎉</p>
                      <p className="text-green-700 font-extrabold">¡Trabajo completado!</p>
                      <p className="text-green-600 text-sm mt-1">Tu pago será procesado pronto</p>
                      <div className="flex justify-between mt-3 text-xs text-green-600">
                        <span>Entrada: {new Date(app.checkin_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</span>
                        <span>Salida: {new Date(app.checkout_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</span>
                      </div>
                    </div>

                    {/* Mostrar fotos antes/después si existen */}
                    {(app.fotos_antes?.length > 0 || app.fotos_despues?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {app.fotos_antes?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 mb-2">Antes</p>
                            <div className="flex flex-col gap-1">
                              {app.fotos_antes.map((url: string, i: number) => (
                                <img key={i} src={url} className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                              ))}
                            </div>
                          </div>
                        )}
                        {app.fotos_despues?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 mb-2">Después</p>
                            <div className="flex flex-col gap-1">
                              {app.fotos_despues.map((url: string, i: number) => (
                                <img key={i} src={url} className="w-full h-24 object-cover rounded-xl border border-gray-200" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { notificarEvento } from '@/lib/notificaciones';
import { evaluarCancelacion, calcularPenalizacion, PORCENTAJE_PENALIZACION } from '@/lib/cancelaciones';

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function obtenerUbicacion(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu dispositivo no soporta geolocalización'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

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
  const [errorGeo, setErrorGeo] = useState<{ [key: string]: string }>({});
  const [verificandoGeo, setVerificandoGeo] = useState<{ [key: string]: boolean }>({});
  const inputAntesRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const inputDespuesRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [confirmandoCancelar, setConfirmandoCancelar] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState<{ [key: string]: string }>({});

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('*, servicios(*, usuarios!cliente_id(id, nombre, telefono, email))')
      .eq('prestador_id', user.id)
      .in('estado', ['aceptado', 'completado'])
      .order('created_at', { ascending: false });
    setTrabajos(apps || []);
    setCargando(false);
  };

  const esDiaDelTrabajo = (fecha: string): boolean => {
    if (!fecha) return true;
    const hoy = new Date().toISOString().split('T')[0];
    return fecha === hoy;
  };

  const verificarUbicacion = async (app: any): Promise<boolean> => {
    const servicio = app.servicios;
    if (!servicio?.lat || !servicio?.lng) return true;
    setVerificandoGeo(prev => ({ ...prev, [app.id]: true }));
    setErrorGeo(prev => ({ ...prev, [app.id]: '' }));
    try {
      const pos = await obtenerUbicacion();
      const distancia = calcularDistancia(
        pos.coords.latitude, pos.coords.longitude,
        servicio.lat, servicio.lng
      );
      if (distancia > 500) {
        setErrorGeo(prev => ({
          ...prev,
          [app.id]: `📍 Estás a ${Math.round(distancia)} metros del lugar del trabajo. Debes estar a menos de 500 metros para hacer check-in.`
        }));
        return false;
      }
      return true;
    } catch (err: any) {
      setErrorGeo(prev => ({
        ...prev,
        [app.id]: '📍 No pudimos verificar tu ubicación. ¿Confirmas que estás en el lugar de trabajo?'
      }));
      return false;
    } finally {
      setVerificandoGeo(prev => ({ ...prev, [app.id]: false }));
    }
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
      const { error } = await supabase.storage.from('fotos-trabajo').upload(nombre, foto, { contentType: foto.type });
      if (error) { console.error('Error subiendo foto:', error); continue; }
      const { data: urlData } = supabase.storage.from('fotos-trabajo').getPublicUrl(nombre);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleCheckin = async (app: any, forzar = false) => {
    const aplicacionId = app.id;
    const servicioId = app.servicios?.id;

    if (!esDiaDelTrabajo(app.servicios?.fecha)) {
      setErrorGeo(prev => ({
        ...prev,
        [aplicacionId]: `📅 El check-in solo está disponible el día del trabajo (${app.servicios?.fecha}).`
      }));
      return;
    }

    if (!forzar) {
      const ubicacionOk = await verificarUbicacion(app);
      if (!ubicacionOk) return;
    }

    setProcesando(aplicacionId);
    setSubiendoFotos(true);
    setErrorGeo(prev => ({ ...prev, [aplicacionId]: '' }));

    try {
      const urlsAntes = await subirFotos(aplicacionId, 'antes');
      const { error: e1 } = await supabase.from('aplicaciones')
        .update({ checkin_at: new Date().toISOString(), ...(urlsAntes.length > 0 && { fotos_antes: urlsAntes }) })
        .eq('id', aplicacionId);
      if (e1) { alert('Error check-in: ' + e1.message); return; }

      const { error: e2 } = await supabase.from('servicios').update({ estado: 'en_proceso' }).eq('id', servicioId);
      if (e2) { alert('Error servicio: ' + e2.message); return; }

      const clienteId = app.servicios?.usuarios?.id;
      if (clienteId) {
        try {
          await supabase.from('notificaciones').insert({
            usuario_id: clienteId,
            tipo: 'checkin_realizado',
            titulo: `📍 ${usuario?.nombre} llegó al trabajo`,
            mensaje: `Tu flekser acaba de hacer check-in en "${app.servicios?.titulo}". ¡El trabajo comenzó!`,
            link: `/aplicaciones?servicio=${servicioId}`,
          });
        } catch (e) {}
      }

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
        .update({ checkout_at: new Date().toISOString(), estado: 'completado', ...(urlsDespues.length > 0 && { fotos_despues: urlsDespues }) })
        .eq('id', aplicacionId);
      if (e1) { alert('Error checkout aplicacion: ' + e1.message); return; }
      const { error: e2 } = await supabase.from('servicios').update({ estado: 'completado' }).eq('id', servicioId);
      if (e2) { alert('Error checkout servicio: ' + e2.message); return; }

      const trabajo = trabajos.find(t => t.id === aplicacionId);
      const clienteId = trabajo?.servicios?.usuarios?.id;
      const clienteEmail = trabajo?.servicios?.usuarios?.email;
      const tituloTrabajo = trabajo?.servicios?.titulo;

      if (clienteId) {
        try {
          await notificarEvento('trabajo_terminado', clienteEmail || 'fernando.najera.nm@gmail.com', {
            cliente_id: clienteId,
            prestador: usuario?.nombre || 'Flekser',
            trabajo: tituloTrabajo,
            servicio_id: servicioId,
          });
        } catch (e) {}

        try {
          await supabase.from('notificaciones').insert({
            usuario_id: clienteId,
            tipo: 'checkout_realizado',
            titulo: `✅ ${usuario?.nombre} terminó el trabajo`,
            mensaje: `Tu flekser hizo check-out en "${tituloTrabajo}". ¡Confirma el trabajo para liberar el pago!`,
            link: `/aplicaciones?servicio=${servicioId}`,
          });
        } catch (e) {}
      }

      setFotosDespues(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      setPreviasDespues(prev => { const n = {...prev}; delete n[aplicacionId]; return n; });
      await cargarDatos();
    } finally {
      setProcesando('');
      setSubiendoFotos(false);
    }
  };

  const getMapsUrl = (direccion: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;

  const handleCancelar = async (app: any) => {
    const servicioId = app.servicios?.id;
    if (!servicioId) return;
    setCancelando(true);
    setErrorCancelar(prev => ({ ...prev, [app.id]: '' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/cancelar-servicio', {
        method: 'POST',
        headers,
        body: JSON.stringify({ servicioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorCancelar(prev => ({ ...prev, [app.id]: data.error || 'No se pudo cancelar el trabajo.' }));
        return;
      }
      setConfirmandoCancelar('');
      await cargarDatos();
    } catch (e) {
      setErrorCancelar(prev => ({ ...prev, [app.id]: 'Hubo un error al cancelar. Intenta de nuevo.' }));
    } finally {
      setCancelando(false);
    }
  };

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const esEmpresa = rol === 'empresa';

  const headerGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';
  const btnGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';
  const precioColor = esEmpresa ? 'text-blue-800' : 'text-purple-600';
  const precioBg = esEmpresa ? 'from-slate-50 to-blue-50' : 'from-blue-50 to-purple-50';
  const bgFondo = esEmpresa ? 'bg-slate-50' : 'bg-gray-50';
  const spinnerColor = esEmpresa ? 'border-blue-800' : 'border-purple-600';
  const ctaGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';

  if (cargando) {
    return (
      <main className={`min-h-screen ${bgFondo} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${spinnerColor}`}></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bgFondo} pb-32`}>

      <div className={`bg-gradient-to-r ${headerGradient} px-6 pt-12 pb-4 shadow-sm`}>
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-white text-xl mb-1">Mis turnos activos</h1>
          <p className="text-white/70 text-sm">Registra tu entrada y salida de cada trabajo</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        {trabajos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-bold text-gray-900 mb-2">Sin turnos activos</p>
            <p className="text-gray-400 text-sm mb-6">Cuando te acepten en un trabajo aparecerá aquí</p>
            <a href="/home" className={`inline-block px-6 py-3 bg-gradient-to-r ${ctaGradient} text-white rounded-2xl font-bold text-sm`}>
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trabajos.map((app) => {
              const esDia = esDiaDelTrabajo(app.servicios?.fecha);
              const tieneGeo = app.servicios?.lat && app.servicios?.lng;
              const errGeo = errorGeo[app.id];
              const verificando = verificandoGeo[app.id];
              const esErrorUbicacion = errGeo?.includes('No pudimos verificar');

              return (
                <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <h3 className="font-extrabold text-gray-900 mb-1">{app.servicios?.titulo}</h3>
                    <p className="text-sm text-gray-400">Cliente: {app.servicios?.usuarios?.nombre}</p>
                    <p className="text-sm text-gray-400">📅 {app.servicios?.fecha} {app.servicios?.hora?.slice(0,5)}</p>
                    {tieneGeo && (
                      <p className="text-xs text-green-600 font-semibold mt-1">📍 Check-in con verificación de ubicación</p>
                    )}
                    {app.servicios?.direccion && (
                      <a href={getMapsUrl(app.servicios.direccion)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition">
                        <span className="text-lg">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-blue-700">Ver en Google Maps</p>
                          <p className="text-xs text-blue-500 truncate">{app.servicios.direccion}</p>
                        </div>
                        <span className="text-blue-500 text-xs font-bold flex-shrink-0">→</span>
                      </a>
                    )}
                  </div>

                  <div className={`bg-gradient-to-r ${precioBg} rounded-xl p-3 mb-4 flex justify-between items-center`}>
                    <span className="text-sm text-gray-600">Tu pago</span>
                    <span className={`font-extrabold ${precioColor} text-lg`}>${app.precio_ofrecido || app.servicios?.presupuesto} MXN</span>
                  </div>

                  {!app.checkin_at && app.estado === 'aceptado' && (
                    <div>
                      {!esDia ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-center">
                          <p className="text-amber-700 font-bold text-sm">📅 Check-in disponible el {app.servicios?.fecha}</p>
                          <p className="text-amber-600 text-xs mt-1">Solo puedes registrar tu llegada el día del trabajo</p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-xl p-3 mb-3 text-center">
                          <p className="text-yellow-700 font-semibold text-sm">⏳ Esperando que inicies el trabajo</p>
                          {tieneGeo && <p className="text-yellow-600 text-xs mt-1">📍 Se verificará tu ubicación al hacer check-in</p>}
                        </div>
                      )}

                      {errGeo && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                          <p className="text-red-700 text-sm font-semibold">{errGeo}</p>
                          {esErrorUbicacion && (
                            <button
                              onClick={() => handleCheckin(app, true)}
                              className="mt-2 w-full py-2 bg-red-100 text-red-700 rounded-xl font-bold text-sm hover:bg-red-200 transition">
                              ✅ Sí, confirmo que estoy en el lugar
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">📸 Foto antes de empezar <span className="text-gray-400 font-normal">(opcional, máx 3)</span></p>
                        <input type="file" accept="image/*" multiple className="hidden"
                          ref={el => { inputAntesRef.current[app.id] = el; }}
                          onChange={(e) => seleccionarFotos(app.id, 'antes', e.target.files)}/>
                        {previasAntes[app.id]?.length > 0 ? (
                          <div className="flex gap-2 mb-2">
                            {previasAntes[app.id].map((url, i) => (
                              <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200"/>
                            ))}
                            <button onClick={() => { setPreviasAntes(p => ({...p, [app.id]: []})); setFotosAntes(p => ({...p, [app.id]: []})); }}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                              ✕ Quitar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => inputAntesRef.current[app.id]?.click()}
                            className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 font-semibold text-sm hover:bg-blue-50 transition">
                            + Agregar fotos del estado inicial
                          </button>
                        )}
                      </div>

                      {verificando ? (
                        <div className="w-full py-4 bg-gray-100 rounded-2xl flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
                          <span className="text-gray-600 font-semibold text-sm">Verificando ubicación...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckin(app)}
                          disabled={procesando === app.id || !esDia}
                          className={`w-full py-4 bg-gradient-to-r ${btnGradient} text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50`}>
                          {procesando === app.id
                            ? (subiendoFotos ? '📤 Subiendo fotos...' : 'Registrando...')
                            : '📍 Check-in — Llegué'}
                        </button>
                      )}

                      {confirmandoCancelar === app.id ? (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-3">
                          <p className="font-bold text-red-700 text-sm mb-1">⚠️ ¿Cancelar este trabajo?</p>
                          {(() => {
                            const evaluacion = evaluarCancelacion(app.servicios?.fecha, app.servicios?.hora);
                            const precio = app.precio_ofrecido || app.servicios?.presupuesto || 0;
                            const montoPenalizacion = evaluacion.aplicaPenalizacion ? calcularPenalizacion(precio) : 0;
                            return evaluacion.aplicaPenalizacion ? (
                              <div className="bg-white border border-red-200 rounded-xl p-3 mb-3">
                                <p className="text-red-700 text-xs font-bold mb-1">⚠️ Esta cancelación tiene penalización</p>
                                <p className="text-red-600 text-xs leading-relaxed">{evaluacion.motivo}</p>
                                <p className="text-red-600 text-xs mt-1">
                                  El cliente recibirá el reembolso completo de su pago, más un crédito adicional del {Math.round(PORCENTAJE_PENALIZACION * 100)}% (${montoPenalizacion.toLocaleString('es-MX')} MXN) en su wallet, como compensación.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-white border border-green-200 rounded-xl p-3 mb-3">
                                <p className="text-green-700 text-xs font-semibold">✅ Sin penalización adicional</p>
                                <p className="text-green-600 text-xs mt-1">{evaluacion.motivo}</p>
                                <p className="text-green-600 text-xs mt-1">El cliente recibirá el reembolso completo de su pago.</p>
                              </div>
                            );
                          })()}

                          {errorCancelar[app.id] && (
                            <div className="bg-red-100 border border-red-200 rounded-xl p-2 mb-3">
                              <p className="text-red-700 text-xs font-semibold">{errorCancelar[app.id]}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button onClick={() => { setConfirmandoCancelar(''); setErrorCancelar(prev => ({ ...prev, [app.id]: '' })); }}
                              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">
                              No, mantener
                            </button>
                            <button onClick={() => handleCancelar(app)} disabled={cancelando}
                              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                              {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmandoCancelar(app.id)}
                          className="w-full py-3 mt-3 border-2 border-red-200 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition">
                          🗑️ Cancelar este trabajo
                        </button>
                      )}
                    </div>
                  )}

                  {app.checkin_at && !app.checkout_at && (
                    <div>
                      <div className="bg-green-50 rounded-xl p-3 mb-3">
                        <p className="text-green-700 font-semibold text-sm text-center">✅ Check-in registrado</p>
                        <p className="text-green-600 text-xs text-center mt-1">
                          Entrada: {new Date(app.checkin_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </div>
                      {app.fotos_antes?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-500 mb-2">📸 Fotos al llegar</p>
                          <div className="flex gap-2">
                            {app.fotos_antes.map((url: string, i: number) => (
                              <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200"/>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                        <p className="text-blue-700 font-semibold text-sm">🔄 Trabajo en curso</p>
                        <p className="text-blue-600 text-xs mt-1">Presiona Check-out cuando termines</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">📸 Foto del resultado final <span className="text-gray-400 font-normal">(opcional, máx 3)</span></p>
                        <input type="file" accept="image/*" multiple className="hidden"
                          ref={el => { inputDespuesRef.current[app.id] = el; }}
                          onChange={(e) => seleccionarFotos(app.id, 'despues', e.target.files)}/>
                        {previasDespues[app.id]?.length > 0 ? (
                          <div className="flex gap-2 mb-2">
                            {previasDespues[app.id].map((url, i) => (
                              <img key={i} src={url} className="w-20 h-20 object-cover rounded-xl border border-gray-200"/>
                            ))}
                            <button onClick={() => { setPreviasDespues(p => ({...p, [app.id]: []})); setFotosDespues(p => ({...p, [app.id]: []})); }}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                              ✕ Quitar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => inputDespuesRef.current[app.id]?.click()}
                            className="w-full py-3 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 font-semibold text-sm hover:bg-purple-50 transition">
                            + Agregar fotos del trabajo terminado
                          </button>
                        )}
                      </div>
                      <button onClick={() => handleCheckout(app.id, app.servicios?.id)}
                        disabled={procesando === app.id}
                        className={`w-full py-4 bg-gradient-to-r ${btnGradient} text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50`}>
                        {procesando === app.id ? (subiendoFotos ? '📤 Subiendo fotos...' : 'Registrando...') : '✅ Check-out — Terminé'}
                      </button>
                    </div>
                  )}

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
                      {(app.fotos_antes?.length > 0 || app.fotos_despues?.length > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          {app.fotos_antes?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-2">Antes</p>
                              <div className="flex flex-col gap-1">
                                {app.fotos_antes.map((url: string, i: number) => (
                                  <img key={i} src={url} className="w-full h-24 object-cover rounded-xl border border-gray-200"/>
                                ))}
                              </div>
                            </div>
                          )}
                          {app.fotos_despues?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-2">Después</p>
                              <div className="flex flex-col gap-1">
                                {app.fotos_despues.map((url: string, i: number) => (
                                  <img key={i} src={url} className="w-full h-24 object-cover rounded-xl border border-gray-200"/>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Nav activo="inicio" />
    </main>
  );
}
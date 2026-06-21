'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { calcularPagoFlekser, calcularPagoCliente } from '@/lib/comisiones';
import { notificarEvento } from '@/lib/notificaciones';

function BotonCompartir({ trabajo }: { trabajo: any }) {
  const [copiado, setCopiado] = useState(false);

  const handleCompartir = async () => {
    const url = window.location.origin + '/trabajo?id=' + trabajo.id;
    const texto = '🔧 ' + trabajo.titulo + '\n📍 ' + (trabajo.ciudad || 'Irapuato') + '\n\nAplica en Fleksi 👇';
    if (navigator.share) {
      try { await navigator.share({ title: trabajo.titulo, text: texto, url }); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(texto + '\n' + url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch (e) {}
    }
  };

  return (
    <button onClick={handleCompartir}
      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition active:scale-95">
      {copiado ? '✅' : '🔗'}
    </button>
  );
}

function DetalleTrabajoContent() {
  const searchParams = useSearchParams();
  const [aplicado, setAplicado] = useState(false);
  const [yaAplico, setYaAplico] = useState(false);
  const [miPrecio, setMiPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoPagina, setCargandoPagina] = useState(true);
  const [error, setError] = useState('');
  const [trabajo, setTrabajo] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [mostrarDesglose, setMostrarDesglose] = useState(false);
  const [noDisponible, setNoDisponible] = useState(false);
  const [proponeOtraFecha, setProponeOtraFecha] = useState(false);
  const [fechaPropuesta, setFechaPropuesta] = useState('');
  const [horaPropuesta, setHoraPropuesta] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const servicioId = searchParams.get('id');
    let servicio = null;

    if (servicioId) {
      const { data } = await supabase.from('servicios')
        .select('*, usuarios!cliente_id(nombre, calificacion, foto_url, email)')
        .eq('id', servicioId).single();
      servicio = data;
    }

    if (!user) {
      if (servicio) {
        const vencidoAlVuelo = servicio.estado === 'activo' && servicio.fecha &&
          new Date(servicio.fecha + 'T' + (servicio.hora || '23:59')) < new Date();
        if (servicio.estado !== 'activo' || vencidoAlVuelo) {
          setTrabajo(servicio); setSinSesion(true); setNoDisponible(true);
        } else {
          setTrabajo(servicio); setSinSesion(true);
        }
      }
      else window.location.href = '/login';
      setCargandoPagina(false);
      return;
    }

    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, id: user.id });

    if (!servicio) {
      const { data } = await supabase.from('servicios')
        .select('*, usuarios!cliente_id(nombre, calificacion, foto_url, email)')
        .eq('estado', 'activo').neq('cliente_id', user.id)
        .order('created_at', { ascending: false }).limit(10);
      const ahoraFiltro = new Date();
      servicio = (data || []).find((s: any) => {
        if (!s.fecha) return true;
        const limite = new Date(s.fecha + 'T' + (s.hora || '23:59'));
        return limite >= ahoraFiltro;
      }) || null;
    }

    if (servicio) {
      setTrabajo(servicio);
      if (servicio.cliente_id !== user.id) {
        const vencidoAlVuelo = servicio.estado === 'activo' && servicio.fecha &&
          new Date(servicio.fecha + 'T' + (servicio.hora || '23:59')) < new Date();
        if (servicio.estado !== 'activo' || vencidoAlVuelo) {
          setNoDisponible(true);
          setCargandoPagina(false);
          return;
        }
        const { data: appExistente } = await supabase.from('aplicaciones').select('id')
          .eq('servicio_id', servicio.id).eq('prestador_id', user.id).single();
        if (appExistente) setYaAplico(true);
        const hoy = new Date().toISOString();
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        const visitasSemana = (servicio.visitas_semana || []).filter((v: string) => new Date(v) > hace7dias);
        visitasSemana.push(hoy);
        await supabase.from('servicios').update({
          visitas: (servicio.visitas || 0) + 1,
          visitas_semana: visitasSemana,
        }).eq('id', servicio.id);
      }
    }
    setCargandoPagina(false);
  };

  const handleAplicar = async () => {
    if (!trabajo || !usuario) return;
    if (trabajo.estado !== 'activo') { setError('Esta solicitud ya no está disponible.'); return; }
    if (trabajo.fecha) {
      const limite = new Date(trabajo.fecha + 'T' + (trabajo.hora || '23:59'));
      if (limite < new Date()) { setError('Esta solicitud ya venció.'); return; }
    }
    if (yaAplico) { setError('Ya aplicaste a este trabajo.'); return; }
    if (!miPrecio || Number(miPrecio) <= 0) { setError('Escribe el precio que cobrarás por este trabajo.'); return; }
    if (trabajo.urgente && !horaPropuesta.trim()) { setError('Indica en cuánto tiempo puedes llegar.'); return; }
    if (!trabajo.urgente && proponeOtraFecha && (!fechaPropuesta || !horaPropuesta)) { setError('Indica la fecha y hora que propones.'); return; }
    setCargando(true); setError('');
    try {
      const { error: dbError } = await supabase.from('aplicaciones').insert({
        servicio_id: trabajo.id,
        prestador_id: usuario.id,
        precio_ofrecido: Number(miPrecio),
        mensaje: mensaje || null,
        estado: 'pendiente',
        propone_otra_fecha: trabajo.urgente ? false : proponeOtraFecha,
        fecha_propuesta: (!trabajo.urgente && proponeOtraFecha) ? fechaPropuesta : null,
        hora_propuesta: trabajo.urgente ? horaPropuesta : (proponeOtraFecha ? horaPropuesta : null),
      });
      if (dbError) throw dbError;
      try {
        await notificarEvento('nueva_aplicacion', trabajo.usuarios?.email || 'fernando.najera.nm@gmail.com', {
          cliente: trabajo.usuarios?.nombre || 'Cliente',
          cliente_id: trabajo.cliente_id,
          prestador: usuario.nombre,
          prestador_id: usuario.id,
          trabajo: trabajo.titulo,
          servicio_id: trabajo.id,
          precio: miPrecio,
        });
      } catch (e) {}
      setAplicado(true); setYaAplico(true);
    } catch (err: any) {
      setError('Hubo un error al enviar tu aplicación. Intenta de nuevo.');
    } finally { setCargando(false); }
  };

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️', mudanza: '🚚', ejecutivo: '🚗',
    interprete: '🗣️', cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', envios: '🛵', mascotas: '🐾', super: '🛒', otro: '✨',
  };

  if (cargandoPagina) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando trabajo...</p>
      </div>
    </main>
  );

  if (!trabajo) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="font-bold text-gray-900 mb-2">No hay trabajos disponibles</p>
        <p className="text-gray-400 text-sm mb-6">Vuelve más tarde</p>
        <a href="/home" className="inline-block px-6 py-3 text-white rounded-2xl font-bold" style={{background:'#7B2FE0'}}>Volver al inicio</a>
      </div>
    </main>
  );

  if (noDisponible) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">🚫</p>
        <p className="font-bold text-gray-900 mb-2">Esta solicitud ya no está disponible</p>
        <p className="text-gray-400 text-sm mb-6">El cliente la canceló o ya no está activa. No es posible aplicar a este trabajo.</p>
        <a href="/home" className="inline-block px-6 py-3 text-white rounded-2xl font-bold" style={{background:'#7B2FE0'}}>Volver al inicio</a>
      </div>
    </main>
  );

  const precioNum = Number(miPrecio) || 0;
  const ganancia = precioNum > 0 ? calcularPagoFlekser(precioNum) : null;
  const esPropioServicio = trabajo.cliente_id === usuario?.id;
  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const homeUrl = rol === 'empresa' ? '/home-empresa' : '/home';
  const tieneFoto = !!usuario?.foto_url;
  const visitasSemana = (trabajo.visitas_semana || []).filter((v: string) => {
    const hace7dias = new Date(); hace7dias.setDate(hace7dias.getDate() - 7); return new Date(v) > hace7dias;
  }).length;

  if (aplicado) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6' style={{background:'#7B2FE0'}}">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Aplicación enviada!</h1>
        <p className="text-gray-400 mb-8 font-light">{trabajo.usuarios?.nombre} recibirá tu solicitud y te contactará pronto.</p>
        <div className="bg-white rounded-2xl p-5 mb-6 text-left border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-gray-400 text-sm">Trabajo</span>
            <span className="font-semibold text-sm text-gray-900 text-right max-w-48">{trabajo.titulo}</span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-gray-400 text-sm">Tu precio</span>
            <span className="font-bold text-sm text-gray-900">${Number(miPrecio).toLocaleString('es-MX')} MXN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 text-sm font-bold">💰 Recibirás</span>
            <span className="font-extrabold text-green-600">${ganancia?.total.toLocaleString('es-MX')} MXN</span>
          </div>
                  </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
          <p className="text-blue-800 text-xs font-semibold">⏳ ¿Qué sigue?</p>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">El cliente revisará tu propuesta. Si te acepta, recibirás una notificación y el pago quedará retenido en Fleksi hasta que completes el trabajo.</p>
        </div>
        <a href="/mis-trabajos" className="block w-full py-4 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition mb-3" style={{background: '#7B2FE0'}}>Ver mis aplicaciones</a>
        <a href={homeUrl} className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">Volver al inicio</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-56" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => window.history.back()}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
            <h1 className="font-extrabold text-gray-900 text-lg flex-1">Detalle del trabajo</h1>
            <BotonCompartir trabajo={trabajo} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {!tieneFoto && !esPropioServicio && !sinSesion && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-extrabold text-amber-800 text-sm mb-1">Tu perfil está incompleto</p>
                <p className="text-amber-700 text-xs leading-relaxed">Los fleksers sin foto de perfil tienen <span className="font-bold">90% menos probabilidades</span> de ser contratados.</p>
                <a href="/perfil" className="inline-block mt-2 text-xs font-bold text-amber-800 underline">Completar perfil ahora →</a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{background: '#F5F0FF'}}>
              {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{trabajo.titulo}</h2>
                {trabajo.urgente && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">🔴 Urgente</span>}
              </div>
              <p className="text-gray-400 text-sm mt-1">{trabajo.categoria}</p>
              {visitasSemana > 0 && <p className="text-xs text-gray-400 mt-1">👁️ {visitasSemana} vista{visitasSemana !== 1 ? 's' : ''} esta semana</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">📅 Cuándo</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.fecha}</p>
              {trabajo.hora && <p className="text-xs text-gray-400">{trabajo.hora.slice(0,5)}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">💳 Pago</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.metodo_pago === 'stripe' ? 'Tarjeta' : 'Efectivo'}</p>
            </div>
          </div>
        </div>

        {trabajo.descripcion && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">📋 Descripción</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{trabajo.descripcion}</p>
          </div>
        )}

        {trabajo.foto_problema && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">📸 Foto del trabajo</h3>
            <img src={trabajo.foto_problema} alt="Foto del trabajo" className="w-full rounded-xl object-cover max-h-64"/>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">👤 Cliente</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{background: '#7B2FE0'}}>
              {trabajo.usuarios?.foto_url
                ? <img src={trabajo.usuarios.foto_url} alt="cliente" className="w-full h-full object-cover"/>
                : <span className="text-white font-bold text-lg">{trabajo.usuarios?.nombre?.charAt(0) || '?'}</span>}
            </div>
            <div>
              <p className="font-bold text-gray-900">{trabajo.usuarios?.nombre || 'Cliente'}</p>
              <p className="text-sm text-yellow-500">⭐ {trabajo.usuarios?.calificacion || '5.0'}</p>
            </div>
          </div>
        </div>

        {yaAplico && !aplicado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-green-700 font-bold">✅ Ya aplicaste a este trabajo</p>
            <p className="text-green-600 text-sm mt-1">Espera la respuesta del cliente</p>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

        {/* ── BLOQUE DE PRECIO ── */}
        {!yaAplico && !esPropioServicio && tieneFoto && !sinSesion && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-1">💰 ¿Cuánto cobras por este trabajo?</h3>
            <p className="text-xs text-gray-400 mb-4">El cliente verá tu precio propuesto.</p>

            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Tu precio (MXN)</label>
              <input
                type="number"
                placeholder="Ej. 500"
                value={miPrecio}
                onChange={(e) => setMiPrecio(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-xl font-bold"/>
            </div>

            {precioNum > 0 && ganancia && (
              <div className="bg-green-50 rounded-2xl overflow-hidden border border-green-100 mb-4">
                <div className="flex justify-between items-center px-4 py-4">
                  <span className="text-sm font-extrabold text-green-700">💰 Recibirás</span>
                  <span className="text-2xl font-extrabold text-green-700">${ganancia.total.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Mensaje al cliente <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                placeholder="Cuéntale tu experiencia, por qué eres la mejor opción..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none text-sm"/>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              {trabajo.urgente ? (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">⏱️ ¿En cuánto tiempo puedes llegar?</label>
                  <p className="text-xs text-gray-400 mb-3">El cliente elegirá según quién pueda llegar más rápido</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {['En 15 min', 'En 30 min', 'En 1 hora', 'En 2 horas'].map((opcion) => (
                      <button key={opcion} onClick={() => setHoraPropuesta(horaPropuesta === opcion ? '' : opcion)}
                        className={'py-2.5 rounded-xl text-sm font-bold transition border-2 ' + (horaPropuesta === opcion ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-red-300')}>
                        🔴 {opcion}
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="O escribe otro tiempo... ej. En 45 min"
                    value={['En 15 min','En 30 min','En 1 hora','En 2 horas'].includes(horaPropuesta) ? '' : horaPropuesta}
                    onChange={(e) => setHoraPropuesta(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-gray-900 text-sm transition"/>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={proponeOtraFecha} onChange={(e) => setProponeOtraFecha(e.target.checked)} className="w-5 h-5 rounded accent-purple-600"/>
                    <span className="text-sm font-semibold text-gray-700">📅 No puedo en esa fecha/hora, propongo otra</span>
                  </label>
                  {proponeOtraFecha && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha que propones</label>
                        <input type="date" value={fechaPropuesta} onChange={(e) => setFechaPropuesta(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm"/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora que propones</label>
                        <input type="time" value={horaPropuesta} onChange={(e) => setHoraPropuesta(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm"/>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-20">
        <div className="max-w-md mx-auto">
          {sinSesion ? (
            <div className="flex flex-col gap-2">
              <a href="/registro" className="block w-full py-3.5 text-white rounded-2xl font-extrabold text-center hover:opacity-90 transition text-sm" style={{background: '#7B2FE0'}}>
                ⚡ Crear cuenta y aplicar gratis
              </a>
              <a href="/login" className="block w-full py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-center hover:border-purple-400 transition text-sm">
                Ya tengo cuenta → Iniciar sesión
              </a>
            </div>
          ) : esPropioServicio ? (
            <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-center">Esta es tu propia solicitud</div>
          ) : !tieneFoto ? (
            <a href="/perfil" className="block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition">
              📷 Agrega tu foto para aplicar
            </a>
          ) : !yaAplico ? (
            <button
              onClick={handleAplicar}
              disabled={cargando || !miPrecio || Number(miPrecio) <= 0}
              className="w-full py-4 text-white rounded-2xl font-extrabold text-lg hover:opacity-90 transition disabled:opacity-50" style={{background: '#7B2FE0'}}>
              {cargando ? 'Enviando...' : precioNum > 0 && ganancia ? '✋ Enviar propuesta — recibirás $' + ganancia.total.toLocaleString('es-MX') + ' MXN' : '✋ Escribe tu precio para aplicar'}
            </button>
          ) : (
            <a href="/mis-trabajos" className="block w-full py-3 text-white rounded-2xl font-bold text-center hover:opacity-90 transition" style={{background: '#7B2FE0'}}>
              Ver mis aplicaciones →
            </a>
          )}
        </div>
      </div>

      {!sinSesion && <Nav activo="inicio" />}
    </main>
  );
}

export default function DetalleTrabajo() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <DetalleTrabajoContent />
    </Suspense>
  );
}
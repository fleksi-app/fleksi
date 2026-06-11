'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { calcularPagoCliente, calcularPagoFlekser } from '@/lib/comisiones';

function AplicacionesContent() {
  const searchParams = useSearchParams();
  const [servicios, setServicios] = useState<any[]>([]);
  const [servicioActivo, setServicioActivo] = useState<any>(null);
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const [editandoServicio, setEditandoServicio] = useState<any>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [exitoEdicion, setExitoEdicion] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });
    const { data: svcs } = await supabase
      .from('servicios')
      .select('*')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });
    setServicios(svcs || []);
    const servicioId = searchParams.get('servicio');
    if (servicioId && svcs) {
      const svc = svcs.find(s => s.id === servicioId);
      if (svc) await verAplicaciones(svc);
    }
    setCargando(false);
  };

  const verAplicaciones = async (servicio: any) => {
    const { data: svcFresco } = await supabase.from('servicios').select('*').eq('id', servicio.id).single();
    setServicioActivo(svcFresco || servicio);
    const { data } = await supabase
      .from('aplicaciones')
      .select('*, usuarios(id, nombre, calificacion, trabajos_completados, habilidades, foto_url, email)')
      .eq('servicio_id', servicio.id)
      .order('created_at', { ascending: false });
    setAplicaciones(data || []);
  };

  const handleRechazar = async (aplicacionId: string) => {
    setProcesando(aplicacionId);
    try {
      await supabase.from('aplicaciones').update({ estado: 'rechazado' }).eq('id', aplicacionId);
      await verAplicaciones(servicioActivo);
    } finally {
      setProcesando('');
    }
  };

  const handleEliminar = async (servicioId: string) => {
    setEliminando(true);
    try {
      await supabase.from('aplicaciones')
        .update({ estado: 'rechazado' })
        .eq('servicio_id', servicioId)
        .eq('estado', 'pendiente');
      await supabase.from('servicios')
        .update({ estado: 'cancelado' })
        .eq('id', servicioId);
      setConfirmandoEliminar('');
      setServicioActivo(null);
      await cargarDatos();
    } catch (e) {
      console.error(e);
    } finally {
      setEliminando(false);
    }
  };

  const abrirEdicion = (svc: any) => {
    setEditandoServicio(svc);
    setEditTitulo(svc.titulo || '');
    setEditFecha(svc.fecha || '');
    setEditHora(svc.hora || '');
    setEditDireccion(svc.direccion || '');
    setExitoEdicion('');
  };

  const guardarEdicion = async () => {
    if (!editandoServicio) return;
    setGuardandoEdicion(true);
    try {
      await supabase.from('servicios').update({
        titulo: editTitulo.trim(),
        fecha: editFecha,
        hora: editHora || null,
        direccion: editDireccion.trim() || null,
      }).eq('id', editandoServicio.id);
      setExitoEdicion('✅ Cambios guardados');
      await cargarDatos();
      setTimeout(() => {
        setEditandoServicio(null);
        setExitoEdicion('');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const iniciarChat = async (prestadorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !servicioActivo) return;
    const { data: existente } = await supabase
      .from('mensajes').select('id').eq('servicio_id', servicioActivo.id).limit(1);
    if (!existente || existente.length === 0) {
      await supabase.from('mensajes').insert({
        servicio_id: servicioActivo.id,
        remitente_id: user.id,
        destinatario_id: prestadorId,
        contenido: 'Hola, te contacto por el trabajo: ' + servicioActivo.titulo,
      });
    }
    window.location.href = '/chat';
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

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const esEmpresa = rol === 'empresa';
  const headerGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';
  const btnGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';
  const avatarGradient = esEmpresa ? 'from-slate-700 to-blue-900' : 'from-blue-600 to-purple-600';
  const chatBorder = esEmpresa ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-purple-200 text-purple-600 hover:bg-purple-50';
  const bgFondo = esEmpresa ? 'bg-slate-50' : 'bg-gray-50';
  const spinnerColor = esEmpresa ? 'border-blue-800' : 'border-purple-600';
  const hoyStr = new Date().toISOString().split('T')[0];

  if (cargando) {
    return (
      <main className={'min-h-screen ' + bgFondo + ' flex items-center justify-center'}>
        <div className="text-center">
          <div className={'w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ' + spinnerColor}></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  if (editandoServicio) {
    return (
      <main className={'min-h-screen ' + bgFondo + ' pb-32'}>
        <div className={'bg-gradient-to-r ' + headerGradient + ' px-6 pt-12 pb-4 shadow-sm'}>
          <div className="max-w-md mx-auto flex items-center gap-4">
            <button onClick={() => setEditandoServicio(null)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">←</button>
            <div>
              <h1 className="font-extrabold text-white text-lg">Editar solicitud</h1>
              <p className="text-white/70 text-xs">Modifica los detalles de tu publicación</p>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto px-6 py-6 flex flex-col gap-4">
          {exitoEdicion && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold text-center">{exitoEdicion}</div>
          )}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">📋 Título</label>
            <input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 transition"/>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">📅 Fecha</label>
            <input type="date" value={editFecha} min={hoyStr} onChange={(e) => setEditFecha(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 transition"/>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">🕐 Hora <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="time" value={editHora} onChange={(e) => setEditHora(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 transition"/>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">📍 Dirección <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="text" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)}
              placeholder="Ej. Calle Reforma 123, Col. Centro"
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 transition"/>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <p className="text-amber-700 text-xs font-semibold">⚠️ Los Fleksers que ya aplicaron verán los cambios automáticamente.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditandoServicio(null)}
              className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-gray-400 transition">
              Cancelar
            </button>
            <button onClick={guardarEdicion} disabled={guardandoEdicion || !editTitulo.trim() || !editFecha}
              className={'flex-1 py-4 bg-gradient-to-r ' + btnGradient + ' text-white rounded-2xl font-bold disabled:opacity-50 transition'}>
              {guardandoEdicion ? 'Guardando...' : 'Guardar cambios ✓'}
            </button>
          </div>
        </div>
        <Nav activo="inicio" />
      </main>
    );
  }

  if (servicioActivo) {
    const prestadorTermino = aplicaciones.some(a => a.checkout_at);
    const puedeConfirmar = servicioActivo.pago_retenido && prestadorTermino;
    const tieneAceptado = aplicaciones.some(a => a.estado === 'aceptado');
    const puedeEliminar = servicioActivo.estado === 'activo' && !tieneAceptado;
    const puedeEditar = servicioActivo.estado === 'activo';

    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    const visitasSemana = (servicioActivo.visitas_semana || [])
      .filter((v: string) => new Date(v) > hace7dias).length;

    return (
      <main className={'min-h-screen ' + bgFondo + ' pb-32'}>
        <div className={'bg-gradient-to-r ' + headerGradient + ' px-6 pt-12 pb-4 shadow-sm'}>
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setServicioActivo(null)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">←</button>
              <div className="flex-1">
                <h1 className="font-extrabold text-white text-lg">Aplicaciones recibidas</h1>
                <p className="text-white/70 text-xs truncate max-w-xs">{servicioActivo.titulo}</p>
              </div>
              {puedeEditar && (
                <button onClick={() => abrirEdicion(servicioActivo)}
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition text-sm">
                  ✏️
                </button>
              )}
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              <div className="bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-white/70 text-xs">👁️ Total</span>
                <span className="text-white font-extrabold text-sm">{servicioActivo.visitas || 0}</span>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-white/70 text-xs">📅 Esta semana</span>
                <span className="text-white font-extrabold text-sm">{visitasSemana}</span>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-white/70 text-xs">✋ Aplicaciones</span>
                <span className="text-white font-extrabold text-sm">{aplicaciones.filter(a => a.estado !== 'rechazado').length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-4">

          {servicioActivo.pago_retenido && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-bold text-green-700 text-sm">Pago retenido por Fleksi</p>
                <p className="text-green-600 text-xs mt-0.5">
                  {prestadorTermino
                    ? 'El flekser terminó — confirma el trabajo para liberar el pago'
                    : 'El dinero se liberará cuando confirmes que el trabajo quedó bien'}
                </p>
              </div>
            </div>
          )}

          {puedeConfirmar && (
            <a href={'/confirmar?id=' + servicioActivo.id}
              className={'block w-full py-4 bg-gradient-to-r ' + btnGradient + ' text-white rounded-2xl font-extrabold text-lg text-center shadow-lg hover:opacity-90 transition mb-4'}>
              🎉 Confirmar trabajo y liberar pago
            </a>
          )}

          {(puedeEditar || puedeEliminar) && (
            <div className="flex gap-2 mb-4">
              {puedeEditar && (
                <button onClick={() => abrirEdicion(servicioActivo)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-2">
                  ✏️ Editar
                </button>
              )}
              {puedeEliminar && (
                <button onClick={() => setConfirmandoEliminar(servicioActivo.id)}
                  className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2">
                  🗑️ Cancelar solicitud
                </button>
              )}
            </div>
          )}

          {confirmandoEliminar === servicioActivo.id && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <p className="font-bold text-red-700 text-sm mb-1">⚠️ ¿Cancelar esta solicitud?</p>
              <p className="text-red-600 text-xs mb-3">Se rechazarán automáticamente todas las aplicaciones pendientes.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmandoEliminar('')}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">
                  No, mantener
                </button>
                <button onClick={() => handleEliminar(servicioActivo.id)} disabled={eliminando}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {eliminando ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          )}

          {!puedeEliminar && servicioActivo.estado === 'activo' && tieneAceptado && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
              <p className="text-amber-700 text-xs font-semibold">⚠️ No puedes cancelar esta solicitud porque ya tienes un Flekser aceptado.</p>
            </div>
          )}

          {aplicaciones.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">⏳</p>
              <p className="font-bold text-gray-900 mb-2">Sin aplicaciones todavía</p>
              <p className="text-gray-400 text-sm">Los fleksers verán tu publicación y aplicarán pronto</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {aplicaciones.map((app) => {
                const precioFlekser = app.precio_ofrecido || 0;
                const pagoCliente = precioFlekser > 0 ? calcularPagoCliente(precioFlekser) : null;
                const pagoFlekser = precioFlekser > 0 ? calcularPagoFlekser(precioFlekser) : null;

                return (
                  <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={'w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r ' + avatarGradient + ' flex items-center justify-center flex-shrink-0'}>
                        {app.usuarios?.foto_url ? (
                          <img src={app.usuarios.foto_url} alt={app.usuarios.nombre} className="w-full h-full object-cover"/>
                        ) : (
                          <span className="text-white font-bold text-lg">{app.usuarios?.nombre?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{app.usuarios?.nombre || 'Flekser'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-yellow-500">⭐ {app.usuarios?.calificacion || '5.0'}</p>
                          <p className="text-xs text-gray-400">· {app.usuarios?.trabajos_completados || 0} trabajos</p>
                        </div>
                      </div>
                      <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (estadoColor[app.estado] || 'bg-gray-100 text-gray-600')}>
                        {estadoLabel[app.estado] || app.estado}
                      </span>
                    </div>

                    {app.usuarios?.habilidades?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {app.usuarios.habilidades.slice(0, 3).map((h: string) => (
                          <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{h}</span>
                        ))}
                      </div>
                    )}

                    {/* ── BLOQUE DE PRECIOS ── */}
                    {precioFlekser > 0 && pagoCliente && pagoFlekser ? (
                      <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-4">
                        <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100">
                          <span className="text-xs text-gray-500">Precio del Flekser</span>
                          <span className="font-bold text-gray-700 text-sm">${precioFlekser.toLocaleString('es-MX')} MXN</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100">
                          <span className="text-xs text-gray-500">Comisión de servicio (17.4%)</span>
                          <span className="font-bold text-gray-500 text-sm">+${pagoCliente.comision.toLocaleString('es-MX')} MXN</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-blue-50">
                          <span className="text-sm font-extrabold text-blue-700">💳 Tú pagarías</span>
                          <span className="text-xl font-extrabold text-blue-700">${pagoCliente.total.toLocaleString('es-MX')} MXN</span>
                        </div>
                        {app.mensaje && (
                          <div className="px-4 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-semibold mb-1">Mensaje del Flekser:</p>
                            <p className="text-sm text-gray-600 italic">"{app.mensaje}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <p className="text-sm text-gray-400 text-center">Sin precio propuesto</p>
                        {app.mensaje && <p className="text-sm text-gray-600 italic mt-2">"{app.mensaje}"</p>}
                      </div>
                    )}

                    {app.checkout_at && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                        <p className="text-blue-700 text-xs font-bold">
                          ✅ Trabajo terminado — Salida: {new Date(app.checkout_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </div>
                    )}

                    {app.estado === 'pendiente' && (
                      <div className="flex flex-col gap-2">
                        <div className="bg-blue-50 rounded-xl p-3 mb-1">
                          <p className="text-blue-700 text-xs font-semibold">
                            🔒 Al aceptar se retendrá el pago. Se liberará cuando confirmes que el trabajo quedó bien.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleRechazar(app.id)} disabled={procesando === app.id}
                            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-red-400 hover:text-red-500 transition disabled:opacity-50">
                            ❌ Rechazar
                          </button>
                          <button onClick={() => window.location.href = '/pago?aplicacion=' + app.id}
                            className={'flex-1 py-3 bg-gradient-to-r ' + btnGradient + ' text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition'}>
                            ✅ Aceptar
                          </button>
                        </div>
                      </div>
                    )}

                    {app.estado === 'aceptado' && (
                      <div className="flex flex-col gap-2">
                        <div className="bg-green-50 rounded-xl p-3">
                          <p className="text-green-600 font-bold text-sm text-center">✅ Flekser confirmado</p>
                          <p className="text-green-500 text-xs text-center mt-1">
                            {app.pago_retenido ? '🔒 Pago retenido — se liberará al confirmar el trabajo' : 'El servicio está en proceso'}
                          </p>
                        </div>
                        <button onClick={() => iniciarChat(app.usuarios?.id)}
                          className={'w-full py-3 border-2 ' + chatBorder + ' rounded-2xl font-bold transition flex items-center justify-center gap-2'}>
                          💬 Enviar mensaje
                        </button>
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

  return (
    <main className={'min-h-screen ' + bgFondo + ' pb-32'}>
      <div className={'bg-gradient-to-r ' + headerGradient + ' px-6 pt-12 pb-4 shadow-sm'}>
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-white text-xl mb-1">Mis solicitudes</h1>
          <p className="text-white/70 text-sm">Gestiona las aplicaciones que has recibido</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        <a href="/publicar"
          className={'block w-full py-4 bg-gradient-to-r ' + btnGradient + ' text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4'}>
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
            {servicios.map((svc) => {
              const hace7dias = new Date();
              hace7dias.setDate(hace7dias.getDate() - 7);
              const visitasSemana = (svc.visitas_semana || [])
                .filter((v: string) => new Date(v) > hace7dias).length;
              const puedeEditar = svc.estado === 'activo';
              return (
                <div key={svc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button onClick={() => verAplicaciones(svc)} className="w-full p-4 text-left active:scale-95 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">{svc.titulo}</h3>
                      <span className={'text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ' + (
                        svc.estado === 'activo' ? 'bg-blue-100 text-blue-600' :
                        svc.estado === 'en_proceso' ? 'bg-purple-100 text-purple-600' :
                        svc.estado === 'completado' ? 'bg-orange-100 text-orange-600' :
                        svc.estado === 'pagado' ? 'bg-green-100 text-green-600' :
                        svc.estado === 'cancelado' ? 'bg-red-100 text-red-500' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {svc.estado === 'activo' ? '🟢 Activo' :
                         svc.estado === 'en_proceso' ? '🔄 En proceso' :
                         svc.estado === 'completado' ? '⏳ Por confirmar' :
                         svc.estado === 'pagado' ? '💰 Pagado' :
                         svc.estado === 'cancelado' ? '❌ Cancelado' : svc.estado}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">📅 {svc.fecha}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {svc.visitas > 0 && <span className="text-xs text-gray-400">👁️ {svc.visitas} vista{svc.visitas !== 1 ? 's' : ''}</span>}
                      {visitasSemana > 0 && <span className="text-xs text-purple-500 font-semibold">📅 {visitasSemana} esta semana</span>}
                    </div>
                    {svc.pago_retenido && (svc.estado === 'en_proceso' || svc.estado === 'completado') && (
                      <div className="mt-2 bg-orange-50 rounded-xl p-2 text-center">
                        <p className="text-orange-600 text-xs font-bold">⏳ Toca para ver y confirmar el trabajo</p>
                      </div>
                    )}
                  </button>
                  {puedeEditar && (
                    <div className="flex border-t border-gray-100">
                      <button onClick={() => abrirEdicion(svc)}
                        className="flex-1 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition flex items-center justify-center gap-1">
                        ✏️ Editar
                      </button>
                      <div className="w-px bg-gray-100"/>
                      <button onClick={() => setConfirmandoEliminar(svc.id)}
                        className="flex-1 py-2.5 text-xs font-bold text-red-400 hover:bg-red-50 transition flex items-center justify-center gap-1">
                        🗑️ Cancelar
                      </button>
                    </div>
                  )}
                  {confirmandoEliminar === svc.id && (
                    <div className="bg-red-50 border-t border-red-200 p-4">
                      <p className="font-bold text-red-700 text-sm mb-1">⚠️ ¿Cancelar esta solicitud?</p>
                      <p className="text-red-600 text-xs mb-3">Se rechazarán las aplicaciones pendientes.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmandoEliminar('')}
                          className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl font-semibold text-xs">
                          No, mantener
                        </button>
                        <button onClick={() => handleEliminar(svc.id)} disabled={eliminando}
                          className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold text-xs disabled:opacity-50">
                          {eliminando ? 'Cancelando...' : 'Sí, cancelar'}
                        </button>
                      </div>
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

export default function Aplicaciones() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <AplicacionesContent />
    </Suspense>
  );
}
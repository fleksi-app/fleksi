'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fernando.najera.nm@gmail.com';

const LABEL_DOCS: Record<string, string> = {
  ine_frente: 'INE Frente',
  ine_reverso: 'INE Reverso',
  curp: 'CURP',
  comprobante_domicilio: 'Comprobante domicilio',
  antecedentes: 'Antecedentes no penales',
  licencia: 'Licencia de conducir',
  constancia_fiscal: 'Constancia fiscal',
};

export default function Admin() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [documentosPorUsuario, setDocumentosPorUsuario] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState('');
  const [filtro, setFiltro] = useState('en_revision');
  const [tab, setTab] = useState<'documentos' | 'verificaciones'>('documentos');
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);
  const [rechazandoDoc, setRechazandoDoc] = useState('');
  const [motivoDoc, setMotivoDoc] = useState('');
  const [procesandoDoc, setProcesandoDoc] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    if (user.email !== ADMIN_EMAIL) { window.location.href = '/home'; return; }
    setUsuario(user);

    // Cargar verificaciones antiguas
    const { data: verifs } = await supabase
      .from('verificaciones')
      .select('*, usuarios(nombre, foto_url, rol, ciudad, telefono)')
      .order('created_at', { ascending: false });
    setVerificaciones(verifs || []);

    // Cargar documentos nuevos agrupados por usuario
    const { data: docs } = await supabase
      .from('documentos')
      .select('*, usuarios(id, nombre, foto_url, rol, ciudad, email)')
      .order('updated_at', { ascending: false });

    // Agrupar por usuario
    const agrupados: Record<string, any> = {};
    (docs || []).forEach((doc: any) => {
      const uid = doc.usuario_id;
      if (!agrupados[uid]) {
        agrupados[uid] = {
          usuario: doc.usuarios,
          usuario_id: uid,
          documentos: [],
          ultima_actualizacion: doc.updated_at,
        };
      }
      agrupados[uid].documentos.push(doc);
      if (doc.updated_at > agrupados[uid].ultima_actualizacion) {
        agrupados[uid].ultima_actualizacion = doc.updated_at;
      }
    });

    setDocumentosPorUsuario(Object.values(agrupados));
    setCargando(false);
  };

  // ── Documentos — aprobar individual ──────────────────────
  const aprobarDoc = async (docId: string, usuarioId: string, nombreUsuario: string, tipoDoc: string) => {
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({
        estado: 'aprobado',
        motivo_rechazo: null,
        updated_at: new Date().toISOString(),
      }).eq('id', docId);

      // Verificar si TODOS los docs requeridos están aprobados
      const { data: todosLosDocs } = await supabase
        .from('documentos')
        .select('*')
        .eq('usuario_id', usuarioId);

      const { data: usuarioData } = await supabase
        .from('usuarios').select('rol').eq('id', usuarioId).single();

      const rol = usuarioData?.rol || 'flekser';
      const requeridos = rol === 'empresa'
        ? ['ine_frente', 'ine_reverso', 'constancia_fiscal', 'antecedentes']
        : ['ine_frente', 'ine_reverso', 'curp', 'comprobante_domicilio', 'antecedentes'];

      const docsActualizados = (todosLosDocs || []).map(d =>
        d.id === docId ? { ...d, estado: 'aprobado' } : d
      );

      const todosAprobados = requeridos.every(tipo =>
        docsActualizados.some(d => d.tipo === tipo && d.estado === 'aprobado')
      );

      if (todosAprobados) {
        await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);
        await supabase.from('badges').upsert(
          { usuario_id: usuarioId, tipo: 'verificado' },
          { onConflict: 'usuario_id,tipo' }
        );
        // Notificar usuario
        try {
          await supabase.from('notificaciones').insert({
            usuario_id: usuarioId,
            tipo: 'verificacion_aprobada',
            titulo: '✅ ¡Verificación completada!',
            mensaje: 'Todos tus documentos fueron aprobados. Ya puedes usar Fleksi al 100%.',
            link: '/perfil',
          });
        } catch (e) {}
      } else {
        // Notificar doc aprobado individualmente
        try {
          await supabase.from('notificaciones').insert({
            usuario_id: usuarioId,
            tipo: 'documento_aprobado',
            titulo: `✅ Documento aprobado`,
            mensaje: `Tu ${LABEL_DOCS[tipoDoc] || tipoDoc} fue aprobado.`,
            link: '/documentos',
          });
        } catch (e) {}
      }

      await cargarDatos();
    } finally {
      setProcesandoDoc('');
    }
  };

  // ── Documentos — rechazar individual ─────────────────────
  const rechazarDoc = async (docId: string, usuarioId: string, tipoDoc: string) => {
    if (!motivoDoc.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({
        estado: 'rechazado',
        motivo_rechazo: motivoDoc,
        updated_at: new Date().toISOString(),
      }).eq('id', docId);

      try {
        await supabase.from('notificaciones').insert({
          usuario_id: usuarioId,
          tipo: 'documento_rechazado',
          titulo: `❌ Documento rechazado`,
          mensaje: `Tu ${LABEL_DOCS[tipoDoc] || tipoDoc} fue rechazado: ${motivoDoc}`,
          link: '/documentos',
        });
      } catch (e) {}

      setRechazandoDoc('');
      setMotivoDoc('');
      await cargarDatos();
    } finally {
      setProcesandoDoc('');
    }
  };

  // ── Verificaciones antiguas — aprobar ────────────────────
  const aprobar = async (id: string, usuarioId: string, nombreUsuario: string) => {
    setProcesando(id);
    try {
      await supabase.from('verificaciones').update({
        estado: 'aprobado',
        revisado_por: usuario.email,
        revisado_at: new Date().toISOString(),
      }).eq('id', id);

      await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);

      await supabase.from('badges').upsert(
        { usuario_id: usuarioId, tipo: 'verificado' },
        { onConflict: 'usuario_id,tipo' }
      );

      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const rechazar = async (id: string, nombreUsuario: string) => {
    if (!motivoRechazo.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesando(id);
    try {
      await supabase.from('verificaciones').update({
        estado: 'rechazado',
        motivo_rechazo: motivoRechazo,
        revisado_por: usuario.email,
        revisado_at: new Date().toISOString(),
      }).eq('id', id);
      setRechazando('');
      setMotivoRechazo('');
      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const estadoColor = (estado: string) => ({
    pendiente: 'bg-gray-100 text-gray-600',
    subido: 'bg-yellow-100 text-yellow-700',
    en_revision: 'bg-yellow-100 text-yellow-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
  }[estado] || 'bg-gray-100 text-gray-600');

  const filtradas = verificaciones.filter(v =>
    filtro === 'todas' ? true : v.estado === filtro
  );

  const conteoVerifs = {
    en_revision: verificaciones.filter(v => v.estado === 'en_revision').length,
    aprobado: verificaciones.filter(v => v.estado === 'aprobado').length,
    rechazado: verificaciones.filter(v => v.estado === 'rechazado').length,
    todas: verificaciones.length,
  };

  // Stats documentos
  const totalDocsSubidos = documentosPorUsuario.reduce((acc, u) =>
    acc + u.documentos.filter((d: any) => d.estado === 'subido').length, 0
  );
  const totalDocsAprobados = documentosPorUsuario.reduce((acc, u) =>
    acc + u.documentos.filter((d: any) => d.estado === 'aprobado').length, 0
  );
  const totalDocsRechazados = documentosPorUsuario.reduce((acc, u) =>
    acc + u.documentos.filter((d: any) => d.estado === 'rechazado').length, 0
  );

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando panel admin...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-white/70 text-sm">Panel de administración</p>
            <h1 className="text-white font-extrabold text-2xl mb-1">Fleksi Admin</h1>
            <p className="text-white/70 text-sm">{usuario?.email}</p>
          </div>
          <a href="/perfil" className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">
            ← Perfil
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('documentos')}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition ${tab === 'documentos' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            📄 Documentos {totalDocsSubidos > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalDocsSubidos}</span>}
          </button>
          <button onClick={() => setTab('verificaciones')}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition ${tab === 'verificaciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            🪪 Verificaciones {conteoVerifs.en_revision > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{conteoVerifs.en_revision}</span>}
          </button>
        </div>

        {/* ── TAB DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-yellow-600">{totalDocsSubidos}</p>
                <p className="text-xs text-gray-400 mt-1">Por revisar</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-green-600">{totalDocsAprobados}</p>
                <p className="text-xs text-gray-400 mt-1">Aprobados</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-red-600">{totalDocsRechazados}</p>
                <p className="text-xs text-gray-400 mt-1">Rechazados</p>
              </div>
            </div>

            {documentosPorUsuario.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-bold text-gray-900">Sin documentos subidos aún</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {documentosPorUsuario.map((grupo) => {
                  const docsSubidos = grupo.documentos.filter((d: any) => d.estado === 'subido').length;
                  const expandido = usuarioExpandido === grupo.usuario_id;

                  return (
                    <div key={grupo.usuario_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                      {/* Header usuario */}
                      <button
                        onClick={() => setUsuarioExpandido(expandido ? null : grupo.usuario_id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            {grupo.usuario?.foto_url ? (
                              <img src={grupo.usuario.foto_url} className="w-full h-full object-cover rounded-xl"/>
                            ) : (
                              <span className="text-white font-bold text-sm">{grupo.usuario?.nombre?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-extrabold text-gray-900 text-sm">{grupo.usuario?.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 capitalize">{grupo.usuario?.rol}</span>
                              {grupo.usuario?.ciudad && <span className="text-xs text-gray-400">· 📍 {grupo.usuario.ciudad}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {docsSubidos > 0 && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                              {docsSubidos} por revisar
                            </span>
                          )}
                          <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Documentos expandidos */}
                      {expandido && (
                        <div className="border-t border-gray-100 p-5">
                          <div className="flex flex-col gap-3">
                            {grupo.documentos.map((doc: any) => (
                              <div key={doc.id} className={`rounded-xl p-4 border ${doc.estado === 'aprobado' ? 'bg-green-50 border-green-100' : doc.estado === 'rechazado' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>

                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">
                                      {LABEL_DOCS[doc.tipo] || doc.tipo}
                                    </span>
                                    {doc.tipo === 'licencia' && (
                                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Opcional</span>
                                    )}
                                  </div>
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor(doc.estado)}`}>
                                    {doc.estado === 'subido' ? '🔍 Por revisar' : doc.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                                  </span>
                                </div>

                                {doc.motivo_rechazo && (
                                  <div className="bg-red-100 rounded-lg p-2 mb-2">
                                    <p className="text-xs text-red-700 font-semibold">Motivo: {doc.motivo_rechazo}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mt-2">
                                  {doc.url && (
                                    <a href={doc.url} target="_blank"
                                      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition">
                                      👁️ Ver documento
                                    </a>
                                  )}

                                  {doc.estado === 'subido' && (
                                    <>
                                      {rechazandoDoc === doc.id ? (
                                        <div className="flex-1 flex flex-col gap-2 mt-2">
                                          <textarea
                                            value={motivoDoc}
                                            onChange={(e) => setMotivoDoc(e.target.value)}
                                            placeholder="Motivo del rechazo..."
                                            rows={2}
                                            className="w-full p-2 rounded-lg border-2 border-red-300 outline-none text-gray-900 text-xs resize-none"/>
                                          <div className="flex gap-2">
                                            <button onClick={() => { setRechazandoDoc(''); setMotivoDoc(''); }}
                                              className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs">
                                              Cancelar
                                            </button>
                                            <button
                                              onClick={() => rechazarDoc(doc.id, grupo.usuario_id, doc.tipo)}
                                              disabled={procesandoDoc === doc.id}
                                              className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-xs disabled:opacity-50">
                                              {procesandoDoc === doc.id ? '...' : 'Confirmar'}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex gap-2 ml-auto">
                                          <button onClick={() => setRechazandoDoc(doc.id)}
                                            className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 transition">
                                            ❌ Rechazar
                                          </button>
                                          <button
                                            onClick={() => aprobarDoc(doc.id, grupo.usuario_id, grupo.usuario?.nombre, doc.tipo)}
                                            disabled={procesandoDoc === doc.id}
                                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs disabled:opacity-50 hover:bg-green-600 transition">
                                            {procesandoDoc === doc.id ? '...' : '✅ Aprobar'}
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {doc.estado === 'aprobado' && (
                                    <span className="text-xs text-green-600 font-semibold ml-auto">
                                      Aprobado ✓
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-400 mt-2">
                                  Actualizado: {new Date(doc.updated_at).toLocaleDateString('es-MX', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB VERIFICACIONES (legacy) ── */}
        {tab === 'verificaciones' && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { key: 'en_revision', label: 'En revisión', color: 'text-yellow-600' },
                { key: 'aprobado', label: 'Aprobados', color: 'text-green-600' },
                { key: 'rechazado', label: 'Rechazados', color: 'text-red-600' },
                { key: 'todas', label: 'Total', color: 'text-purple-600' },
              ].map(s => (
                <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{conteoVerifs[s.key as keyof typeof conteoVerifs]}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: 'en_revision', label: '🔍 En revisión' },
                { key: 'aprobado', label: '✅ Aprobados' },
                { key: 'rechazado', label: '❌ Rechazados' },
                { key: 'todas', label: '📋 Todas' },
              ].map(f => (
                <button key={f.key} onClick={() => setFiltro(f.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
                    filtro === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filtradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-bold text-gray-900">Sin verificaciones en esta categoría</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtradas.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          {v.usuarios?.foto_url ? (
                            <img src={v.usuarios.foto_url} className="w-full h-full object-cover rounded-xl"/>
                          ) : (
                            <span className="text-white font-bold">{v.usuarios?.nombre?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{v.usuarios?.nombre}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{v.usuarios?.rol}</span>
                            {v.usuarios?.ciudad && <span className="text-xs text-gray-400">· 📍 {v.usuarios.ciudad}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${estadoColor(v.estado)}`}>{v.estado}</span>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                      Enviado: {new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {v.motivo_rechazo && (
                      <div className="bg-red-50 rounded-xl p-3 mb-4">
                        <p className="text-xs font-bold text-red-700">Motivo de rechazo:</p>
                        <p className="text-xs text-red-600 mt-1">{v.motivo_rechazo}</p>
                      </div>
                    )}

                    {v.estado === 'en_revision' && (
                      <div>
                        {rechazando === v.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)}
                              placeholder="Motivo del rechazo..." rows={3}
                              className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm resize-none"/>
                            <div className="flex gap-2">
                              <button onClick={() => { setRechazando(''); setMotivoRechazo(''); }}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">Cancelar</button>
                              <button onClick={() => rechazar(v.id, v.usuarios?.nombre)}
                                disabled={procesando === v.id}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                {procesando === v.id ? 'Rechazando...' : 'Confirmar rechazo'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setRechazando(v.id)}
                              className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">
                              ❌ Rechazar
                            </button>
                            <button onClick={() => aprobar(v.id, v.usuario_id, v.usuarios?.nombre)}
                              disabled={procesando === v.id}
                              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                              {procesando === v.id ? 'Aprobando...' : '✅ Aprobar'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {v.estado === 'aprobado' && (
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-green-700 font-bold text-sm">✅ Aprobado por {v.revisado_por}</p>
                        <p className="text-green-600 text-xs mt-1">{new Date(v.revisado_at).toLocaleDateString('es-MX')}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
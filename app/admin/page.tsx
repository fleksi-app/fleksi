'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fernando.najera.nm@gmail.com';

export default function Admin() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState('');
  const [filtro, setFiltro] = useState('en_revision');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    if (user.email !== ADMIN_EMAIL) {
      window.location.href = '/home';
      return;
    }

    setUsuario(user);

    const { data } = await supabase
      .from('verificaciones')
      .select('*, usuarios(nombre, foto_url, rol, ciudad, telefono)')
      .order('created_at', { ascending: false });

    setVerificaciones(data || []);
    setCargando(false);
  };

  const aprobar = async (id: string, usuarioId: string) => {
    setProcesando(id);
    try {
      await supabase.from('verificaciones').update({
        estado: 'aprobado',
        revisado_por: usuario.email,
        revisado_at: new Date().toISOString(),
      }).eq('id', id);

      await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);

      const { data: badgeExiste } = await supabase
        .from('badges')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'verificado')
        .single();

      if (!badgeExiste) {
        await supabase.from('badges').insert({
          usuario_id: usuarioId,
          tipo: 'verificado',
          nombre: 'Verificado',
          emoji: '✅',
        });
      }

      await cargarDatos();
    } finally {
      setProcesando('');
    }
  };

  const rechazar = async (id: string) => {
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
    } finally {
      setProcesando('');
    }
  };

  const estadoColor = (estado: string) => {
    const colores: { [key: string]: string } = {
      pendiente: 'bg-gray-100 text-gray-600',
      en_revision: 'bg-yellow-100 text-yellow-700',
      aprobado: 'bg-green-100 text-green-700',
      rechazado: 'bg-red-100 text-red-700',
    };
    return colores[estado] || 'bg-gray-100 text-gray-600';
  };

  const filtradas = verificaciones.filter(v =>
    filtro === 'todas' ? true : v.estado === filtro
  );

  const conteo = {
    en_revision: verificaciones.filter(v => v.estado === 'en_revision').length,
    aprobado: verificaciones.filter(v => v.estado === 'aprobado').length,
    rechazado: verificaciones.filter(v => v.estado === 'rechazado').length,
    todas: verificaciones.length,
  };

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
        <div className="max-w-2xl mx-auto">
          <p className="text-white/70 text-sm">Panel de administración</p>
          <h1 className="text-white font-extrabold text-2xl mb-1">Verificaciones</h1>
          <p className="text-white/70 text-sm">Fleksi Admin · {usuario?.email}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { key: 'en_revision', label: 'En revisión', emoji: '🔍', color: 'text-yellow-600' },
            { key: 'aprobado', label: 'Aprobados', emoji: '✅', color: 'text-green-600' },
            { key: 'rechazado', label: 'Rechazados', emoji: '❌', color: 'text-red-600' },
            { key: 'todas', label: 'Total', emoji: '📋', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{conteo[s.key as keyof typeof conteo]}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'en_revision', label: '🔍 En revisión' },
            { key: 'aprobado', label: '✅ Aprobados' },
            { key: 'rechazado', label: '❌ Rechazados' },
            { key: 'todas', label: '📋 Todas' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
                filtro === f.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
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
                        <span className="text-white font-bold">
                          {v.usuarios?.nombre?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900">{v.usuarios?.nombre}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{v.usuarios?.rol}</span>
                        {v.usuarios?.ciudad && (
                          <span className="text-xs text-gray-400">· 📍 {v.usuarios.ciudad}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${estadoColor(v.estado)}`}>
                    {v.estado}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">DOCUMENTOS SUBIDOS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { campo: 'ine_frente_url', label: 'INE Frente' },
                      { campo: 'ine_reverso_url', label: 'INE Reverso' },
                      { campo: 'antecedentes_url', label: 'Antecedentes' },
                      { campo: 'comprobante_antecedentes_url', label: 'Comprobante pago' },
                      { campo: 'ine_representante_url', label: 'INE Representante' },
                      { campo: 'acta_constitutiva_url', label: 'Acta constitutiva' },
                      { campo: 'constancia_fiscal_url', label: 'Constancia fiscal' },
                    ].filter(d => v[d.campo]).map(d => (
                      <a key={d.campo} href={v[d.campo]} target="_blank"
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-100 transition">
                        <span>📄</span> {d.label}
                      </a>
                    ))}
                  </div>
                  {!v.ine_frente_url && !v.ine_representante_url && (
                    <p className="text-xs text-gray-400">Sin documentos subidos aún</p>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  Enviado: {new Date(v.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
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
                        <textarea
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Escribe el motivo del rechazo para notificar al usuario..."
                          rows={3}
                          className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm resize-none"/>
                        <div className="flex gap-2">
                          <button onClick={() => { setRechazando(''); setMotivoRechazo(''); }}
                            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">
                            Cancelar
                          </button>
                          <button onClick={() => rechazar(v.id)}
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
                        <button onClick={() => aprobar(v.id, v.usuario_id)}
                          disabled={procesando === v.id}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                          {procesando === v.id ? 'Aprobando...' : '✅ Aprobar'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {v.estado === 'aprobado' && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-green-700 font-bold text-sm">✅ Aprobado por {v.revisado_por}</p>
                    <p className="text-green-600 text-xs mt-1">
                      {new Date(v.revisado_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
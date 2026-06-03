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

const PERIODOS = [
  { key: '1m', label: 'Mensual', meses: 1 },
  { key: '2m', label: 'Bimestral', meses: 2 },
  { key: '3m', label: 'Trimestral', meses: 3 },
  { key: '6m', label: 'Semestral', meses: 6 },
  { key: '12m', label: 'Anual', meses: 12 },
];

export default function Admin() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [documentosPorUsuario, setDocumentosPorUsuario] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState('');
  const [filtro, setFiltro] = useState('en_revision');
  const [tab, setTab] = useState<'dashboard' | 'documentos' | 'verificaciones'>('dashboard');
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);
  const [rechazandoDoc, setRechazandoDoc] = useState('');
  const [motivoDoc, setMotivoDoc] = useState('');
  const [procesandoDoc, setProcesandoDoc] = useState('');
  const [periodoReporte, setPeriodoReporte] = useState('1m');
  const [generandoReporte, setGenerandoReporte] = useState('');

  const [metrics, setMetrics] = useState({
    totalUsuarios: 0, fleksers: 0, empresas: 0,
    nuevosHoy: 0, nuevosEsteMes: 0,
    serviciosPublicados: 0, serviciosCompletados: 0, serviciosCancelados: 0,
    ingresosDia: 0, ingresosMes: 0, comisionAcumulada: 0,
    ciudadTopNombre: '—', ciudadTopCount: 0,
  });
  const [cargandoMetrics, setCargandoMetrics] = useState(true);

  useEffect(() => { cargarDatos(); cargarMetrics(); }, []);

  const cargarMetrics = async () => {
    setCargandoMetrics(true);
    try {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const { data: usuarios } = await supabase.from('usuarios').select('rol, created_at, ciudad');
      const totalUsuarios = usuarios?.length || 0;
      const fleksers = usuarios?.filter(u => u.rol === 'flekser' || u.rol === 'viajero').length || 0;
      const empresas = usuarios?.filter(u => u.rol === 'empresa').length || 0;
      const nuevosHoy = usuarios?.filter(u => new Date(u.created_at) >= hoy).length || 0;
      const nuevosEsteMes = usuarios?.filter(u => new Date(u.created_at) >= inicioMes).length || 0;

      const ciudadCount: Record<string, number> = {};
      usuarios?.forEach(u => { if (u.ciudad) ciudadCount[u.ciudad] = (ciudadCount[u.ciudad] || 0) + 1; });
      const ciudadTop = Object.entries(ciudadCount).sort((a, b) => b[1] - a[1])[0];

      const { data: servicios } = await supabase.from('servicios').select('estado, created_at, presupuesto');
      const serviciosPublicados = servicios?.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length || 0;
      const serviciosCompletados = servicios?.filter(s => s.estado === 'completado' || s.estado === 'pagado').length || 0;
      const serviciosCancelados = servicios?.filter(s => s.estado === 'cancelado').length || 0;

      const pagadosHoy = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= hoy) || [];
      const pagadosMes = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= inicioMes) || [];

      const ingresosDia = pagadosHoy.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const ingresosMes = pagadosMes.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const comisionAcumulada = (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0);

      setMetrics({
        totalUsuarios, fleksers, empresas, nuevosHoy, nuevosEsteMes,
        serviciosPublicados, serviciosCompletados, serviciosCancelados,
        ingresosDia, ingresosMes, comisionAcumulada,
        ciudadTopNombre: ciudadTop?.[0] || '—', ciudadTopCount: ciudadTop?.[1] || 0,
      });
    } catch (e) { console.error(e); }
    finally { setCargandoMetrics(false); }
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    if (user.email !== ADMIN_EMAIL) { window.location.href = '/home'; return; }
    setUsuario(user);

    const { data: verifs } = await supabase.from('verificaciones').select('*, usuarios(nombre, foto_url, rol, ciudad, telefono)').order('created_at', { ascending: false });
    setVerificaciones(verifs || []);

    const { data: docs } = await supabase.from('documentos').select('*, usuarios(id, nombre, foto_url, rol, ciudad, email)').order('updated_at', { ascending: false });

    const agrupados: Record<string, any> = {};
    (docs || []).forEach((doc: any) => {
      const uid = doc.usuario_id;
      if (!agrupados[uid]) agrupados[uid] = { usuario: doc.usuarios, usuario_id: uid, documentos: [], ultima_actualizacion: doc.updated_at };
      agrupados[uid].documentos.push(doc);
      if (doc.updated_at > agrupados[uid].ultima_actualizacion) agrupados[uid].ultima_actualizacion = doc.updated_at;
    });

    setDocumentosPorUsuario(Object.values(agrupados));
    setCargando(false);
  };

  const obtenerDatosReporte = async (meses: number) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - meses);

    const { data: usuarios } = await supabase.from('usuarios').select('rol, created_at, ciudad');
    const { data: servicios } = await supabase.from('servicios').select('estado, created_at, presupuesto');

    const usuariosPeriodo = (usuarios || []).filter(u => new Date(u.created_at) >= inicio);
    const serviciosPeriodo = (servicios || []).filter(s => new Date(s.created_at) >= inicio);
    const completadosPeriodo = serviciosPeriodo.filter(s => s.estado === 'completado' || s.estado === 'pagado');

    const ciudadCount: Record<string, number> = {};
    (usuarios || []).forEach(u => { if (u.ciudad) ciudadCount[u.ciudad] = (ciudadCount[u.ciudad] || 0) + 1; });
    const ciudadTop = Object.entries(ciudadCount).sort((a, b) => b[1] - a[1])[0];

    return {
      periodo: { inicio: inicio.toLocaleDateString('es-MX'), fin: fin.toLocaleDateString('es-MX') },
      usuarios: {
        total: usuarios?.length || 0,
        nuevosEnPeriodo: usuariosPeriodo.length,
        fleksers: (usuarios || []).filter(u => u.rol === 'flekser').length,
        empresas: (usuarios || []).filter(u => u.rol === 'empresa').length,
      },
      servicios: {
        total: servicios?.length || 0,
        enPeriodo: serviciosPeriodo.length,
        activos: serviciosPeriodo.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length,
        completados: completadosPeriodo.length,
        cancelados: serviciosPeriodo.filter(s => s.estado === 'cancelado').length,
      },
      ingresos: {
        transaccionadoPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0),
        comisionPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0),
        comisionAcumulada: (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0),
        ticketPromedio: completadosPeriodo.length > 0
          ? completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0) / completadosPeriodo.length
          : 0,
      },
      ciudad: { nombre: ciudadTop?.[0] || '—', usuarios: ciudadTop?.[1] || 0 },
    };
  };

  const descargarExcel = async () => {
    setGenerandoReporte('excel');
    try {
      const periodo = PERIODOS.find(p => p.key === periodoReporte)!;
      const datos = await obtenerDatosReporte(periodo.meses);
      const fechaGen = new Date().toLocaleDateString('es-MX');

      const csvRows = [
        ['REPORTE FLEKSI', '', ''],
        [`Período: ${periodo.label}`, `${datos.periodo.inicio} — ${datos.periodo.fin}`, ''],
        [`Generado: ${fechaGen}`, '', ''],
        ['', '', ''],
        ['USUARIOS', '', ''],
        ['Métrica', 'Valor', ''],
        ['Total registrados', datos.usuarios.total, ''],
        [`Nuevos en el período (${periodo.label})`, datos.usuarios.nuevosEnPeriodo, ''],
        ['Fleksers', datos.usuarios.fleksers, ''],
        ['Empresas', datos.usuarios.empresas, ''],
        ['', '', ''],
        ['SERVICIOS', '', ''],
        ['Métrica', 'Valor', ''],
        ['Total histórico', datos.servicios.total, ''],
        [`Publicados en período`, datos.servicios.enPeriodo, ''],
        ['Activos', datos.servicios.activos, ''],
        ['Completados en período', datos.servicios.completados, ''],
        ['Cancelados en período', datos.servicios.cancelados, ''],
        ['', '', ''],
        ['INGRESOS (MXN)', '', ''],
        ['Métrica', 'Valor', ''],
        [`Transaccionado en período`, `$${datos.ingresos.transaccionadoPeriodo.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, ''],
        [`Comisión Fleksi en período (25%)`, `$${datos.ingresos.comisionPeriodo.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, ''],
        ['Comisión acumulada histórica', `$${datos.ingresos.comisionAcumulada.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, ''],
        ['Ticket promedio', `$${datos.ingresos.ticketPromedio.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, ''],
        ['', '', ''],
        ['GEOGRAFÍA', '', ''],
        ['Ciudad con más actividad', datos.ciudad.nombre, ''],
        ['Usuarios en esa ciudad', datos.ciudad.usuarios, ''],
      ];

      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fleksi_Reporte_${periodo.label}_${fechaGen.replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setGenerandoReporte(''); }
  };

  const descargarPDF = async () => {
    setGenerandoReporte('pdf');
    try {
      const periodo = PERIODOS.find(p => p.key === periodoReporte)!;
      const datos = await obtenerDatosReporte(periodo.meses);
      const fechaGen = new Date().toLocaleDateString('es-MX');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte Fleksi</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
            .header { background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 4px 0 0; opacity: 0.8; font-size: 14px; }
            .seccion { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .seccion h2 { margin: 0 0 16px; font-size: 16px; color: #374151; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .card { background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; text-align: center; }
            .card .valor { font-size: 28px; font-weight: 800; color: #2563EB; }
            .card .label { font-size: 11px; color: #6B7280; margin-top: 4px; }
            .card.verde .valor { color: #059669; }
            .card.gris .valor { color: #374151; }
            .card.rojo .valor { color: #DC2626; }
            .comision { background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; border-radius: 12px; padding: 20px; text-align: center; margin-top: 12px; }
            .comision .valor { font-size: 36px; font-weight: 800; }
            .comision .label { opacity: 0.8; font-size: 12px; margin-top: 4px; }
            .ciudad { background: white; border: 1px solid #DBEAFE; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; }
            .ciudad .emoji { font-size: 36px; }
            .ciudad .nombre { font-size: 20px; font-weight: 800; }
            .ciudad .sub { font-size: 12px; color: #6B7280; }
            .footer { text-align: center; color: #9CA3AF; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚡ Fleksi — Reporte ${periodo.label}</h1>
            <p>Período: ${datos.periodo.inicio} — ${datos.periodo.fin} &nbsp;|&nbsp; Generado: ${fechaGen}</p>
          </div>

          <div class="seccion">
            <h2>👥 Usuarios</h2>
            <div class="grid">
              <div class="card"><div class="valor">${datos.usuarios.total}</div><div class="label">Total registrados</div></div>
              <div class="card verde"><div class="valor">${datos.usuarios.nuevosEnPeriodo}</div><div class="label">Nuevos en el período</div></div>
            </div>
            <div class="grid3" style="margin-top:12px">
              <div class="card"><div class="valor" style="color:#7C3AED">${datos.usuarios.fleksers}</div><div class="label">Fleksers</div></div>
              <div class="card gris"><div class="valor">${datos.usuarios.empresas}</div><div class="label">Empresas</div></div>
              <div class="card"><div class="valor" style="color:#0891B2">${datos.usuarios.total - datos.usuarios.fleksers - datos.usuarios.empresas}</div><div class="label">Otros</div></div>
            </div>
          </div>

          <div class="seccion">
            <h2>⚡ Servicios</h2>
            <div class="grid3">
              <div class="card"><div class="valor" style="color:#2563EB">${datos.servicios.activos}</div><div class="label">Activos</div></div>
              <div class="card verde"><div class="valor">${datos.servicios.completados}</div><div class="label">Completados</div></div>
              <div class="card rojo"><div class="valor">${datos.servicios.cancelados}</div><div class="label">Cancelados</div></div>
            </div>
          </div>

          <div class="seccion">
            <h2>💰 Ingresos (MXN)</h2>
            <div class="grid">
              <div class="card verde">
                <div class="valor">$${datos.ingresos.transaccionadoPeriodo.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
                <div class="label">Transaccionado en el período</div>
              </div>
              <div class="card">
                <div class="valor">$${datos.ingresos.ticketPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
                <div class="label">Ticket promedio</div>
              </div>
            </div>
            <div class="comision">
              <div class="label">Comisión Fleksi acumulada (25%)</div>
              <div class="valor">$${datos.ingresos.comisionAcumulada.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</div>
              <div class="label">En el período: $${datos.ingresos.comisionPeriodo.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</div>
            </div>
          </div>

          <div class="seccion">
            <h2>📍 Ciudad con más actividad</h2>
            <div class="ciudad">
              <div class="emoji">🏙️</div>
              <div>
                <div class="nombre">${datos.ciudad.nombre}</div>
                <div class="sub">${datos.ciudad.usuarios} usuario${datos.ciudad.usuarios !== 1 ? 's' : ''} registrado${datos.ciudad.usuarios !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Fleksi · Irapuato, Guanajuato · Reporte generado automáticamente el ${fechaGen}
          </div>

          <script>window.onload = () => { window.print(); }</script>
        </body>
        </html>
      `;

      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      }
    } finally { setGenerandoReporte(''); }
  };

  const verDocumento = async (url: string, usuarioId: string, tipo: string) => {
    if (url.includes('token=')) { window.open(url, '_blank'); return; }
    try {
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const { data } = await supabase.storage.from('documentos-verificacion').createSignedUrl(`${usuarioId}/${tipo}.${ext}`, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (e) { window.open(url, '_blank'); }
  };

  const aprobarDoc = async (docId: string, usuarioId: string, nombreUsuario: string, tipoDoc: string) => {
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({ estado: 'aprobado', motivo_rechazo: null, updated_at: new Date().toISOString() }).eq('id', docId);
      const { data: todosLosDocs } = await supabase.from('documentos').select('*').eq('usuario_id', usuarioId);
      const { data: usuarioData } = await supabase.from('usuarios').select('rol').eq('id', usuarioId).single();
      const rol = usuarioData?.rol || 'flekser';
      const requeridos = rol === 'empresa' ? ['ine_frente','ine_reverso','constancia_fiscal','antecedentes'] : ['ine_frente','ine_reverso','curp','comprobante_domicilio','antecedentes'];
      const docsActualizados = (todosLosDocs || []).map(d => d.id === docId ? { ...d, estado: 'aprobado' } : d);
      const todosAprobados = requeridos.every(tipo => docsActualizados.some(d => d.tipo === tipo && d.estado === 'aprobado'));
      if (todosAprobados) {
        await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);
        await supabase.from('badges').upsert({ usuario_id: usuarioId, tipo: 'verificado', nombre: 'Verificado', emoji: '✅' }, { onConflict: 'usuario_id,tipo' });
        try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'verificacion_aprobada', titulo: '🏆 ¡Verificación completada!', mensaje: 'Todos tus documentos fueron aprobados.', link: '/perfil' }); } catch (e) {}
      } else {
        try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'documento_aprobado', titulo: '✅ Documento aprobado', mensaje: `Tu ${LABEL_DOCS[tipoDoc] || tipoDoc} fue aprobado.`, link: '/verificacion' }); } catch (e) {}
      }
      await cargarDatos();
    } finally { setProcesandoDoc(''); }
  };

  const rechazarDoc = async (docId: string, usuarioId: string, tipoDoc: string) => {
    if (!motivoDoc.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({ estado: 'rechazado', motivo_rechazo: motivoDoc, updated_at: new Date().toISOString() }).eq('id', docId);
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'documento_rechazado', titulo: '❌ Documento rechazado', mensaje: `Tu ${LABEL_DOCS[tipoDoc] || tipoDoc} fue rechazado: ${motivoDoc}.`, link: '/verificacion' }); } catch (e) {}
      setRechazandoDoc(''); setMotivoDoc('');
      await cargarDatos();
    } finally { setProcesandoDoc(''); }
  };

  const aprobar = async (id: string, usuarioId: string, nombreUsuario: string) => {
    setProcesando(id);
    try {
      await supabase.from('verificaciones').update({ estado: 'aprobado', revisado_por: usuario.email, revisado_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);
      await supabase.from('badges').upsert({ usuario_id: usuarioId, tipo: 'verificado', nombre: 'Verificado', emoji: '✅' }, { onConflict: 'usuario_id,tipo' });
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'verificacion_aprobada', titulo: '🏆 ¡Verificación aprobada!', mensaje: 'Tu identidad fue verificada.', link: '/perfil' }); } catch (e) {}
      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const rechazar = async (id: string, nombreUsuario: string) => {
    if (!motivoRechazo.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesando(id);
    try {
      const { data: verifData } = await supabase.from('verificaciones').select('usuario_id').eq('id', id).single();
      await supabase.from('verificaciones').update({ estado: 'rechazado', motivo_rechazo: motivoRechazo, revisado_por: usuario.email, revisado_at: new Date().toISOString() }).eq('id', id);
      if (verifData?.usuario_id) {
        try { await supabase.from('notificaciones').insert({ usuario_id: verifData.usuario_id, tipo: 'documento_rechazado', titulo: '❌ Verificación rechazada', mensaje: `Tu verificación fue rechazada: ${motivoRechazo}.`, link: '/verificacion' }); } catch (e) {}
      }
      setRechazando(''); setMotivoRechazo('');
      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const estadoColor = (estado: string) => ({
    pendiente: 'bg-gray-100 text-gray-600', subido: 'bg-yellow-100 text-yellow-700',
    en_revision: 'bg-yellow-100 text-yellow-700', aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
  }[estado] || 'bg-gray-100 text-gray-600');

  const filtradas = verificaciones.filter(v => filtro === 'todas' ? true : v.estado === filtro);
  const conteoVerifs = {
    en_revision: verificaciones.filter(v => v.estado === 'en_revision').length,
    aprobado: verificaciones.filter(v => v.estado === 'aprobado').length,
    rechazado: verificaciones.filter(v => v.estado === 'rechazado').length,
    todas: verificaciones.length,
  };
  const totalDocsSubidos = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'subido').length, 0);
  const totalDocsAprobados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'aprobado').length, 0);
  const totalDocsRechazados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'rechazado').length, 0);

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
          <div className="flex items-center gap-2">
            <button onClick={() => { cargarMetrics(); cargarDatos(); }}
              className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">
              🔄
            </button>
            <a href="/perfil" className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">
              ← Perfil
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setTab('dashboard')}
            className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            📊 Dashboard
          </button>
          <button onClick={() => setTab('documentos')}
            className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'documentos' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            📄 Documentos {totalDocsSubidos > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalDocsSubidos}</span>}
          </button>
          <button onClick={() => setTab('verificaciones')}
            className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'verificaciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            🪪 Verificaciones {conteoVerifs.en_revision > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{conteoVerifs.en_revision}</span>}
          </button>
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            {cargandoMetrics ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* Usuarios */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>👥</span> Usuarios</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-3xl font-extrabold text-blue-700">{metrics.totalUsuarios}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Total registrados</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-3xl font-extrabold text-green-600">{metrics.nuevosHoy}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Nuevos hoy</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-xl font-extrabold text-purple-600">{metrics.fleksers}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Fleksers</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-xl font-extrabold text-slate-700">{metrics.empresas}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Empresas</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-xl font-extrabold text-emerald-600">{metrics.nuevosEsteMes}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Este mes</p>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>⚡</span> Servicios</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                      <p className="text-2xl font-extrabold text-blue-700">{metrics.serviciosPublicados}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Activos</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                      <p className="text-2xl font-extrabold text-green-700">{metrics.serviciosCompletados}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Completados</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                      <p className="text-2xl font-extrabold text-red-600">{metrics.serviciosCancelados}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Cancelados</p>
                    </div>
                  </div>
                </div>

                {/* Ingresos */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>💰</span> Ingresos</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Hoy</p>
                      <p className="text-2xl font-extrabold text-green-700">${metrics.ingresosDia.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">MXN</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Este mes</p>
                      <p className="text-2xl font-extrabold text-green-700">${metrics.ingresosMes.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">MXN</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4">
                    <p className="text-white/70 text-xs font-semibold mb-1">Comisión acumulada Fleksi (25%)</p>
                    <p className="text-3xl font-extrabold text-white">${metrics.comisionAcumulada.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
                    <p className="text-white/60 text-xs mt-1">MXN ganados por Fleksi</p>
                  </div>
                </div>

                {/* Ciudad top */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📍</span> Ciudad con más actividad</h2>
                  <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <span className="text-4xl">🏙️</span>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xl">{metrics.ciudadTopNombre}</p>
                      <p className="text-sm text-gray-500">{metrics.ciudadTopCount} usuario{metrics.ciudadTopCount !== 1 ? 's' : ''} registrado{metrics.ciudadTopCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* ── SECCIÓN DE REPORTES ── */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📥</span> Descargar reporte</h2>

                  <p className="text-xs text-gray-500 mb-3">Selecciona el período y descarga el reporte en el formato que prefieras.</p>

                  {/* Selector de período */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {PERIODOS.map(p => (
                      <button key={p.key} onClick={() => setPeriodoReporte(p.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          periodoReporte === p.key
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Botones de descarga */}
                  <div className="flex gap-3">
                    <button
                      onClick={descargarExcel}
                      disabled={!!generandoReporte}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                      {generandoReporte === 'excel' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      ) : '📊'}
                      Excel / CSV
                    </button>
                    <button
                      onClick={descargarPDF}
                      disabled={!!generandoReporte}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                      {generandoReporte === 'pdf' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      ) : '📄'}
                      PDF / Imprimir
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    El PDF se abre en una nueva ventana para imprimir o guardar.
                    El Excel descarga como archivo CSV compatible con Excel.
                  </p>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Última actualización: {new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>

              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div>
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
                      <button onClick={() => setUsuarioExpandido(expandido ? null : grupo.usuario_id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            {grupo.usuario?.foto_url ? <img src={grupo.usuario.foto_url} className="w-full h-full object-cover rounded-xl"/> : <span className="text-white font-bold text-sm">{grupo.usuario?.nombre?.charAt(0) || '?'}</span>}
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
                          {docsSubidos > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{docsSubidos} por revisar</span>}
                          <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {expandido && (
                        <div className="border-t border-gray-100 p-5">
                          <div className="flex flex-col gap-3">
                            {grupo.documentos.map((doc: any) => (
                              <div key={doc.id} className={`rounded-xl p-4 border ${doc.estado === 'aprobado' ? 'bg-green-50 border-green-100' : doc.estado === 'rechazado' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{LABEL_DOCS[doc.tipo] || doc.tipo}</span>
                                    {doc.tipo === 'licencia' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Opcional</span>}
                                  </div>
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor(doc.estado)}`}>
                                    {doc.estado === 'subido' ? '🔍 Por revisar' : doc.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                                  </span>
                                </div>
                                {doc.motivo_rechazo && <div className="bg-red-100 rounded-lg p-2 mb-2"><p className="text-xs text-red-700 font-semibold">Motivo: {doc.motivo_rechazo}</p></div>}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {doc.url && <button onClick={() => verDocumento(doc.url, grupo.usuario_id, doc.tipo)} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition">👁️ Ver documento</button>}
                                  {doc.estado === 'subido' && (
                                    <>
                                      {rechazandoDoc === doc.id ? (
                                        <div className="w-full flex flex-col gap-2 mt-2">
                                          <textarea value={motivoDoc} onChange={(e) => setMotivoDoc(e.target.value)} placeholder="Motivo del rechazo..." rows={2} className="w-full p-2 rounded-lg border-2 border-red-300 outline-none text-gray-900 text-xs resize-none"/>
                                          <div className="flex gap-2">
                                            <button onClick={() => { setRechazandoDoc(''); setMotivoDoc(''); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs">Cancelar</button>
                                            <button onClick={() => rechazarDoc(doc.id, grupo.usuario_id, doc.tipo)} disabled={procesandoDoc === doc.id} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-xs disabled:opacity-50">{procesandoDoc === doc.id ? '...' : 'Confirmar'}</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex gap-2 ml-auto">
                                          <button onClick={() => setRechazandoDoc(doc.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 transition">❌ Rechazar</button>
                                          <button onClick={() => aprobarDoc(doc.id, grupo.usuario_id, grupo.usuario?.nombre, doc.tipo)} disabled={procesandoDoc === doc.id} className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs disabled:opacity-50 hover:bg-green-600 transition">{procesandoDoc === doc.id ? '...' : '✅ Aprobar'}</button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {doc.estado === 'aprobado' && <span className="text-xs text-green-600 font-semibold ml-auto">Aprobado ✓</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Actualizado: {new Date(doc.updated_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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

        {/* ── VERIFICACIONES ── */}
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
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${filtro === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
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
                          {v.usuarios?.foto_url ? <img src={v.usuarios.foto_url} className="w-full h-full object-cover rounded-xl"/> : <span className="text-white font-bold">{v.usuarios?.nombre?.charAt(0) || '?'}</span>}
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
                    <p className="text-xs text-gray-400 mb-4">Enviado: {new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {v.motivo_rechazo && <div className="bg-red-50 rounded-xl p-3 mb-4"><p className="text-xs font-bold text-red-700">Motivo de rechazo:</p><p className="text-xs text-red-600 mt-1">{v.motivo_rechazo}</p></div>}
                    {v.estado === 'en_revision' && (
                      <div>
                        {rechazando === v.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Motivo del rechazo..." rows={3} className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm resize-none"/>
                            <div className="flex gap-2">
                              <button onClick={() => { setRechazando(''); setMotivoRechazo(''); }} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">Cancelar</button>
                              <button onClick={() => rechazar(v.id, v.usuarios?.nombre)} disabled={procesando === v.id} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">{procesando === v.id ? 'Rechazando...' : 'Confirmar rechazo'}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setRechazando(v.id)} className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">❌ Rechazar</button>
                            <button onClick={() => aprobar(v.id, v.usuario_id, v.usuarios?.nombre)} disabled={procesando === v.id} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">{procesando === v.id ? 'Aprobando...' : '✅ Aprobar'}</button>
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
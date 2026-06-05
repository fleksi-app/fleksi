'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

function semanaLabel(fecha: Date) {
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function generarSemanas(semanas: number) {
  const resultado = [];
  const hoy = new Date();
  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - i * 7);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    resultado.push({ inicio, fin, label: semanaLabel(inicio) });
  }
  return resultado;
}

export default function Admin() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [documentosPorUsuario, setDocumentosPorUsuario] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState('');
  const [filtro, setFiltro] = useState('en_revision');
  const [tab, setTab] = useState<'dashboard' | 'documentos' | 'verificaciones' | 'dispersion' | 'retiros'>('dashboard');
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);
  const [rechazandoDoc, setRechazandoDoc] = useState('');
  const [motivoDoc, setMotivoDoc] = useState('');
  const [procesandoDoc, setProcesandoDoc] = useState('');
  const [periodoReporte, setPeriodoReporte] = useState('1m');
  const [generandoReporte, setGenerandoReporte] = useState('');

  // Dispersión
  const [pagosDispersion, setPagosDispersion] = useState<any[]>([]);
  const [cargandoDispersion, setCargandoDispersion] = useState(false);
  const [filtroDispersion, setFiltroDispersion] = useState<'pendiente' | 'dispersado'>('pendiente');
  const [marcandoDispersado, setMarcandoDispersado] = useState('');
  const [notaDispersion, setNotaDispersion] = useState<Record<string, string>>({});

  // Retiros wallet
  const [retiros, setRetiros] = useState<any[]>([]);
  const [cargandoRetiros, setCargandoRetiros] = useState(false);
  const [filtroRetiros, setFiltroRetiros] = useState<'pendiente' | 'completado' | 'rechazado'>('pendiente');
  const [procesandoRetiro, setProcesandoRetiro] = useState('');
  const [notaRetiro, setNotaRetiro] = useState<Record<string, string>>({});
  const [rechazandoRetiro, setRechazandoRetiro] = useState('');

  const [metrics, setMetrics] = useState({
    totalUsuarios: 0, fleksers: 0, empresas: 0,
    nuevosHoy: 0, nuevosEsteMes: 0,
    serviciosPublicados: 0, serviciosCompletados: 0, serviciosCancelados: 0,
    ingresosDia: 0, ingresosMes: 0, comisionAcumulada: 0,
    ciudadTopNombre: '—', ciudadTopCount: 0,
  });
  const [cargandoMetrics, setCargandoMetrics] = useState(true);
  const [datosUsuarios, setDatosUsuarios] = useState<any[]>([]);
  const [datosServicios, setDatosServicios] = useState<any[]>([]);
  const [datosIngresos, setDatosIngresos] = useState<any[]>([]);

  useEffect(() => { cargarDatos(); cargarMetrics(); }, []);
  useEffect(() => { if (tab === 'dispersion') cargarDispersion(); }, [tab]);
  useEffect(() => { if (tab === 'retiros') cargarRetiros(); }, [tab]);


  const cargarRetiros = async () => {
    setCargandoRetiros(true);
    try {
      const { data } = await supabase
        .from("retiros")
        .select("*, usuarios(id, nombre, email, telefono, foto_url)")
        .order("created_at", { ascending: false });
      setRetiros(data || []);
    } catch (e) { console.error(e); }
    finally { setCargandoRetiros(false); }
  };

  const procesarRetiro = async (retiroId: string, usuarioId: string, monto: number, nota: string) => {
    setProcesandoRetiro(retiroId);
    try {
      await supabase.from("retiros").update({ estado: "completado", notas: nota || null, procesado_por: usuario.email, procesado_at: new Date().toISOString() }).eq("id", retiroId);
      try { await supabase.from("notificaciones").insert({ usuario_id: usuarioId, tipo: "retiro_completado", titulo: "✅ Retiro completado", mensaje: `Tu retiro de $${monto.toFixed(2)} MXN ha sido procesado y enviado a tu cuenta bancaria.`, link: "/wallet" }); } catch (e) {}
      await cargarRetiros();
    } catch (e) { console.error(e); }
    finally { setProcesandoRetiro(""); }
  };

  const rechazarRetiroFn = async (retiroId: string, usuarioId: string, monto: number, nota: string) => {
    if (!nota.trim()) { alert("Escribe el motivo del rechazo"); return; }
    setProcesandoRetiro(retiroId);
    try {
      const { data: ud } = await supabase.from("usuarios").select("wallet_saldo").eq("id", usuarioId).single();
      await supabase.from("usuarios").update({ wallet_saldo: (ud?.wallet_saldo || 0) + monto }).eq("id", usuarioId);
      await supabase.from("wallet_movimientos").insert({ usuario_id: usuarioId, tipo: "reembolso", monto: monto, descripcion: `Retiro rechazado — saldo reintegrado: ${nota}` });
      await supabase.from("retiros").update({ estado: "rechazado", notas: nota, procesado_por: usuario.email, procesado_at: new Date().toISOString() }).eq("id", retiroId);
      try { await supabase.from("notificaciones").insert({ usuario_id: usuarioId, tipo: "retiro_rechazado", titulo: "❌ Retiro no procesado", mensaje: `Tu solicitud de retiro de $${monto.toFixed(2)} MXN no pudo procesarse: ${nota}. El saldo fue reintegrado a tu wallet.`, link: "/wallet" }); } catch (e) {}
      setRechazandoRetiro("");
      await cargarRetiros();
    } catch (e) { console.error(e); }
    finally { setProcesandoRetiro(""); }
  };

  const cargarDispersion = async () => {
    setCargandoDispersion(true);
    try {
      const { data } = await supabase
        .from('aplicaciones')
        .select(`
          id, precio_ofrecido, pago_liberado, dispersado, dispersado_at, nota_dispersion,
          servicios(id, titulo, presupuesto, estado, completado_at),
          usuarios!prestador_id(id, nombre, email, telefono)
        `)
        .eq('estado', 'completado')
        .eq('pago_liberado', true)
        .order('dispersado_at', { ascending: false, nullsFirst: true });

      const procesados = (data || []).map((app: any) => {
        const precio = app.precio_ofrecido || app.servicios?.presupuesto || 0;
        const comision = Math.round(precio * 0.10);
        const pagoFlekser = precio - comision;
        return { ...app, precio, comision, pagoFlekser };
      });
      setPagosDispersion(procesados);
    } catch (e) { console.error(e); }
    finally { setCargandoDispersion(false); }
  };

  const marcarDispersado = async (appId: string, nota: string) => {
    setMarcandoDispersado(appId);
    try {
      await supabase.from('aplicaciones').update({
        dispersado: true,
        dispersado_at: new Date().toISOString(),
        nota_dispersion: nota || null,
      }).eq('id', appId);
      await cargarDispersion();
    } catch (e) { console.error(e); }
    finally { setMarcandoDispersado(''); }
  };

  const cargarMetrics = async () => {
    setCargandoMetrics(true);
    try {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const { data: usuarios } = await supabase.from('usuarios').select('rol, created_at, ciudad');
      const { data: servicios } = await supabase.from('servicios').select('estado, created_at, presupuesto');
      const totalUsuarios = usuarios?.length || 0;
      const fleksers = usuarios?.filter(u => u.rol === 'flekser' || u.rol === 'viajero').length || 0;
      const empresas = usuarios?.filter(u => u.rol === 'empresa').length || 0;
      const nuevosHoy = usuarios?.filter(u => new Date(u.created_at) >= hoy).length || 0;
      const nuevosEsteMes = usuarios?.filter(u => new Date(u.created_at) >= inicioMes).length || 0;
      const ciudadCount: Record<string, number> = {};
      usuarios?.forEach(u => { if (u.ciudad) ciudadCount[u.ciudad] = (ciudadCount[u.ciudad] || 0) + 1; });
      const ciudadTop = Object.entries(ciudadCount).sort((a, b) => b[1] - a[1])[0];
      const serviciosPublicados = servicios?.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length || 0;
      const serviciosCompletados = servicios?.filter(s => s.estado === 'completado' || s.estado === 'pagado').length || 0;
      const serviciosCancelados = servicios?.filter(s => s.estado === 'cancelado').length || 0;
      const pagadosHoy = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= hoy) || [];
      const pagadosMes = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= inicioMes) || [];
      const ingresosDia = pagadosHoy.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const ingresosMes = pagadosMes.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const comisionAcumulada = (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0);
      setMetrics({ totalUsuarios, fleksers, empresas, nuevosHoy, nuevosEsteMes, serviciosPublicados, serviciosCompletados, serviciosCancelados, ingresosDia, ingresosMes, comisionAcumulada, ciudadTopNombre: ciudadTop?.[0] || '—', ciudadTopCount: ciudadTop?.[1] || 0 });
      const semanas = generarSemanas(8);
      setDatosUsuarios(semanas.map(s => ({ semana: s.label, usuarios: (usuarios || []).filter(u => { const f = new Date(u.created_at); return f >= s.inicio && f <= s.fin; }).length, acumulado: (usuarios || []).filter(u => new Date(u.created_at) <= s.fin).length })));
      setDatosServicios(semanas.map(s => ({ semana: s.label, completados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).length, cancelados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return sv.estado === 'cancelado' && f >= s.inicio && f <= s.fin; }).length, publicados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return f >= s.inicio && f <= s.fin; }).length })));
      setDatosIngresos(semanas.map(s => ({ semana: s.label, ingresos: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).reduce((acc, sv) => acc + (sv.presupuesto || 0), 0), comision: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).reduce((acc, sv) => acc + (sv.presupuesto || 0) * 0.25, 0) })));
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
    const fin = new Date(); const inicio = new Date(); inicio.setMonth(inicio.getMonth() - meses);
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
      usuarios: { total: usuarios?.length || 0, nuevosEnPeriodo: usuariosPeriodo.length, fleksers: (usuarios || []).filter(u => u.rol === 'flekser').length, empresas: (usuarios || []).filter(u => u.rol === 'empresa').length },
      servicios: { total: servicios?.length || 0, enPeriodo: serviciosPeriodo.length, activos: serviciosPeriodo.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length, completados: completadosPeriodo.length, cancelados: serviciosPeriodo.filter(s => s.estado === 'cancelado').length },
      ingresos: { transaccionadoPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0), comisionPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0), comisionAcumulada: (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0), ticketPromedio: completadosPeriodo.length > 0 ? completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0) / completadosPeriodo.length : 0 },
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
        ['REPORTE FLEKSI','',''], [`Período: ${periodo.label}`,`${datos.periodo.inicio} — ${datos.periodo.fin}`,''], [`Generado: ${fechaGen}`,'',''], ['','',''],
        ['USUARIOS','',''], ['Métrica','Valor',''], ['Total registrados',datos.usuarios.total,''], ['Nuevos en el período',datos.usuarios.nuevosEnPeriodo,''], ['Fleksers',datos.usuarios.fleksers,''], ['Empresas',datos.usuarios.empresas,''], ['','',''],
        ['SERVICIOS','',''], ['Métrica','Valor',''], ['Total histórico',datos.servicios.total,''], ['Publicados en período',datos.servicios.enPeriodo,''], ['Completados en período',datos.servicios.completados,''], ['Cancelados en período',datos.servicios.cancelados,''], ['','',''],
        ['INGRESOS (MXN)','',''], ['Métrica','Valor',''], ['Transaccionado en período',`$${datos.ingresos.transaccionadoPeriodo.toLocaleString('es-MX',{maximumFractionDigits:2})}`,''], ['Comisión Fleksi en período (25%)',`$${datos.ingresos.comisionPeriodo.toLocaleString('es-MX',{maximumFractionDigits:2})}`,''], ['Comisión acumulada histórica',`$${datos.ingresos.comisionAcumulada.toLocaleString('es-MX',{maximumFractionDigits:2})}`,''], ['Ticket promedio',`$${datos.ingresos.ticketPromedio.toLocaleString('es-MX',{maximumFractionDigits:2})}`,''], ['','',''],
        ['GEOGRAFÍA','',''], ['Ciudad con más actividad',datos.ciudad.nombre,''], ['Usuarios en esa ciudad',datos.ciudad.usuarios,''],
      ];
      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Fleksi_Reporte_${periodo.label}_${fechaGen.replace(/\//g, '-')}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally { setGenerandoReporte(''); }
  };

  const descargarPDF = async () => {
    setGenerandoReporte('pdf');
    try {
      const periodo = PERIODOS.find(p => p.key === periodoReporte)!;
      const datos = await obtenerDatosReporte(periodo.meses);
      const fechaGen = new Date().toLocaleDateString('es-MX');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte Fleksi</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111827}.header{background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;padding:30px;border-radius:12px;margin-bottom:30px}.header h1{margin:0;font-size:28px}.header p{margin:4px 0 0;opacity:.8;font-size:14px}.seccion{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:20px}.seccion h2{margin:0 0 16px;font-size:16px;color:#374151;border-bottom:2px solid #E5E7EB;padding-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.card{background:white;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center}.card .valor{font-size:28px;font-weight:800;color:#2563EB}.card .label{font-size:11px;color:#6B7280;margin-top:4px}.card.verde .valor{color:#059669}.card.gris .valor{color:#374151}.card.rojo .valor{color:#DC2626}.comision{background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;border-radius:12px;padding:20px;text-align:center;margin-top:12px}.comision .valor{font-size:36px;font-weight:800}.comision .label{opacity:.8;font-size:12px;margin-top:4px}.footer{text-align:center;color:#9CA3AF;font-size:11px;margin-top:30px;padding-top:20px;border-top:1px solid #E5E7EB}</style></head><body>
      <div class="header"><h1>⚡ Fleksi — Reporte ${periodo.label}</h1><p>Período: ${datos.periodo.inicio} — ${datos.periodo.fin} | Generado: ${fechaGen}</p></div>
      <div class="seccion"><h2>👥 Usuarios</h2><div class="grid"><div class="card"><div class="valor">${datos.usuarios.total}</div><div class="label">Total registrados</div></div><div class="card verde"><div class="valor">${datos.usuarios.nuevosEnPeriodo}</div><div class="label">Nuevos en el período</div></div></div><div class="grid3" style="margin-top:12px"><div class="card"><div class="valor" style="color:#7C3AED">${datos.usuarios.fleksers}</div><div class="label">Fleksers</div></div><div class="card gris"><div class="valor">${datos.usuarios.empresas}</div><div class="label">Empresas</div></div><div class="card"><div class="valor" style="color:#0891B2">${datos.usuarios.total-datos.usuarios.fleksers-datos.usuarios.empresas}</div><div class="label">Otros</div></div></div></div>
      <div class="seccion"><h2>⚡ Servicios</h2><div class="grid3"><div class="card"><div class="valor" style="color:#2563EB">${datos.servicios.activos}</div><div class="label">Activos</div></div><div class="card verde"><div class="valor">${datos.servicios.completados}</div><div class="label">Completados</div></div><div class="card rojo"><div class="valor">${datos.servicios.cancelados}</div><div class="label">Cancelados</div></div></div></div>
      <div class="seccion"><h2>💰 Ingresos (MXN)</h2><div class="grid"><div class="card verde"><div class="valor">$${datos.ingresos.transaccionadoPeriodo.toLocaleString('es-MX',{maximumFractionDigits:0})}</div><div class="label">Transaccionado en período</div></div><div class="card"><div class="valor">$${datos.ingresos.ticketPromedio.toLocaleString('es-MX',{maximumFractionDigits:0})}</div><div class="label">Ticket promedio</div></div></div><div class="comision"><div class="label">Comisión Fleksi acumulada (25%)</div><div class="valor">$${datos.ingresos.comisionAcumulada.toLocaleString('es-MX',{maximumFractionDigits:0})} MXN</div><div class="label">En el período: $${datos.ingresos.comisionPeriodo.toLocaleString('es-MX',{maximumFractionDigits:0})} MXN</div></div></div>
      <div class="footer">Fleksi · Irapuato, Guanajuato · Reporte generado automáticamente el ${fechaGen}</div>
      <script>window.onload=()=>{window.print()}</script></body></html>`;
      const ventana = window.open('', '_blank');
      if (ventana) { ventana.document.write(html); ventana.document.close(); }
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

  const estadoColor = (estado: string) => ({ pendiente: 'bg-gray-100 text-gray-600', subido: 'bg-yellow-100 text-yellow-700', en_revision: 'bg-yellow-100 text-yellow-700', aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700' }[estado] || 'bg-gray-100 text-gray-600');

  const filtradas = verificaciones.filter(v => filtro === 'todas' ? true : v.estado === filtro);
  const conteoVerifs = { en_revision: verificaciones.filter(v => v.estado === 'en_revision').length, aprobado: verificaciones.filter(v => v.estado === 'aprobado').length, rechazado: verificaciones.filter(v => v.estado === 'rechazado').length, todas: verificaciones.length };
  const totalDocsSubidos = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'subido').length, 0);
  const totalDocsAprobados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'aprobado').length, 0);
  const totalDocsRechazados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'rechazado').length, 0);
  const hayDatosGraficas = datosUsuarios.some(d => d.usuarios > 0 || d.acumulado > 0);
  const pagosFiltrados = pagosDispersion.filter(p => filtroDispersion === 'pendiente' ? !p.dispersado : !!p.dispersado);
  const totalPendiente = pagosDispersion.filter(p => !p.dispersado).reduce((acc, p) => acc + p.pagoFlekser, 0);
  const totalDispersado = pagosDispersion.filter(p => p.dispersado).reduce((acc, p) => acc + p.pagoFlekser, 0);
  const pendienteCount = pagosDispersion.filter(p => !p.dispersado).length;

  if (cargando) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando panel admin...</p>
      </div>
    </main>
  );

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
            <button onClick={() => { cargarMetrics(); cargarDatos(); }} className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">🔄</button>
            <a href="/perfil" className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">← Perfil</a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setTab('dashboard')} className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>📊 Dashboard</button>
          <button onClick={() => setTab('dispersion')} className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'dispersion' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            💸 Dispersión {pendienteCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendienteCount}</span>}
          </button>
          <button onClick={() => setTab('documentos')} className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'documentos' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            📄 Documentos {totalDocsSubidos > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalDocsSubidos}</span>}
          </button>
          <button onClick={() => setTab('verificaciones')} className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'verificaciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            🪪 Verificaciones {conteoVerifs.en_revision > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{conteoVerifs.en_revision}</span>}
          </button>
          <button onClick={() => setTab('retiros')} className={`flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ${tab === 'retiros' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'}`}>
            🏦 Retiros {retiros.filter(r => r.estado === 'pendiente').length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{retiros.filter(r => r.estado === 'pendiente').length}</span>}
          </button>
        </div>

        {/* ── DISPERSIÓN ── */}
        {tab === 'dispersion' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-1">💸 Por dispersar</p>
                <p className="text-3xl font-extrabold text-red-500">${totalPendiente.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-1">{pendienteCount} pago{pendienteCount !== 1 ? 's' : ''} pendiente{pendienteCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-1">✅ Ya dispersado</p>
                <p className="text-3xl font-extrabold text-green-600">${totalDispersado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-1">{pagosDispersion.filter(p => p.dispersado).length} pagos realizados</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
              <p className="text-blue-800 text-sm font-semibold mb-1">📌 ¿Cómo funciona la dispersión?</p>
              <p className="text-blue-700 text-xs leading-relaxed">Cuando un trabajo se completa y el pago se libera, el dinero queda en tu cuenta de Stripe. Aquí ves exactamente cuánto le debes transferir a cada Flekser (precio del trabajo − 10% comisión Fleksi). Haz la transferencia por SPEI o desde Stripe y marca como dispersado.</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setFiltroDispersion('pendiente')} className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition ${filtroDispersion === 'pendiente' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                ⏳ Pendientes {pendienteCount > 0 && `(${pendienteCount})`}
              </button>
              <button onClick={() => setFiltroDispersion('dispersado')} className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition ${filtroDispersion === 'dispersado' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                ✅ Dispersados
              </button>
            </div>

            {cargandoDispersion ? (
              <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            ) : pagosFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-4xl mb-3">{filtroDispersion === 'pendiente' ? '🎉' : '📭'}</p>
                <p className="font-bold text-gray-900">{filtroDispersion === 'pendiente' ? '¡Todo dispersado! Sin pagos pendientes' : 'Sin pagos dispersados aún'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pagosFiltrados.map((pago) => (
                  <div key={pago.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-extrabold text-gray-900">{pago.servicios?.titulo || 'Trabajo'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{pago.servicios?.completado_at ? `Completado: ${new Date(pago.servicios.completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Fecha no disponible'}</p>
                      </div>
                      {pago.dispersado
                        ? <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">✅ Dispersado</span>
                        : <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">⏳ Pendiente</span>}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs text-gray-400 font-semibold mb-1">👤 Flekser a pagar</p>
                      <p className="font-extrabold text-gray-900">{pago.usuarios?.nombre || '—'}</p>
                      {pago.usuarios?.email && <p className="text-xs text-gray-500 mt-0.5">✉️ {pago.usuarios.email}</p>}
                      {pago.usuarios?.telefono && <p className="text-xs text-gray-500 mt-0.5">📱 {pago.usuarios.telefono}</p>}
                    </div>

                    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Precio del trabajo</span>
                        <span className="font-bold text-gray-900">${pago.precio.toLocaleString('es-MX')} MXN</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-red-50">
                        <span className="text-sm text-red-500">− Comisión Fleksi (10%)</span>
                        <span className="font-bold text-red-500">−${pago.comision.toLocaleString('es-MX')} MXN</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3 bg-green-50">
                        <span className="text-sm font-extrabold text-green-700">💰 A transferir al Flekser</span>
                        <span className="text-xl font-extrabold text-green-700">${pago.pagoFlekser.toLocaleString('es-MX')} MXN</span>
                      </div>
                    </div>

                    {pago.dispersado && pago.nota_dispersion && (
                      <div className="bg-green-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-green-700 font-semibold">📝 Nota: {pago.nota_dispersion}</p>
                        {pago.dispersado_at && <p className="text-xs text-green-600 mt-0.5">Dispersado el {new Date(pago.dispersado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                      </div>
                    )}

                    {!pago.dispersado && (
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Nota opcional (ej. SPEI confirmado, ref. 123...)"
                          value={notaDispersion[pago.id] || ''}
                          onChange={(e) => setNotaDispersion(prev => ({ ...prev, [pago.id]: e.target.value }))}
                          className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/>
                        <button onClick={() => marcarDispersado(pago.id, notaDispersion[pago.id] || '')} disabled={marcandoDispersado === pago.id}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                          {marcandoDispersado === pago.id ? 'Guardando...' : '✅ Marcar como dispersado'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            {cargandoMetrics ? (
              <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>👥</span> Usuarios</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"><p className="text-3xl font-extrabold text-blue-700">{metrics.totalUsuarios}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Total registrados</p></div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-3xl font-extrabold text-green-600">{metrics.nuevosHoy}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Nuevos hoy</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-extrabold text-purple-600">{metrics.fleksers}</p><p className="text-xs text-gray-400 mt-0.5">Fleksers</p></div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-extrabold text-slate-700">{metrics.empresas}</p><p className="text-xs text-gray-400 mt-0.5">Empresas</p></div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-extrabold text-emerald-600">{metrics.nuevosEsteMes}</p><p className="text-xs text-gray-400 mt-0.5">Este mes</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>⚡</span> Servicios</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center"><p className="text-2xl font-extrabold text-blue-700">{metrics.serviciosPublicados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Activos</p></div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center"><p className="text-2xl font-extrabold text-green-700">{metrics.serviciosCompletados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Completados</p></div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center"><p className="text-2xl font-extrabold text-red-600">{metrics.serviciosCancelados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Cancelados</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>💰</span> Ingresos</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-xs text-gray-500 font-semibold mb-1">Hoy</p><p className="text-2xl font-extrabold text-green-700">${metrics.ingresosDia.toLocaleString()}</p><p className="text-xs text-gray-400">MXN</p></div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-xs text-gray-500 font-semibold mb-1">Este mes</p><p className="text-2xl font-extrabold text-green-700">${metrics.ingresosMes.toLocaleString()}</p><p className="text-xs text-gray-400">MXN</p></div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4">
                    <p className="text-white/70 text-xs font-semibold mb-1">Comisión acumulada Fleksi (25%)</p>
                    <p className="text-3xl font-extrabold text-white">${metrics.comisionAcumulada.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
                    <p className="text-white/60 text-xs mt-1">MXN ganados por Fleksi</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📍</span> Ciudad con más actividad</h2>
                  <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <span className="text-4xl">🏙️</span>
                    <div><p className="font-extrabold text-gray-900 text-xl">{metrics.ciudadTopNombre}</p><p className="text-sm text-gray-500">{metrics.ciudadTopCount} usuario{metrics.ciudadTopCount !== 1 ? 's' : ''} registrado{metrics.ciudadTopCount !== 1 ? 's' : ''}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-1 flex items-center gap-2"><span>📈</span> Tendencias — últimas 8 semanas</h2>
                  <p className="text-xs text-gray-400 mb-4">Las gráficas se llenarán conforme crezca Fleksi.</p>
                  {!hayDatosGraficas ? (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-blue-100">
                      <p className="text-3xl mb-2">🌱</p><p className="font-bold text-gray-700 mb-1">Desde cero</p>
                      <p className="text-xs text-gray-500">Aquí verás el crecimiento de Fleksi semana a semana. Comparte la app con tus primeros usuarios para ver la primera barra aparecer.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">👥 Crecimiento de usuarios</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={datosUsuarios} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <defs><linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }}/>
                            <Area type="monotone" dataKey="acumulado" stroke="#2563EB" strokeWidth={2} fill="url(#gradUsuarios)" name="Total acumulado"/>
                            <Area type="monotone" dataKey="usuarios" stroke="#7C3AED" strokeWidth={2} fill="none" name="Nuevos esta semana" strokeDasharray="4 2"/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">⚡ Servicios por semana</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={datosServicios} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }}/>
                            <Legend wrapperStyle={{ fontSize: 11 }}/>
                            <Bar dataKey="publicados" name="Publicados" fill="#DBEAFE" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="completados" name="Completados" fill="#059669" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="cancelados" name="Cancelados" fill="#FCA5A5" radius={[4, 4, 0, 0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">💰 Ingresos y comisión por semana (MXN)</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={datosIngresos} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                            <defs>
                              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                              <linearGradient id="gradComision" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `$${v}`}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }} formatter={(v: any) => `$${v.toLocaleString('es-MX')} MXN`}/>
                            <Legend wrapperStyle={{ fontSize: 11 }}/>
                            <Area type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2} fill="url(#gradIngresos)" name="Transaccionado"/>
                            <Area type="monotone" dataKey="comision" stroke="#7C3AED" strokeWidth={2} fill="url(#gradComision)" name="Comisión Fleksi"/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📥</span> Descargar reporte</h2>
                  <p className="text-xs text-gray-500 mb-3">Selecciona el período y descarga el reporte.</p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {PERIODOS.map(p => (
                      <button key={p.key} onClick={() => setPeriodoReporte(p.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${periodoReporte === p.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{p.label}</button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={descargarExcel} disabled={!!generandoReporte} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                      {generandoReporte === 'excel' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '📊'} Excel / CSV
                    </button>
                    <button onClick={descargarPDF} disabled={!!generandoReporte} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                      {generandoReporte === 'pdf' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '📄'} PDF / Imprimir
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">El PDF se abre en nueva ventana para imprimir o guardar.</p>
                </div>
                <p className="text-xs text-gray-400 text-center">Última actualización: {new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-yellow-600">{totalDocsSubidos}</p><p className="text-xs text-gray-400 mt-1">Por revisar</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-green-600">{totalDocsAprobados}</p><p className="text-xs text-gray-400 mt-1">Aprobados</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-red-600">{totalDocsRechazados}</p><p className="text-xs text-gray-400 mt-1">Rechazados</p></div>
            </div>
            {documentosPorUsuario.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">📭</p><p className="font-bold text-gray-900">Sin documentos subidos aún</p></div>
            ) : (
              <div className="flex flex-col gap-4">
                {documentosPorUsuario.map((grupo) => {
                  const docsSubidos = grupo.documentos.filter((d: any) => d.estado === 'subido').length;
                  const expandido = usuarioExpandido === grupo.usuario_id;
                  return (
                    <div key={grupo.usuario_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <button onClick={() => setUsuarioExpandido(expandido ? null : grupo.usuario_id)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
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
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor(doc.estado)}`}>{doc.estado === 'subido' ? '🔍 Por revisar' : doc.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}</span>
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
              {[{ key: 'en_revision', label: 'En revisión', color: 'text-yellow-600' }, { key: 'aprobado', label: 'Aprobados', color: 'text-green-600' }, { key: 'rechazado', label: 'Rechazados', color: 'text-red-600' }, { key: 'todas', label: 'Total', color: 'text-purple-600' }].map(s => (
                <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{conteoVerifs[s.key as keyof typeof conteoVerifs]}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[{ key: 'en_revision', label: '🔍 En revisión' }, { key: 'aprobado', label: '✅ Aprobados' }, { key: 'rechazado', label: '❌ Rechazados' }, { key: 'todas', label: '📋 Todas' }].map(f => (
                <button key={f.key} onClick={() => setFiltro(f.key)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${filtro === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{f.label}</button>
              ))}
            </div>
            {filtradas.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">📭</p><p className="font-bold text-gray-900">Sin verificaciones en esta categoría</p></div>
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
                          <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{v.usuarios?.rol}</span>{v.usuarios?.ciudad && <span className="text-xs text-gray-400">· 📍 {v.usuarios.ciudad}</span>}</div>
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

        {/* ── RETIROS ── */}
        {tab === 'retiros' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-yellow-600">{retiros.filter(r => r.estado === 'pendiente').length}</p>
                <p className="text-xs text-gray-400 mt-1">Pendientes</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-green-600">{retiros.filter(r => r.estado === 'completado').length}</p>
                <p className="text-xs text-gray-400 mt-1">Completados</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-red-500">${retiros.filter(r => r.estado === 'pendiente').reduce((acc, r) => acc + (r.monto || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-1">MXN por enviar</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
              <p className="text-blue-800 text-sm font-semibold mb-1">📌 ¿Cómo procesar un retiro?</p>
              <p className="text-blue-700 text-xs leading-relaxed">El flekser solicitó el retiro desde su wallet. Haz la transferencia SPEI desde tu banco o Stripe a la CLABE indicada y marca como completado. Si hay algún problema, recházalo y el saldo se reintegra automáticamente.</p>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: 'pendiente', label: '⏳ Pendientes' },
                { key: 'completado', label: '✅ Completados' },
                { key: 'rechazado', label: '❌ Rechazados' },
              ].map(f => (
                <button key={f.key} onClick={() => setFiltroRetiros(f.key as any)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${filtroRetiros === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {cargandoRetiros ? (
              <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            ) : retiros.filter(r => r.estado === filtroRetiros).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-4xl mb-3">{filtroRetiros === 'pendiente' ? '🎉' : '📭'}</p>
                <p className="font-bold text-gray-900">{filtroRetiros === 'pendiente' ? '¡Sin retiros pendientes!' : 'Sin retiros en esta categoría'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {retiros.filter(r => r.estado === filtroRetiros).map((retiro) => (
                  <div key={retiro.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          {retiro.usuarios?.foto_url
                            ? <img src={retiro.usuarios.foto_url} className="w-full h-full object-cover rounded-xl"/>
                            : <span className="text-white font-bold text-sm">{retiro.usuarios?.nombre?.charAt(0) || '?'}</span>}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{retiro.usuarios?.nombre || '—'}</p>
                          <div className="flex flex-col gap-0.5">
                            {retiro.usuarios?.email && <p className="text-xs text-gray-400">✉️ {retiro.usuarios.email}</p>}
                            {retiro.usuarios?.telefono && <p className="text-xs text-gray-400">📱 {retiro.usuarios.telefono}</p>}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                        retiro.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        retiro.estado === 'completado' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {retiro.estado === 'pendiente' ? '⏳ Pendiente' : retiro.estado === 'completado' ? '✅ Completado' : '❌ Rechazado'}
                      </span>
                    </div>

                    {/* Monto */}
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100 mb-3">
                      <p className="text-xs text-gray-500 mb-0.5">Monto a transferir</p>
                      <p className="text-3xl font-extrabold text-teal-600">${retiro.monto?.toFixed(2)} <span className="text-lg font-normal text-gray-400">MXN</span></p>
                    </div>

                    {/* Datos bancarios */}
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-3">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-semibold">Banco</span>
                        <span className="font-bold text-gray-900 text-sm">{retiro.banco || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-semibold">CLABE</span>
                        <span className="font-bold text-gray-900 text-sm font-mono">{retiro.clabe?.replace(/(\d{4})/g, '$1 ').trim() || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-xs text-gray-500 font-semibold">Titular</span>
                        <span className="font-bold text-gray-900 text-sm">{retiro.titular || '—'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      Solicitado: {new Date(retiro.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Notas si ya fue procesado */}
                    {retiro.estado !== 'pendiente' && retiro.notas && (
                      <div className={`rounded-xl p-3 mb-3 ${retiro.estado === 'completado' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-xs font-semibold ${retiro.estado === 'completado' ? 'text-green-700' : 'text-red-700'}`}>
                          📝 {retiro.notas}
                        </p>
                        {retiro.procesado_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Por {retiro.procesado_por} · {new Date(retiro.procesado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Acciones solo para pendientes */}
                    {retiro.estado === 'pendiente' && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Nota opcional (ej. SPEI enviado, ref. 123...)"
                          value={notaRetiro[retiro.id] || ''}
                          onChange={e => setNotaRetiro(prev => ({ ...prev, [retiro.id]: e.target.value }))}
                          className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 text-sm transition"
                        />
                        {rechazandoRetiro === retiro.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Motivo del rechazo (obligatorio)"
                              value={notaRetiro[retiro.id + '_rechazo'] || ''}
                              onChange={e => setNotaRetiro(prev => ({ ...prev, [retiro.id + '_rechazo']: e.target.value }))}
                              className="w-full p-3 rounded-xl border-2 border-red-300 focus:border-red-400 outline-none text-gray-900 text-sm transition"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setRechazandoRetiro('')}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">
                                Cancelar
                              </button>
                              <button
                                onClick={() => rechazarRetiroFn(retiro.id, retiro.usuario_id, retiro.monto, notaRetiro[retiro.id + '_rechazo'] || '')}
                                disabled={procesandoRetiro === retiro.id}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                {procesandoRetiro === retiro.id ? 'Procesando...' : 'Confirmar rechazo'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setRechazandoRetiro(retiro.id)}
                              className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">
                              ❌ Rechazar
                            </button>
                            <button
                              onClick={() => procesarRetiro(retiro.id, retiro.usuario_id, retiro.monto, notaRetiro[retiro.id] || '')}
                              disabled={procesandoRetiro === retiro.id}
                              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                              {procesandoRetiro === retiro.id ? 'Procesando...' : '✅ Marcar enviado'}
                            </button>
                          </div>
                        )}
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
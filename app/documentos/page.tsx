'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const DOCUMENTOS_POR_ROL: Record<string, { tipo: string; label: string; desc: string; emoji: string; reembolso?: boolean; opcional?: boolean }[]> = {
  flekser: [
    { tipo: 'ine_frente', label: 'INE — Frente', desc: 'Foto clara del frente de tu INE vigente', emoji: '🪪' },
    { tipo: 'ine_reverso', label: 'INE — Reverso', desc: 'Foto clara del reverso de tu INE vigente', emoji: '🪪' },
    { tipo: 'curp', label: 'CURP', desc: 'Documento CURP en PDF o imagen', emoji: '📄' },
    { tipo: 'comprobante_domicilio', label: 'Comprobante de domicilio', desc: 'Recibo de luz, agua o teléfono (no mayor a 3 meses)', emoji: '🏠' },
    { tipo: 'antecedentes', label: 'Carta de antecedentes no penales', desc: 'Carta oficial vigente. Se te reembolsa al completar tu 5to trabajo', emoji: '📋', reembolso: true },
    { tipo: 'licencia', label: 'Licencia de conducir', desc: 'Solo si realizarás trabajos que impliquen conducir', emoji: '🚗', opcional: true },
  ],
  viajero: [
    { tipo: 'ine_frente', label: 'INE — Frente', desc: 'Foto clara del frente de tu INE vigente', emoji: '🪪' },
    { tipo: 'ine_reverso', label: 'INE — Reverso', desc: 'Foto clara del reverso de tu INE vigente', emoji: '🪪' },
    { tipo: 'curp', label: 'CURP', desc: 'Documento CURP en PDF o imagen', emoji: '📄' },
    { tipo: 'comprobante_domicilio', label: 'Comprobante de domicilio', desc: 'Recibo de luz, agua o teléfono (no mayor a 3 meses)', emoji: '🏠' },
    { tipo: 'antecedentes', label: 'Carta de antecedentes no penales', desc: 'Carta oficial vigente. Se te reembolsa al completar tu 5to trabajo', emoji: '📋', reembolso: true },
    { tipo: 'licencia', label: 'Licencia de conducir', desc: 'Solo si realizarás trabajos que impliquen conducir', emoji: '🚗', opcional: true },
  ],
  empresa: [
    { tipo: 'ine_frente', label: 'INE del representante legal — Frente', desc: 'Foto clara del frente del INE del representante', emoji: '🪪' },
    { tipo: 'ine_reverso', label: 'INE del representante legal — Reverso', desc: 'Foto clara del reverso del INE del representante', emoji: '🪪' },
    { tipo: 'constancia_fiscal', label: 'Constancia de situación fiscal', desc: 'Descárgala del SAT, debe ser reciente', emoji: '🏢' },
    { tipo: 'antecedentes', label: 'Carta de antecedentes no penales', desc: 'Del representante legal. Se reembolsa al contratar tu 5to trabajo', emoji: '📋', reembolso: true },
    { tipo: 'licencia', label: 'Licencia de conducir', desc: 'Solo si realizarás trabajos que impliquen conducir', emoji: '🚗', opcional: true },
  ],
};

const ESTADOS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  pendiente: { label: 'Sin subir', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '📂' },
  subido: { label: 'En revisión', color: 'text-yellow-700', bg: 'bg-yellow-100', emoji: '🔍' },
  aprobado: { label: 'Aprobado', color: 'text-green-700', bg: 'bg-green-100', emoji: '✅' },
  rechazado: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', emoji: '❌' },
};

export default function Documentos() {
  const [usuario, setUsuario] = useState<any>(null);
  const [documentos, setDocumentos] = useState<Record<string, any>>({});
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [formularioFactura, setFormularioFactura] = useState({ nombre_fiscal: '', rfc: '', direccion_fiscal: '', uso_cfdi: '', regimen_fiscal: '' });
  const [guardandoFactura, setGuardandoFactura] = useState(false);
  const [facturaGuardada, setFacturaGuardada] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: usuarioData } = await supabase
        .from('usuarios').select('*').eq('id', user.id).single();
      setUsuario({ ...usuarioData, id: user.id });

      const { data: docs } = await supabase
        .from('documentos').select('*').eq('usuario_id', user.id);

      const docsMap: Record<string, any> = {};
      (docs || []).forEach((d: any) => { docsMap[d.tipo] = d; });
      setDocumentos(docsMap);

      // Cargar datos de factura si existen
      if (usuarioData?.datos_factura) {
        setFormularioFactura(usuarioData.datos_factura);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const subirDocumento = async (tipo: string, file: File) => {
    if (!usuario) return;
    setSubiendo(tipo);
    try {
      const ext = file.name.split('.').pop();
      const path = `${usuario.id}/${tipo}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-verificacion')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documentos-verificacion')
        .getPublicUrl(path);

      // Verificar si ya existe el documento
      const existe = documentos[tipo];
      if (existe) {
        await supabase.from('documentos').update({
          url: urlData.publicUrl,
          estado: 'subido',
          motivo_rechazo: null,
          updated_at: new Date().toISOString(),
        }).eq('id', existe.id);
      } else {
        await supabase.from('documentos').insert({
          usuario_id: usuario.id,
          tipo,
          estado: 'subido',
          url: urlData.publicUrl,
        });
      }

      // Notificar al admin
      try {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: 'fernando.najera.nm@gmail.com',
            titulo: '📄 Nuevo documento subido',
            mensaje: `${usuario.nombre} subió: ${tipo}`,
            link: '/admin/verificaciones',
          }),
        });
      } catch (e) {}

      await cargar();
    } catch (err: any) {
      alert('Error al subir el archivo: ' + err.message);
    } finally {
      setSubiendo(null);
    }
  };

  const handleFileChange = async (tipo: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede pesar más de 10MB');
      return;
    }
    await subirDocumento(tipo, file);
    e.target.value = '';
  };

  const guardarFactura = async () => {
    if (!formularioFactura.nombre_fiscal || !formularioFactura.rfc) {
      alert('Nombre fiscal y RFC son obligatorios');
      return;
    }
    setGuardandoFactura(true);
    try {
      await supabase.from('usuarios').update({
        datos_factura: formularioFactura,
      }).eq('id', usuario.id);
      setFacturaGuardada(true);
      setTimeout(() => setFacturaGuardada(false), 3000);
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardandoFactura(false);
    }
  };

  const calcularProgreso = () => {
    const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
    const lista = DOCUMENTOS_POR_ROL[rol] || DOCUMENTOS_POR_ROL.flekser;
    const requeridos = lista.filter(d => !d.opcional);
    const aprobados = requeridos.filter(d => documentos[d.tipo]?.estado === 'aprobado');
    return Math.round((aprobados.length / requeridos.length) * 100);
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando documentos...</p>
        </div>
      </main>
    );
  }

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const listaDocumentos = DOCUMENTOS_POR_ROL[rol] || DOCUMENTOS_POR_ROL.flekser;
  const progreso = calcularProgreso();
  const todosAprobados = progreso === 100;

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto">
          <button onClick={() => window.history.back()}
            className="text-white/70 text-sm mb-4 flex items-center gap-1 hover:text-white transition">
            ← Regresar
          </button>
          <h1 className="text-white font-extrabold text-xl mb-1">Mis documentos</h1>
          <p className="text-white/70 text-sm">Sube tus documentos para poder trabajar en Fleksi</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Progreso */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          {todosAprobados ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">✅</div>
              <div>
                <p className="font-extrabold text-green-700">¡Documentación completa!</p>
                <p className="text-xs text-gray-400">Tienes el badge de usuario verificado</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-extrabold text-gray-900">Verificación de documentos</p>
                <span className="text-sm font-bold text-purple-600">{progreso}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {listaDocumentos.filter(d => !d.opcional && documentos[d.tipo]?.estado === 'aprobado').length} de {listaDocumentos.filter(d => !d.opcional).length} documentos requeridos aprobados
              </p>
            </div>
          )}
        </div>

        {/* Info general */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <p className="text-sm text-blue-700 font-semibold mb-1">📌 ¿Por qué necesitamos tus documentos?</p>
          <p className="text-xs text-blue-600 font-light leading-relaxed">
            Para garantizar la seguridad de todos los usuarios de Fleksi, verificamos la identidad de cada persona. Tu información está protegida y nunca se comparte con terceros.
          </p>
        </div>

        {/* Lista de documentos */}
        <div className="flex flex-col gap-3 mb-4">
          {listaDocumentos.map((doc) => {
            const docData = documentos[doc.tipo];
            const estado = docData?.estado || 'pendiente';
            const estadoInfo = ESTADOS[estado];
            const estaSubiendo = subiendo === doc.tipo;

            return (
              <div key={doc.tipo}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition ${estado === 'rechazado' ? 'border-red-200' : estado === 'aprobado' ? 'border-green-200' : 'border-gray-100'}`}>

                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${estado === 'aprobado' ? 'bg-green-100' : estado === 'rechazado' ? 'bg-red-100' : estado === 'subido' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    {doc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-gray-900 text-sm">{doc.label}</p>
                      {doc.opcional && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Opcional</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{doc.desc}</p>

                    {doc.reembolso && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                          💰 Se reembolsa en tu {rol === 'empresa' ? '5to contrato' : '5to trabajo'}
                        </span>
                      </div>
                    )}

                    {estado === 'rechazado' && docData?.motivo_rechazo && (
                      <div className="mt-2 bg-red-50 rounded-xl p-2">
                        <p className="text-xs text-red-600 font-semibold">Motivo del rechazo:</p>
                        <p className="text-xs text-red-500">{docData.motivo_rechazo}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                      {estadoInfo.emoji} {estadoInfo.label}
                    </span>

                    {estado !== 'aprobado' && (
                      <button
                        onClick={() => fileRefs.current[doc.tipo]?.click()}
                        disabled={estaSubiendo}
                        className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50">
                        {estaSubiendo ? '⏳ Subiendo...' : estado === 'rechazado' ? '🔄 Reintentar' : estado === 'subido' ? '🔄 Reemplazar' : '⬆️ Subir'}
                      </button>
                    )}

                    <input
                      ref={(el) => { fileRefs.current[doc.tipo] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleFileChange(doc.tipo, e)}
                      className="hidden" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formulario facturación — solo empresas */}
        {rol === 'empresa' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-1">🧾 Datos de facturación</h3>
            <p className="text-xs text-gray-400 mb-4">Necesitamos estos datos para emitirte facturas por los servicios contratados</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Nombre o Razón Social</label>
                <input
                  type="text"
                  placeholder="Ej. Servicios Limpios SA de CV"
                  value={formularioFactura.nombre_fiscal}
                  onChange={(e) => setFormularioFactura(p => ({ ...p, nombre_fiscal: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">RFC</label>
                <input
                  type="text"
                  placeholder="Ej. SLI900101AAA"
                  value={formularioFactura.rfc}
                  onChange={(e) => setFormularioFactura(p => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Dirección fiscal</label>
                <input
                  type="text"
                  placeholder="Calle, número, colonia, CP, ciudad"
                  value={formularioFactura.direccion_fiscal}
                  onChange={(e) => setFormularioFactura(p => ({ ...p, direccion_fiscal: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Régimen fiscal</label>
                <select
                  value={formularioFactura.regimen_fiscal}
                  onChange={(e) => setFormularioFactura(p => ({ ...p, regimen_fiscal: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm bg-white">
                  <option value="">Selecciona tu régimen</option>
                  <option value="601">601 — General de Ley Personas Morales</option>
                  <option value="603">603 — Personas Morales con Fines no Lucrativos</option>
                  <option value="605">605 — Sueldos y Salarios</option>
                  <option value="606">606 — Arrendamiento</option>
                  <option value="607">607 — Régimen de Enajenación o Adquisición de Bienes</option>
                  <option value="608">608 — Demás ingresos</option>
                  <option value="612">612 — Personas Físicas con Actividades Empresariales</option>
                  <option value="616">616 — Sin obligaciones fiscales</option>
                  <option value="621">621 — Incorporación Fiscal</option>
                  <option value="625">625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                  <option value="626">626 — Régimen Simplificado de Confianza</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">Uso de CFDI</label>
                <select
                  value={formularioFactura.uso_cfdi}
                  onChange={(e) => setFormularioFactura(p => ({ ...p, uso_cfdi: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm bg-white">
                  <option value="">Selecciona el uso</option>
                  <option value="G01">G01 — Adquisición de mercancias</option>
                  <option value="G03">G03 — Gastos en general</option>
                  <option value="I01">I01 — Construcciones</option>
                  <option value="I04">I04 — Equipo de computo y accesorios</option>
                  <option value="I08">I08 — Otra maquinaria y equipo</option>
                  <option value="S01">S01 — Sin efectos fiscales</option>
                  <option value="CP01">CP01 — Pagos</option>
                </select>
              </div>

              <button
                onClick={guardarFactura}
                disabled={guardandoFactura}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:opacity-90 transition disabled:opacity-50">
                {guardandoFactura ? 'Guardando...' : facturaGuardada ? '✅ Guardado' : 'Guardar datos de facturación'}
              </button>
            </div>
          </div>
        )}

        {/* Aviso privacidad */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            🔒 Tus documentos están cifrados y almacenados de forma segura. Solo el equipo de Fleksi tiene acceso para verificarlos. Consulta nuestro{' '}
            <span className="text-purple-600 font-semibold cursor-pointer">Aviso de privacidad</span>.
          </p>
        </div>

      </div>

      <Nav activo="perfil" />
    </main>
  );
}
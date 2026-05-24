'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function Verificacion() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificacion, setVerificacion] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ [key: string]: string }>({});

  const ineFrenteRef = useRef<HTMLInputElement>(null);
  const ineReversoRef = useRef<HTMLInputElement>(null);
  const antecedentesRef = useRef<HTMLInputElement>(null);
  const comprobanteRef = useRef<HTMLInputElement>(null);
  const ineRepresentanteRef = useRef<HTMLInputElement>(null);
  const actaRef = useRef<HTMLInputElement>(null);
  const constanciaRef = useRef<HTMLInputElement>(null);

  const getRefs = (campo: string) => {
    const map: { [key: string]: React.RefObject<HTMLInputElement | null> } = {
      ine_frente: ineFrenteRef,
      ine_reverso: ineReversoRef,
      antecedentes: antecedentesRef,
      comprobante_antecedentes: comprobanteRef,
      ine_representante: ineRepresentanteRef,
      acta_constitutiva: actaRef,
      constancia_fiscal: constanciaRef,
    };
    return map[campo];
  };

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: verif } = await supabase
      .from('verificaciones').select('*').eq('usuario_id', user.id).single();

    if (verif) {
      setVerificacion(verif);
      setDocs({
        ine_frente: verif.ine_frente_url || '',
        ine_reverso: verif.ine_reverso_url || '',
        antecedentes: verif.antecedentes_url || '',
        comprobante_antecedentes: verif.comprobante_antecedentes_url || '',
        ine_representante: verif.ine_representante_url || '',
        acta_constitutiva: verif.acta_constitutiva_url || '',
        constancia_fiscal: verif.constancia_fiscal_url || '',
      });
    }

    setCargando(false);
  };

  const subirDocumento = async (campo: string, file: File) => {
    if (!usuario) return;
    setSubiendo(campo);
    try {
      const ext = file.name.split('.').pop();
      const path = `${usuario.id}/${campo}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos-verificacion').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documentos-verificacion').getPublicUrl(path);
      const url = urlData.publicUrl;
      const campoDb = `${campo}_url`;

      if (verificacion) {
        await supabase.from('verificaciones')
          .update({ [campoDb]: url, estado: 'en_revision', updated_at: new Date().toISOString() })
          .eq('id', verificacion.id);
      } else {
        await supabase.from('verificaciones').insert({
          usuario_id: usuario.id,
          tipo_usuario: usuario.rol === 'empresa' ? 'empresa' : 'flekser',
          [campoDb]: url,
          estado: 'en_revision',
        });
      }

      setDocs(prev => ({ ...prev, [campo]: url }));
      await cargarDatos();
    } catch (err: any) {
      alert('Error al subir: ' + err.message);
    } finally {
      setSubiendo(null);
    }
  };

  const estadoInfo = () => {
    if (!verificacion) return null;
    const estados: { [key: string]: { color: string; bg: string; emoji: string; texto: string } } = {
      pendiente: { color: 'text-gray-600', bg: 'bg-gray-50', emoji: '⏳', texto: 'Pendiente de envío' },
      en_revision: { color: 'text-yellow-700', bg: 'bg-yellow-50', emoji: '🔍', texto: 'En revisión — te notificaremos pronto' },
      aprobado: { color: 'text-green-700', bg: 'bg-green-50', emoji: '✅', texto: '¡Verificado! Tu perfil muestra el badge de confianza' },
      rechazado: { color: 'text-red-700', bg: 'bg-red-50', emoji: '❌', texto: 'Rechazado — revisa el motivo y vuelve a subir' },
    };
    return estados[verificacion.estado] || null;
  };

  const DocumentoItem = ({ campo, titulo, descripcion, acepta }: {
    campo: string; titulo: string; descripcion: string; acepta: string;
  }) => {
    const subido = !!docs[campo];
    const estáSubiendo = subiendo === campo;
    const ref = getRefs(campo);

    return (
      <div className={`rounded-xl p-4 border-2 transition ${subido ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{subido ? '✅' : '📄'}</span>
              <p className="font-bold text-gray-900 text-sm">{titulo}</p>
            </div>
            <p className="text-xs text-gray-400 ml-7">{descripcion}</p>
          </div>
          <button onClick={() => ref?.current?.click()}
            disabled={estáSubiendo || verificacion?.estado === 'aprobado'}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 ${
              subido ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            }`}>
            {estáSubiendo ? '⏳' : subido ? 'Cambiar' : 'Subir'}
          </button>
        </div>
        <input ref={ref} type="file" accept={acepta} className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) subirDocumento(campo, file); }}/>
      </div>
    );
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

  const estado = estadoInfo();
  const esEmpresa = usuario?.rol === 'empresa';

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto">
          <a href={esEmpresa ? '/perfil-empresa' : '/perfil'}
            className="flex items-center gap-2 text-white/70 mb-4 hover:text-white transition text-sm">
            ← Regresar
          </a>
          <h1 className="text-white font-extrabold text-xl mb-1">Verificación de identidad</h1>
          <p className="text-white/70 text-sm">Genera confianza con clientes y empresas</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {estado && (
          <div className={`rounded-2xl p-4 mb-4 ${estado.bg}`}>
            <p className={`font-bold text-sm ${estado.color}`}>{estado.emoji} {estado.texto}</p>
            {verificacion?.motivo_rechazo && (
              <p className="text-red-600 text-xs mt-2 font-medium">Motivo: {verificacion.motivo_rechazo}</p>
            )}
          </div>
        )}

        {(!verificacion || verificacion.estado === 'pendiente') && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">¿Por qué verificarte?</h3>
            <div className="flex flex-col gap-2">
              {[
                { emoji: '🔝', texto: 'Apareces primero en los resultados de búsqueda' },
                { emoji: '💰', texto: 'Los clientes prefieren contratar perfiles verificados' },
                { emoji: '✅', texto: 'Badge de confianza visible en tu perfil' },
                { emoji: '🔒', texto: 'Plataforma más segura para todos' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{b.emoji}</span>
                  <p className="text-sm text-gray-600">{b.texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!esEmpresa && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">🪪 Identificación oficial</h3>
            <div className="flex flex-col gap-3">
              <DocumentoItem campo="ine_frente" titulo="INE — Frente" descripcion="Foto clara del frente de tu credencial de elector" acepta="image/*"/>
              <DocumentoItem campo="ine_reverso" titulo="INE — Reverso" descripcion="Foto clara del reverso de tu credencial de elector" acepta="image/*"/>
            </div>
          </div>
        )}

        {!esEmpresa && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-extrabold text-gray-900">📋 Antecedentes no penales</h3>
              <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-1 rounded-full">Reembolsable</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-blue-700 text-xs font-semibold mb-1">💡 ¿Cómo funciona el reembolso?</p>
              <p className="text-blue-600 text-xs leading-relaxed">
                Sube tu comprobante de pago. Al completar tus primeros 5 servicios en Fleksi, te reembolsamos el costo automáticamente. Válido cada 6 meses.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <DocumentoItem campo="antecedentes" titulo="Carta de no antecedentes penales" descripcion="Documento oficial emitido por la autoridad competente" acepta="image/*,application/pdf"/>
              <DocumentoItem campo="comprobante_antecedentes" titulo="Comprobante de pago" descripcion="Recibo o comprobante del trámite para reembolso" acepta="image/*,application/pdf"/>
            </div>
          </div>
        )}

        {esEmpresa && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-extrabold text-gray-900 mb-4">🪪 Representante legal</h3>
              <DocumentoItem campo="ine_representante" titulo="INE del representante legal" descripcion="Foto clara del frente de la credencial del representante" acepta="image/*"/>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-extrabold text-gray-900 mb-4">📑 Documentos empresariales</h3>
              <div className="flex flex-col gap-3">
                <DocumentoItem campo="acta_constitutiva" titulo="Acta constitutiva" descripcion="Primera hoja donde aparece el nombre del representante" acepta="image/*,application/pdf"/>
                <DocumentoItem campo="constancia_fiscal" titulo="Constancia de situación fiscal" descripcion="Requerida para emitir facturas por los servicios" acepta="image/*,application/pdf"/>
              </div>
            </div>
          </>
        )}

        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            🔒 Tus documentos se almacenan de forma segura y encriptada. Solo el equipo de Fleksi tiene acceso para revisión. Nunca compartimos tu información con terceros.
          </p>
        </div>

      </div>

      <Nav activo="perfil" />

    </main>
  );
}
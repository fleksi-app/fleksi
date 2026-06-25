'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const MORADO = '#7B2FE0';

export default function ValorarApp() {
  const [usuario, setUsuario] = useState<any>(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [yaValoro, setYaValoro] = useState(false);

  useEffect(() => { cargarUsuario(); }, []);

  const cargarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('id, nombre, foto_url, rol').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });
    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    const { data: valorPrevio } = await supabase.from('valoraciones_app')
      .select('id').eq('usuario_id', user.id)
      .gte('created_at', hace7dias.toISOString()).limit(1);
    if (valorPrevio && valorPrevio.length > 0) setYaValoro(true);
  };

  const enviar = async () => {
    if (!usuario || enviando) return;
    setEnviando(true);
    try {
      await supabase.from('valoraciones_app').insert({
        usuario_id: usuario.id,
        estrellas,
        comentario: comentario.trim() || null,
        categoria,
        rol: usuario.rol,
      });
      setEnviado(true);
    } catch (e) { console.error(e); }
    finally { setEnviando(false); }
  };

  if (enviado) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl" style={{background: '#F5F0FF'}}>⭐</div>
        <h1 className="font-extrabold text-gray-900 text-xl mb-2">¡Gracias por tu opinión!</h1>
        <p className="text-gray-400 text-sm mb-6">Tu valoración nos ayuda a mejorar Fleksi para todos.</p>
        <a href="/home" className="block w-full py-4 text-white rounded-2xl font-bold" style={{background: MORADO}}>Volver al inicio</a>
      </div>
    </main>
  );

  if (yaValoro) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl" style={{background: '#F5F0FF'}}>✅</div>
        <h1 className="font-extrabold text-gray-900 text-xl mb-2">Ya compartiste tu opinión</h1>
        <p className="text-gray-400 text-sm mb-6">Puedes volver a valorar la app la próxima semana.</p>
        <a href="/home" className="block w-full py-4 text-white rounded-2xl font-bold" style={{background: MORADO}}>Volver al inicio</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-16" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <button onClick={() => window.history.back()} className="text-gray-400 text-sm mb-3 block">← Volver</button>
          <h1 className="font-extrabold text-gray-900 text-xl">⭐ Valora Fleksi</h1>
          <p className="text-gray-400 text-sm mt-1">Tu opinión nos ayuda a mejorar</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-5 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="font-extrabold text-gray-900 mb-4">¿Cómo calificarías tu experiencia con Fleksi?</p>
          <div className="flex justify-center gap-3 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setEstrellas(n)} className="text-4xl transition active:scale-90">
                {n <= estrellas ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            {estrellas === 1 ? 'Muy mala' : estrellas === 2 ? 'Mala' : estrellas === 3 ? 'Regular' : estrellas === 4 ? 'Buena' : 'Excelente'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-900 mb-3 text-sm">¿Sobre qué aspecto quieres opinar?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'general', label: '⚡ General' },
              { id: 'facilidad', label: '📱 Facilidad de uso' },
              { id: 'pagos', label: '💳 Pagos' },
              { id: 'soporte', label: '💬 Soporte' },
              { id: 'fleksers', label: '👤 Calidad de fleksers' },
              { id: 'sugerencia', label: '💡 Sugerencia' },
            ].map(cat => (
              <button key={cat.id} onClick={() => setCategoria(cat.id)}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold transition border-2"
                style={{borderColor: categoria === cat.id ? MORADO : '#E5E7EB', background: categoria === cat.id ? '#F5F0FF' : 'white', color: categoria === cat.id ? MORADO : '#6B7280'}}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-bold text-gray-900 mb-2 text-sm">Cuéntanos más <span className="text-gray-400 font-normal">(opcional)</span></p>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={4}
            placeholder="¿Qué mejorarías? ¿Qué te gustó más? ¿Tienes alguna sugerencia?"
            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-sm resize-none"/>
        </div>

        <button onClick={enviar} disabled={enviando}
          className="w-full py-4 text-white rounded-2xl font-bold text-lg disabled:opacity-50" style={{background: MORADO}}>
          {enviando ? 'Enviando...' : '⭐ Enviar valoración'}
        </button>
      </div>
    </main>
  );
}
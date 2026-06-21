'use client';
import { useState } from 'react';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';
const SOPORTE_EMAIL = 'proveo.dc@gmail.com';
const SOPORTE_WA = 'https://wa.me/5215538850129?text=Hola%20Fleksi%2C%20necesito%20ayuda';

export default function AyudaPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const enviarCorreo = async () => {
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) { setError('Por favor llena todos los campos.'); return; }
    setEnviando(true); setError('');
    try {
      const res = await fetch('/api/ayuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, mensaje }),
      });
      if (res.ok) { setEnviado(true); setNombre(''); setEmail(''); setMensaje(''); }
      else setError('No se pudo enviar. Intenta por WhatsApp.');
    } catch { setError('No se pudo enviar. Intenta por WhatsApp.'); }
    finally { setEnviando(false); }
  };

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
          <h1 className="font-extrabold text-gray-900 text-lg">Ayuda y soporte</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-5 flex flex-col gap-4">

        {/* WhatsApp */}
        <a href={SOPORTE_WA} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl hover:opacity-90 transition active:scale-95">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-green-800">Escríbenos por WhatsApp</p>
            <p className="text-green-700 text-sm mt-0.5">Respuesta rápida · Lun–Sáb 9am–7pm</p>
          </div>
          <span className="text-green-600 font-bold">→</span>
        </a>

        {/* Formulario de correo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 mb-1">Envíanos un mensaje</h2>
          <p className="text-gray-400 text-xs mb-4">Te responderemos en menos de 24 horas</p>

          {enviado ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-extrabold text-gray-900 mb-1">¡Mensaje enviado!</p>
              <p className="text-gray-400 text-sm">Te responderemos pronto.</p>
              <button onClick={() => setEnviado(false)} className="mt-4 text-sm font-bold" style={{color: MORADO}}>Enviar otro mensaje</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {error && <p className="text-red-500 text-xs font-semibold bg-red-50 p-3 rounded-xl">{error}</p>}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tu nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Fernando Nájera"
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm transition bg-gray-50"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tu correo</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm transition bg-gray-50"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">¿En qué podemos ayudarte?</label>
                <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={4}
                  placeholder="Describe tu problema o pregunta..."
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm transition bg-gray-50 resize-none"/>
              </div>
              <button onClick={enviarCorreo} disabled={enviando}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                {enviando ? 'Enviando...' : '✉️ Enviar mensaje'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Fleksi · Irapuato, Guanajuato · México</p>
      </div>

      <Nav activo="" />
    </main>
  );
}
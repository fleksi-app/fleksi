'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Nav({ activo }: { activo: string }) {
  const [rol, setRol] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const obtenerRol = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('usuarios').select('rol').eq('id', user.id).single();
      setRol(data?.rol || 'flekser');
    };
    obtenerRol();
  }, []);

  const esEmpresa = rol === 'empresa';
  const inicio = esEmpresa ? '/home-empresa' : '/home';
  const perfil = esEmpresa ? '/perfil-empresa' : '/perfil';
  const trabajos = esEmpresa ? '/aplicaciones' : '/mis-trabajos';

  const items = [
    { href: inicio, emoji: '🏠', label: 'Inicio', id: 'inicio' },
    { href: trabajos, emoji: '📋', label: 'Trabajos', id: 'trabajos' },
    { href: null, emoji: '➕', label: 'Nuevo', id: 'nuevo' }, // modal
    { href: '/checkin', emoji: '📍', label: 'Check-in', id: 'checkin' },
    { href: '/chat', emoji: '💬', label: 'Mensajes', id: 'chat' },
    { href: perfil, emoji: '👤', label: 'Perfil', id: 'perfil' },
  ];

  return (
    <>
      {/* Modal publicar/buscar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end"
          onClick={() => setMostrarModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 text-center">¿Qué quieres hacer?</h3>
            <div className="flex flex-col gap-3">
              <a href="/publicar"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-extrabold">Publicar solicitud</p>
                  <p className="text-white/70 text-sm font-normal">Necesito que alguien me ayude</p>
                </div>
              </a>
              <a href="/home"
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-extrabold text-gray-900">Buscar trabajo</p>
                  <p className="text-gray-400 text-sm font-normal">Ver trabajos disponibles cerca de ti</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {items.map((item) => {
            const estaActivo = activo === item.id;
            if (item.href === null) {
              return (
                <button key={item.id}
                  onClick={() => setMostrarModal(true)}
                  className="flex flex-col items-center gap-0.5 px-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg -mt-5">
                    <span className="text-white text-2xl font-bold">+</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{item.label}</span>
                </button>
              );
            }
            return (
              <a key={item.id} href={item.href}
                className="flex flex-col items-center gap-0.5 px-2">
                <span className="text-xl">{item.emoji}</span>
                <span className={`text-xs font-semibold ${estaActivo ? 'text-purple-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
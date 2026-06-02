'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const manejarCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Si hay sesión activa, verificar si es recuperación de contraseña
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          window.location.href = '/reset-password';
          return;
        }
        // Si es login normal, redirigir por rol
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('rol_activo, rol')
          .eq('id', session.user.id)
          .single();
        const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
        if (rol === 'empresa') window.location.href = '/home-empresa';
        else if (rol === 'viajero') window.location.href = '/home-viajero';
        else window.location.href = '/home';
      } else {
        window.location.href = '/login';
      }
    };
    manejarCallback();
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-gray-400">Verificando...</p>
      </div>
    </main>
  );
}
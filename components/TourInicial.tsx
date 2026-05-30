'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TourInicial({ rol }: { rol: string }) {
  useEffect(() => {
    const verificarTour = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('usuarios')
          .select('tour_visto')
          .eq('id', user.id)
          .single();

        if (data?.tour_visto) return;

        setTimeout(async () => {
          const { iniciarTour } = await import('@/lib/tour');
          iniciarTour(rol);
        }, 1500);

      } catch (e) {}
    };

    verificarTour();
  }, [rol]);

  return null;
}
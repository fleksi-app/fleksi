import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { supabase } from '@/lib/supabase';

async function marcarTourVisto() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('usuarios').update({ tour_visto: true }).eq('id', user.id);
    }
  } catch (e) {
    console.error('Error marcando tour visto:', e);
  }
}

export function iniciarTour(rol: string) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      classes: 'fleksi-tour',
      scrollTo: { behavior: 'smooth', block: 'center' },
    },
  });

  const esEmpresa = rol === 'empresa';
  const esViajero = rol === 'viajero';

  // Paso 1 — Bienvenida
  tour.addStep({
    id: 'bienvenida',
    text: `
      <div style="text-align:center; padding: 8px 0">
        <div style="font-size:40px; margin-bottom:8px">${esEmpresa ? '🏢' : esViajero ? '✈️' : '⚡'}</div>
        <p style="font-weight:800; font-size:18px; color:#111; margin:0 0 8px">¡Bienvenido a Fleksi!</p>
        <p style="color:#666; font-size:14px; margin:0">Te mostramos cómo funciona en 30 segundos</p>
      </div>
    `,
    buttons: [
      {
        text: 'Saltar',
        classes: 'shepherd-button-secondary',
        action: () => { tour.complete(); marcarTourVisto(); },
      },
      {
        text: 'Empezar →',
        classes: 'shepherd-button-primary',
        action: tour.next,
      },
    ],
  });

  // Paso 2 — Home
  tour.addStep({
    id: 'home',
    text: `
      <p style="font-weight:800; color:#111; margin:0 0 6px">📋 ${esEmpresa ? 'Tus servicios' : 'Trabajos disponibles'}</p>
      <p style="color:#666; font-size:13px; margin:0">${
        esEmpresa
          ? 'Aquí ves todas tus solicitudes publicadas y las propuestas recibidas.'
          : 'Aquí ves todos los trabajos cerca de ti. Toca uno para ver el detalle y aplicar.'
      }</p>
    `,
    attachTo: { element: '.tour-home', on: 'top' },
    buttons: [
      { text: '← Atrás', classes: 'shepherd-button-secondary', action: tour.back },
      { text: 'Siguiente →', classes: 'shepherd-button-primary', action: tour.next },
    ],
  });

  // Paso 3 — Botón +
  tour.addStep({
    id: 'nuevo',
    text: `
      <p style="font-weight:800; color:#111; margin:0 0 6px">➕ Acciones rápidas</p>
      <p style="color:#666; font-size:13px; margin:0">${
        esEmpresa
          ? 'Publica una nueva solicitud, busca fleksers en el catálogo o gestiona tus aplicaciones.'
          : 'Publica lo que necesitas, busca trabajos o gestiona tus aplicaciones y check-in.'
      }</p>
    `,
    attachTo: { element: '.tour-nuevo', on: 'top' },
    buttons: [
      { text: '← Atrás', classes: 'shepherd-button-secondary', action: tour.back },
      { text: 'Siguiente →', classes: 'shepherd-button-primary', action: tour.next },
    ],
  });

  // Paso 4 — Chat
  tour.addStep({
    id: 'chat',
    text: `
      <p style="font-weight:800; color:#111; margin:0 0 6px">💬 Chat</p>
      <p style="color:#666; font-size:13px; margin:0">Comunícate directamente con ${esEmpresa ? 'los fleksers que contrates' : 'tus clientes'}. Rápido y seguro dentro de la app.</p>
    `,
    attachTo: { element: '.tour-chat', on: 'top' },
    buttons: [
      { text: '← Atrás', classes: 'shepherd-button-secondary', action: tour.back },
      { text: 'Siguiente →', classes: 'shepherd-button-primary', action: tour.next },
    ],
  });

  // Paso 5 — Perfil
  tour.addStep({
    id: 'perfil',
    text: `
      <p style="font-weight:800; color:#111; margin:0 0 6px">👤 Tu perfil</p>
      <p style="color:#666; font-size:13px; margin:0">Completa tu perfil, sube documentos y verifica tu identidad para generar más confianza y aparecer primero.</p>
    `,
    attachTo: { element: '.tour-perfil', on: 'top' },
    buttons: [
      { text: '← Atrás', classes: 'shepherd-button-secondary', action: tour.back },
      { text: 'Siguiente →', classes: 'shepherd-button-primary', action: tour.next },
    ],
  });

  // Paso 6 — Notificaciones
  tour.addStep({
    id: 'notificaciones',
    text: `
      <p style="font-weight:800; color:#111; margin:0 0 6px">🔔 Notificaciones</p>
      <p style="color:#666; font-size:13px; margin:0">Aquí te avisamos cuando ${esEmpresa ? 'alguien aplica a tu solicitud' : 'aceptan tu propuesta o tienes un nuevo trabajo'}.</p>
    `,
    attachTo: { element: '.tour-notifs', on: 'bottom' },
    buttons: [
      { text: '← Atrás', classes: 'shepherd-button-secondary', action: tour.back },
      { text: 'Siguiente →', classes: 'shepherd-button-primary', action: tour.next },
    ],
  });

  // Paso 7 — Fin
  tour.addStep({
    id: 'fin',
    text: `
      <div style="text-align:center; padding: 8px 0">
        <div style="font-size:40px; margin-bottom:8px">🚀</div>
        <p style="font-weight:800; font-size:18px; color:#111; margin:0 0 8px">¡Listo para empezar!</p>
        <p style="color:#666; font-size:14px; margin:0">${
          esEmpresa
            ? 'Publica tu primera solicitud y recibe propuestas en minutos.'
            : 'Completa tu perfil y aplica a tu primer trabajo hoy mismo.'
        }</p>
      </div>
    `,
    buttons: [
      {
        text: '¡Empezar! ✨',
        classes: 'shepherd-button-primary',
        action: () => { tour.complete(); marcarTourVisto(); },
      },
    ],
  });

  // Marcar como visto cuando se cancela con la X
  tour.on('cancel', () => { marcarTourVisto(); });
  tour.on('complete', () => { marcarTourVisto(); });

  tour.start();
  return tour;
}
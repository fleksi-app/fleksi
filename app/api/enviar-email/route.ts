import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { tipo, destinatario, datos } = await request.json();

    let asunto = '';
    let html = '';

    if (tipo === 'bienvenida') {
      const esCliente = datos.rol === 'cliente' || datos.rol === 'empresa';
      const emoji = datos.rol === 'prestador' ? '👷' : datos.rol === 'empresa' ? '🏢' : datos.rol === 'viajero' ? '✈️' : '🙋';
      const cta_url = esCliente ? 'https://fleksi.vercel.app/home-cliente' : 'https://fleksi.vercel.app/home';
      const cta_texto = esCliente ? 'Buscar prestadores →' : 'Ver trabajos disponibles →';
      const mensaje = esCliente
        ? 'Ya puedes publicar servicios y encontrar al profesional perfecto para lo que necesitas.'
        : 'Ya puedes ver trabajos disponibles, aplicar y empezar a ganar dinero.';

      asunto = `¡Bienvenido a Fleksi, ${datos.nombre}! 🎉`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 32px 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">fleksi</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Tu trabajo, tus reglas.</p>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 56px; margin-bottom: 12px;">${emoji}</div>
            <h2 style="color: #0D0D1A; margin: 0; font-size: 22px;">¡Hola, ${datos.nombre}! 👋</h2>
            <p style="color: #64748B; margin-top: 8px;">Tu cuenta fue creada exitosamente.</p>
          </div>

          <div style="background: #F8F9FC; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #0D0D1A; font-weight: bold; margin: 0 0 8px;">¿Qué sigue?</p>
            <p style="color: #64748B; margin: 0; font-size: 15px;">${mensaje}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="color: #0D0D1A; font-weight: bold; margin-bottom: 12px;">Con Fleksi puedes:</p>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <span style="font-size: 20px;">⚡</span>
              <span style="color: #64748B;">Conectarte en minutos con quien necesitas</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <span style="font-size: 20px;">🛡️</span>
              <span style="color: #64748B;">Pagos seguros con Fleksi Protege</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">⭐</span>
              <span style="color: #64748B;">Sistema de reputación y badges</span>
            </div>
          </div>

          <a href="${cta_url}"
             style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            ${cta_texto}
          </a>

          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades en México y LATAM
          </p>
        </div>
      `;
    }

    if (tipo === 'nueva_aplicacion') {
      asunto = `Nueva aplicación recibida — ${datos.trabajo}`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tu trabajo, tus reglas.</p>
          </div>
          <h2 style="color: #0D0D1A;">¡Tienes una nueva aplicación! 🎉</h2>
          <p style="color: #64748B;">Hola <strong>${datos.cliente}</strong>,</p>
          <p style="color: #64748B;"><strong>${datos.prestador}</strong> ha aplicado a tu publicación:</p>
          <div style="background: #F8F9FC; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #0D0D1A;">${datos.trabajo}</p>
            <p style="margin: 8px 0 0; color: #7C3AED; font-weight: bold;">Precio ofrecido: $${datos.precio} MXN</p>
          </div>
          <a href="https://fleksi.vercel.app/aplicaciones"
             style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver aplicación →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;
    }

    if (tipo === 'aplicacion_aceptada') {
      asunto = `¡Tu aplicación fue aceptada! 🎉 — ${datos.trabajo}`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tu trabajo, tus reglas.</p>
          </div>
          <h2 style="color: #0D0D1A;">¡Felicidades, fuiste seleccionado! ✅</h2>
          <p style="color: #64748B;">Hola <strong>${datos.prestador}</strong>,</p>
          <p style="color: #64748B;"><strong>${datos.cliente}</strong> aceptó tu aplicación para:</p>
          <div style="background: #F0FFF4; border: 2px solid #86EFAC; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #0D0D1A;">${datos.trabajo}</p>
            <p style="margin: 8px 0 0; color: #16A34A; font-weight: bold;">💰 Pago: $${datos.precio} MXN</p>
            <p style="margin: 4px 0 0; color: #64748B;">📅 ${datos.fecha}</p>
          </div>
          <a href="https://fleksi.vercel.app/checkin"
             style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver mi turno →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;
    }

    if (tipo === 'pago_completado') {
      asunto = `Pago procesado — $${datos.monto} MXN 💰`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tu trabajo, tus reglas.</p>
          </div>
          <h2 style="color: #0D0D1A;">¡Pago procesado exitosamente! 💰</h2>
          <p style="color: #64748B;">Hola <strong>${datos.nombre}</strong>,</p>
          <p style="color: #64748B;">El pago por el servicio <strong>${datos.trabajo}</strong> fue procesado.</p>
          <div style="background: #F8F9FC; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Servicio</span>
              <span style="font-weight: bold;">$${datos.presupuesto} MXN</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Fleksi Protege</span>
              <span style="font-weight: bold;">$45 MXN</span>
            </div>
            <div style="border-top: 1px solid #E2E8F0; padding-top: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold;">Total</span>
              <span style="font-weight: bold; color: #7C3AED;">$${datos.monto} MXN</span>
            </div>
          </div>
          <a href="https://fleksi.vercel.app/mis-trabajos"
             style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver mis trabajos →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'Fleksi <onboarding@resend.dev>',
      to: destinatario,
      subject: asunto,
      html,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
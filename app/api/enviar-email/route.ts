import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function crearNotificacion(usuario_id: string, tipo: string, titulo: string, mensaje: string, link: string) {
  try {
    await supabaseAdmin.from('notificaciones').insert({
      usuario_id, tipo, titulo, mensaje, link,
    });
  } catch (e) {
    console.error('Error creando notificacion:', e);
  }
}

async function enviarPush(usuario_id: string, titulo: string, mensaje: string, link: string) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:fernando.najera.nm@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const { data: suscripciones } = await supabaseAdmin
      .from('push_suscripciones')
      .select('*')
      .eq('usuario_id', usuario_id);

    if (!suscripciones || suscripciones.length === 0) return;

    const payload = JSON.stringify({ titulo, mensaje, link });

    await Promise.allSettled(
      suscripciones.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('push_suscripciones').delete().eq('id', sub.id);
          }
        }
      })
    );
  } catch (e) {
    console.log('Push no enviado:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tipo, destinatario, datos } = await request.json();

    let asunto = '';
    let html = '';

    if (tipo === 'bienvenida') {
      const esCliente = datos.rol === 'cliente' || datos.rol === 'empresa';
      const emoji = datos.rol === 'prestador' ? '👷' : datos.rol === 'empresa' ? '🏢' : datos.rol === 'viajero' ? '✈️' : '🙋';
      const cta_url = esCliente ? 'https://fleksi.vercel.app/home-empresa' : 'https://fleksi.vercel.app/home';
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
          <a href="${cta_url}" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            ${cta_texto}
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades en México y LATAM
          </p>
        </div>
      `;

      if (datos.usuario_id) {
        await crearNotificacion(datos.usuario_id, 'nuevo_trabajo', `¡Bienvenido a Fleksi, ${datos.nombre}! 🎉`, 'Tu cuenta fue creada exitosamente. ¡Empieza a explorar!', '/home');
        await enviarPush(datos.usuario_id, `¡Bienvenido a Fleksi, ${datos.nombre}! 🎉`, 'Tu cuenta fue creada exitosamente.', '/home');
      }
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
          <a href="https://fleksi.vercel.app/aplicaciones" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver aplicación →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;

      if (datos.cliente_id) {
        await crearNotificacion(datos.cliente_id, 'nueva_aplicacion', `Nueva aplicación de ${datos.prestador}`, `Aplicó a tu solicitud: ${datos.trabajo} — $${datos.precio} MXN`, `/aplicaciones?servicio=${datos.servicio_id}`);
        await enviarPush(datos.cliente_id, `✋ Nueva aplicación de ${datos.prestador}`, `${datos.trabajo} — $${datos.precio} MXN`, `/aplicaciones?servicio=${datos.servicio_id}`);
      }
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
          <a href="https://fleksi.vercel.app/checkin" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver mi turno →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;

      if (datos.prestador_id) {
        await crearNotificacion(datos.prestador_id, 'aplicacion_aceptada', `¡Tu aplicación fue aceptada! 🎉`, `${datos.cliente} te contrató para: ${datos.trabajo} — $${datos.precio} MXN`, '/checkin');
        await enviarPush(datos.prestador_id, `✅ ¡Aplicación aceptada!`, `${datos.cliente} te contrató para: ${datos.trabajo}`, '/checkin');
      }
    }

    if (tipo === 'trabajo_terminado') {
      asunto = `${datos.prestador} terminó el trabajo — Confirma para liberar el pago`;
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tu trabajo, tus reglas.</p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
            <h2 style="color: #0D0D1A; margin: 0;">¡Trabajo completado!</h2>
            <p style="color: #64748B; margin-top: 8px;"><strong>${datos.prestador}</strong> terminó el trabajo.</p>
          </div>
          <div style="background: #F0FFF4; border: 2px solid #86EFAC; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #0D0D1A;">${datos.trabajo}</p>
            <p style="margin: 8px 0 0; color: #16A34A; font-size: 14px;">El pago está retenido y listo para liberarse.</p>
          </div>
          <div style="background: #FFF7ED; border: 2px solid #FED7AA; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="color: #C2410C; font-weight: bold; margin: 0 0 8px;">⏳ Acción requerida</p>
            <p style="color: #64748B; margin: 0; font-size: 14px;">Confirma que el trabajo quedó bien para liberar el pago al prestador.</p>
          </div>
          <a href="https://fleksi.vercel.app/aplicaciones" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 20px;">
            🎉 Confirmar y liberar pago →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;

      if (datos.cliente_id) {
        await crearNotificacion(datos.cliente_id, 'trabajo_completado', `${datos.prestador} terminó el trabajo 🎉`, `Confirma que quedó bien para liberar el pago: ${datos.trabajo}`, `/aplicaciones?servicio=${datos.servicio_id}`);
        await enviarPush(datos.cliente_id, `🎉 ${datos.prestador} terminó el trabajo`, `Confirma para liberar el pago: ${datos.trabajo}`, `/aplicaciones?servicio=${datos.servicio_id}`);
      }
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
            <div style="border-top: 1px solid #E2E8F0; padding-top: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold;">Total</span>
              <span style="font-weight: bold; color: #7C3AED;">$${datos.monto} MXN</span>
            </div>
          </div>
          <a href="https://fleksi.vercel.app/mis-trabajos" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Ver mis trabajos →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center; margin-top: 20px;">
            Fleksi — Conectando talento con oportunidades
          </p>
        </div>
      `;

      if (datos.prestador_id) {
        await crearNotificacion(datos.prestador_id, 'pago_liberado', `¡Pago liberado! 💰`, `Recibiste $${datos.monto} MXN por: ${datos.trabajo}`, '/mis-trabajos');
        await enviarPush(datos.prestador_id, `💰 ¡Pago liberado!`, `Recibiste $${datos.monto} MXN por: ${datos.trabajo}`, '/mis-trabajos');
      }
    }

    if (tipo === 'verificacion_aprobada') {
      asunto = '¡Tu identidad fue verificada en Fleksi! ✅';
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 56px; margin-bottom: 12px;">✅</div>
            <h2 style="color: #0D0D1A; margin: 0;">¡Felicidades, ${datos.nombre}!</h2>
            <p style="color: #64748B; margin-top: 8px;">Tu identidad ha sido verificada exitosamente.</p>
          </div>
          <a href="https://fleksi.vercel.app/perfil" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            Ver mi perfil verificado →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center;">
            Fleksi — Conectando talento con oportunidades en México y LATAM
          </p>
        </div>
      `;

      if (datos.usuario_id) {
        await crearNotificacion(datos.usuario_id, 'aplicacion_aceptada', '¡Identidad verificada! ✅', 'Tu perfil ahora muestra el badge de confianza', '/perfil');
        await enviarPush(datos.usuario_id, '✅ ¡Identidad verificada!', 'Tu perfil ahora muestra el badge de confianza', '/perfil');
      }
    }

    if (tipo === 'verificacion_rechazada') {
      asunto = 'Actualización sobre tu verificación en Fleksi';
      html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">fleksi</h1>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 56px; margin-bottom: 12px;">📋</div>
            <h2 style="color: #0D0D1A; margin: 0;">Hola, ${datos.nombre}</h2>
            <p style="color: #64748B; margin-top: 8px;">Necesitamos que actualices tus documentos.</p>
          </div>
          <div style="background: #FEF2F2; border: 2px solid #FECACA; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #DC2626; font-weight: bold; margin: 0 0 8px;">📝 Motivo:</p>
            <p style="color: #64748B; margin: 0;">${datos.motivo}</p>
          </div>
          <a href="https://fleksi.vercel.app/verificacion" style="display: block; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            Actualizar documentos →
          </a>
          <p style="color: #64748B; font-size: 12px; text-align: center;">
            Fleksi — Conectando talento con oportunidades en México y LATAM
          </p>
        </div>
      `;

      if (datos.usuario_id) {
        await crearNotificacion(datos.usuario_id, 'aplicacion_rechazada', 'Verificación rechazada', `Motivo: ${datos.motivo}`, '/verificacion');
        await enviarPush(datos.usuario_id, '❌ Verificación rechazada', `Motivo: ${datos.motivo}`, '/verificacion');
      }
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
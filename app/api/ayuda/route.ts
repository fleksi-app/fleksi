import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, mensaje } = await req.json();
    if (!nombre || !email || !mensaje) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return NextResponse.json({ error: 'Sin API key' }, { status: 500 });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Fleksi Soporte <noreply@fleksi.app>',
        to: ['proveo.dc@gmail.com'],
        reply_to: email,
        subject: `Ayuda Fleksi — ${nombre}`,
        html: `
          <h2>Nuevo mensaje de soporte</h2>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${mensaje.replace(/\n/g, '<br/>')}</p>
        `,
      }),
    });

    if (!res.ok) return NextResponse.json({ error: 'Error al enviar' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { evaluarCancelacion, calcularPenalizacion } from '@/lib/cancelaciones';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Validar sesión
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { servicioId } = await request.json();
    if (!servicioId) return NextResponse.json({ error: 'Falta servicioId' }, { status: 400 });

    // Cargar el servicio y la aplicación aceptada (si existe)
    const { data: servicio, error: errServicio } = await supabaseAdmin
      .from('servicios')
      .select('*, aplicaciones(*)')
      .eq('id', servicioId)
      .single();

    if (errServicio || !servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const appAceptada = (servicio.aplicaciones || []).find(
      (a: any) => a.estado === 'aceptado' || a.estado === 'completado'
    );

    const esCliente = servicio.cliente_id === user.id;
    const esFlekser = appAceptada && appAceptada.prestador_id === user.id;

    if (!esCliente && !esFlekser) {
      return NextResponse.json({ error: 'No tienes permiso para cancelar este servicio' }, { status: 403 });
    }

    if (['cancelado', 'pagado', 'completado'].includes(servicio.estado)) {
      return NextResponse.json({ error: 'Este servicio ya no se puede cancelar' }, { status: 400 });
    }

    // ── CASO 1: no hay Flekser aceptado todavía ──
    // Cancelación libre, sin penalización. Solo el cliente puede estar en este caso.
    if (!appAceptada) {
      if (!esCliente) {
        return NextResponse.json({ error: 'No tienes permiso para cancelar este servicio' }, { status: 403 });
      }

      await supabaseAdmin.from('aplicaciones')
        .update({ estado: 'rechazado' })
        .eq('servicio_id', servicioId)
        .eq('estado', 'pendiente');

      await supabaseAdmin.from('servicios').update({ estado: 'cancelado' }).eq('id', servicioId);

      // Notificar a todos los que habían aplicado
      const pendientes = (servicio.aplicaciones || []).filter((a: any) => a.estado === 'pendiente' || a.estado === 'rechazado');
      const notifs = pendientes.map((a: any) => ({
        usuario_id: a.prestador_id,
        tipo: 'solicitud_cancelada',
        titulo: '❌ Solicitud cancelada',
        mensaje: `El cliente canceló la solicitud "${servicio.titulo}". Ya no está disponible.`,
        link: '/home',
      }));
      if (notifs.length > 0) {
        await supabaseAdmin.from('notificaciones').insert(notifs);
      }

      return NextResponse.json({ ok: true, penalizacion: false, caso: 'sin_flekser' });
    }

    // ── CASO 2: ya hay Flekser aceptado ──
    const precio = appAceptada.precio_ofrecido || servicio.presupuesto || 0;
    const evaluacion = evaluarCancelacion(servicio.fecha, servicio.hora);
    const penalizacion = evaluacion.aplicaPenalizacion ? calcularPenalizacion(precio) : 0;
    const esStripe = servicio.metodo_pago === 'stripe' && appAceptada.payment_intent_id;

    // Marcar como cancelado
    await supabaseAdmin.from('aplicaciones').update({ estado: 'cancelado' }).eq('id', appAceptada.id);
    await supabaseAdmin.from('servicios').update({ estado: 'cancelado' }).eq('id', servicioId);

    if (esCliente) {
      // ── Cancela el CLIENTE ──
      if (penalizacion > 0) {
        // 15% del monto va al wallet del Flekser
        const { data: flekserData } = await supabaseAdmin.from('usuarios').select('wallet_saldo').eq('id', appAceptada.prestador_id).single();
        const saldoFlekser = flekserData?.wallet_saldo || 0;
        await supabaseAdmin.from('usuarios').update({ wallet_saldo: saldoFlekser + penalizacion }).eq('id', appAceptada.prestador_id);
        await supabaseAdmin.from('wallet_movimientos').insert({
          usuario_id: appAceptada.prestador_id,
          tipo: 'penalizacion_cancelacion',
          monto: penalizacion,
          descripcion: `Compensación por cancelación del cliente — ${servicio.titulo}`,
          servicio_id: servicioId,
        });

        await supabaseAdmin.from('notificaciones').insert({
          usuario_id: appAceptada.prestador_id,
          tipo: 'servicio_cancelado',
          titulo: '❌ El cliente canceló el servicio',
          mensaje: `"${servicio.titulo}" fue cancelado por el cliente. Recibiste $${penalizacion} MXN de compensación en tu wallet.`,
          link: '/wallet',
        });
      } else {
        await supabaseAdmin.from('notificaciones').insert({
          usuario_id: appAceptada.prestador_id,
          tipo: 'servicio_cancelado',
          titulo: '❌ El cliente canceló el servicio',
          mensaje: `"${servicio.titulo}" fue cancelado por el cliente sin penalización (cancelado con más de 24h de anticipación).`,
          link: '/home',
        });
      }

      // Reembolsar al cliente lo correspondiente (si pagó con Stripe)
      if (esStripe) {
        try {
          await stripe.refunds.create({ payment_intent: appAceptada.payment_intent_id });
        } catch (e) {
          console.error('Error al reembolsar PaymentIntent:', e);
        }
      }
    } else {
      // ── Cancela el FLEKSER ──
      const montoCliente = appAceptada.monto_cliente || precio;

      // Reembolso completo al cliente
      if (esStripe) {
        try {
          await stripe.refunds.create({ payment_intent: appAceptada.payment_intent_id });
        } catch (e) {
          console.error('Error al reembolsar PaymentIntent:', e);
        }
      } else {
        // Si no fue Stripe (efectivo), se devuelve como saldo en wallet
        const { data: clienteData } = await supabaseAdmin.from('usuarios').select('wallet_saldo').eq('id', servicio.cliente_id).single();
        const saldoCliente = clienteData?.wallet_saldo || 0;
        await supabaseAdmin.from('usuarios').update({ wallet_saldo: saldoCliente + montoCliente }).eq('id', servicio.cliente_id);
        await supabaseAdmin.from('wallet_movimientos').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'reembolso_cancelacion',
          monto: montoCliente,
          descripcion: `Reembolso por cancelación del flekser — ${servicio.titulo}`,
          servicio_id: servicioId,
        });
      }

      if (penalizacion > 0) {
        // 15% extra de crédito en wallet del cliente
        const { data: clienteData2 } = await supabaseAdmin.from('usuarios').select('wallet_saldo').eq('id', servicio.cliente_id).single();
        const saldoCliente2 = clienteData2?.wallet_saldo || 0;
        await supabaseAdmin.from('usuarios').update({ wallet_saldo: saldoCliente2 + penalizacion }).eq('id', servicio.cliente_id);
        await supabaseAdmin.from('wallet_movimientos').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'penalizacion_cancelacion',
          monto: penalizacion,
          descripcion: `Crédito por cancelación del flekser — ${servicio.titulo}`,
          servicio_id: servicioId,
        });

        await supabaseAdmin.from('notificaciones').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'servicio_cancelado',
          titulo: '❌ El flekser canceló el servicio',
          mensaje: `"${servicio.titulo}" fue cancelado por el flekser. Tu pago fue reembolsado y recibiste $${penalizacion} MXN de crédito extra en tu wallet.`,
          link: '/wallet',
        });
      } else {
        await supabaseAdmin.from('notificaciones').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'servicio_cancelado',
          titulo: '❌ El flekser canceló el servicio',
          mensaje: `"${servicio.titulo}" fue cancelado por el flekser. Tu pago fue reembolsado por completo.`,
          link: '/mis-trabajos',
        });
      }
    }

    return NextResponse.json({ ok: true, penalizacion, caso: esCliente ? 'cliente_cancela' : 'flekser_cancela' });
  } catch (error: any) {
    console.error('Error en cancelar-servicio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
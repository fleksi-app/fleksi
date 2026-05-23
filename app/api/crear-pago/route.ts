import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { monto, descripcion, servicioId, clienteEmail } = await request.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: monto * 100,
      currency: 'mxn',
      description: descripcion,
      metadata: {
        servicio_id: servicioId,
      },
      receipt_email: clienteEmail,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
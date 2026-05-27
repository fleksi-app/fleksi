import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, rol')
        .eq('id', user.id)
        .single();

      if (!usuario) {
        // Usuario nuevo con provider social — va a registro a completar perfil
        return NextResponse.redirect(`${requestUrl.origin}/registro?social=true`);
      }

      // Ya tiene cuenta — redirigir por rol
      const rol = usuario.rol || 'flekser';
      if (rol === 'empresa') return NextResponse.redirect(`${requestUrl.origin}/home-empresa`);
      if (rol === 'viajero') return NextResponse.redirect(`${requestUrl.origin}/home-viajero`);
      return NextResponse.redirect(`${requestUrl.origin}/home`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
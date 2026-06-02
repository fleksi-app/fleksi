import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  // Recuperación de contraseña — redirigir a reset-password
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: usuario } = await supabase
        .from('usuarios').select('id, rol, rol_activo').eq('id', user.id).single();

      if (!usuario) {
        return NextResponse.redirect(`${requestUrl.origin}/registro?social=true`);
      }

      const rol = usuario.rol_activo || usuario.rol || 'flekser';
      if (rol === 'empresa') return NextResponse.redirect(`${requestUrl.origin}/home-empresa`);
      if (rol === 'viajero') return NextResponse.redirect(`${requestUrl.origin}/home-viajero`);
      return NextResponse.redirect(`${requestUrl.origin}/home`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
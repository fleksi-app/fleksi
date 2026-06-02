import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token_hash = requestUrl.searchParams.get('token_hash');

  // Recuperación de contraseña
  if (type === 'recovery' && token_hash) {
    return NextResponse.redirect(
      `${requestUrl.origin}/reset-password?token_hash=${token_hash}&type=recovery`
    );
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
        await supabase.from('usuarios').insert({
          id: user.id,
          nombre: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          foto_url: user.user_metadata?.avatar_url || null,
          rol: 'flekser',
          rol_activo: 'flekser',
          roles: ['flekser'],
          modo_viajero: false,
        });
        return NextResponse.redirect(`${requestUrl.origin}/onboarding?rol=flekser&social=true`);
      }

      const rol = usuario.rol_activo || usuario.rol || 'flekser';
      if (rol === 'empresa') return NextResponse.redirect(`${requestUrl.origin}/home-empresa`);
      if (rol === 'viajero') return NextResponse.redirect(`${requestUrl.origin}/home-viajero`);
      return NextResponse.redirect(`${requestUrl.origin}/home`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
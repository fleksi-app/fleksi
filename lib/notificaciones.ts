import { supabase } from '@/lib/supabase';

/**
 * Llama al endpoint /api/enviar-email incluyendo el token de sesión del
 * usuario actual en el header Authorization. Sin este header, el endpoint
 * responde 401 y NO se crea la notificación in-app, ni el push, ni el correo.
 *
 * Esta función nunca lanza error hacia arriba: si falla, solo se registra
 * en consola, para no romper el flujo principal (aplicar, pagar, etc.)
 */
export async function notificarEvento(tipo: string, destinatario: string, datos: Record<string, any>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    const res = await fetch('/api/enviar-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tipo, destinatario, datos }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('notificarEvento: respuesta no OK', tipo, res.status, body);
    }
    return res;
  } catch (e) {
    console.warn('notificarEvento: error de red', tipo, e);
    return null;
  }
}
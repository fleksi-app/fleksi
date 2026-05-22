'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomeEmpresa() {
  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [stats, setStats] = useState({ activos: 0, completados: 0, prestadores: 0, gasto: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();

    if (perfil?.rol !== 'empresa') { window.location.href = '/home'; return; }
    setUsuario(perfil);

    // Cargar servicios de la empresa
    const { data: serviciosData } = await supabase
      .from('servicios')
      .select('*, aplicaciones(id, estado, precio_ofrecido, prestador_id, usuarios!aplicaciones_prestador_id_fkey(nombre, foto_url, calificacion))')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });

    setServicios(serviciosData || []);

    // Calcular stats
    const todos = serviciosData || [];
    const activos = todos.filter(s => ['publicado', 'en_proceso'].includes(s.estado)).length;
    const completados = todos.filter(s => s.estado === 'completado').length;
    const prestadoresSet = new Set(
      todos.flatMap(s => (s.aplicaciones || [])
        .filter((a: any) => a.estado === 'aceptado' || a.estado === 'completado')
        .map((a: any) => a.prestador_id))
    );
    const gasto = todos
      .filter(s => s.estado === 'completado')
      .reduce((acc: number, s: any) => acc + (s.presupuesto || 0), 0);

    setStats({ activos, completados, prestadores: prestadoresSet.size, gasto });
    setCargando(false);
  };

  const estadoColor = (estado: string) => {
    const colores: { [key: string]: string } = {
      publicado: 'bg-blue-100 text-blue-600',
      en_proceso: 'bg-yellow-100 text-yellow-600',
      completado: 'bg-green-100 text-green-600',
      cancelado: 'bg-red-100 text-red-600',
    };
    return colores[estado] || 'bg-gray-100 text-gray-600';
  };

  const estadoLabel = (estado: string) => {
    const labels: { [key: string]: string } = {
      publicado: 'Publicado',
      en_proceso: 'En proceso',
      completado: 'Completado',
      cancelado: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando panel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-white/70 text-sm font-medium">Panel empresarial</p>
              <h1 className="text-white font-extrabold text-2xl">{usuario?.nombre}</h1>
            </div>
            <a href="/perfil-empresa"
              className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white text-lg">
              🏢
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-3xl font-extrabold text-blue-600">{stats.activos}</p>
            <p className="text-xs text-gray-400 mt-1">Servicios activos</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-3xl font-extrabold text-purple-600">{stats.prestadores}</p>
            <p className="text-xs text-gray-400 mt-1">Prestadores contratados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-3xl font-extrabold text-green-600">{stats.completados}</p>
            <p className="text-xs text-gray-400 mt-1">Trabajos completados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-3xl font-extrabold text-gray-900">${stats.gasto.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Gasto total MXN</p>
          </div>
        </div>

        {/* Botón publicar */}
        <a href="/publicar"
          className="flex items-center justify-between w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-5 mb-4 shadow-lg hover:opacity-90 transition">
          <div>
            <p className="font-extrabold text-lg">Publicar nuevo servicio</p>
            <p className="text-white/70 text-sm">Encuentra al prestador ideal</p>
          </div>
          <span className="text-3xl">+</span>
        </a>

        {/* Lista de servicios */}
        <div className="mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Mis servicios</h2>

          {servicios.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-bold text-gray-900 mb-1">Sin servicios publicados</p>
              <p className="text-gray-400 text-sm">Publica tu primer servicio para encontrar talento</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {servicios.map((servicio) => {
                const aplicacionesAceptadas = (servicio.aplicaciones || []).filter(
                  (a: any) => a.estado === 'aceptado' || a.estado === 'completado'
                );
                const aplicacionesPendientes = (servicio.aplicaciones || []).filter(
                  (a: any) => a.estado === 'pendiente'
                );

                return (
                  <div key={servicio.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-3">
                        <h3 className="font-extrabold text-gray-900 mb-1">{servicio.titulo}</h3>
                        <p className="text-xs text-gray-400">📅 {servicio.fecha} {servicio.hora?.slice(0,5)}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${estadoColor(servicio.estado)}`}>
                        {estadoLabel(servicio.estado)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-purple-600 font-extrabold">${servicio.presupuesto} MXN</span>
                      <span className="text-xs text-gray-400">{servicio.categoria}</span>
                    </div>

                    {/* Prestadores aceptados */}
                    {aplicacionesAceptadas.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold text-green-700 mb-2">✅ Prestadores contratados</p>
                        <div className="flex flex-col gap-2">
                          {aplicacionesAceptadas.map((app: any) => (
                            <div key={app.id} className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                {app.usuarios?.foto_url ? (
                                  <img src={app.usuarios.foto_url} className="w-full h-full object-cover rounded-full"/>
                                ) : (
                                  <span className="text-white text-xs font-bold">
                                    {app.usuarios?.nombre?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{app.usuarios?.nombre}</span>
                              <span className="text-xs text-yellow-500 ml-auto">⭐ {app.usuarios?.calificacion || '5.0'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aplicaciones pendientes */}
                    {aplicacionesPendientes.length > 0 && (
                      <div className="bg-yellow-50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold text-yellow-700">
                          ⏳ {aplicacionesPendientes.length} aplicación{aplicacionesPendientes.length !== 1 ? 'es' : ''} pendiente{aplicacionesPendientes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {aplicacionesPendientes.length > 0 && (
                        <a href={`/aplicaciones?servicio=${servicio.id}`}
                          className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm text-center">
                          Ver aplicaciones
                        </a>
                      )}
                      <a href={`/trabajo?id=${servicio.id}`}
                        className="flex-1 py-2 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm text-center hover:border-purple-400 transition">
                        Ver detalle
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <a href="/home-empresa" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold text-purple-600">Inicio</span>
          </a>
          <a href="/publicar" className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Publicar</span>
          </a>
          <a href="/aplicaciones" className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Aplicaciones</span>
          </a>
          <a href="/chat" className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs text-gray-400">Mensajes</span>
          </a>
          <a href="/perfil-empresa" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏢</span>
            <span className="text-xs text-gray-400">Mi empresa</span>
          </a>
        </div>
      </div>

    </main>
  );
}
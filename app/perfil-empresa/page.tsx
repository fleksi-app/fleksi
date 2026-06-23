'use client';
import { useEffect } from 'react';

export default function PerfilEmpresaRedirect() {
  useEffect(() => {
    window.location.replace('/perfil');
  }, []);
  return null;
}
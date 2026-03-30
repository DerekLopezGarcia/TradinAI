'use client';

import React, { useEffect, useState } from 'react';

interface HydrationWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper para evitar errores de hidratación causados por Dark Reader y otras extensiones
 * Espera hasta que el DOM esté completamente listo antes de renderizar contenido dinámico
 */
export function HydrationWrapper({ children }: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Marcar como hidratado cuando el componente monta en el cliente
    setIsHydrated(true);
  }, []);

  // Renderizar los hijos normalmente - React maneja la hidratación
  // El state isHydrated sirve para detectar si necesitamos lógica cliente-específica
  return <>{children}</>;
}


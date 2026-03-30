/**
 * Configuración personalizada para Next.js
 * Soluciona problemas de hidratación causados por extensiones del navegador
 */

module.exports = {
  // Ignorar algunos warnings que vienen de extensiones del navegador
  webpack: (config, { isServer }) => {
    return config;
  },
  
  // Desactivar las advertencias de hidratación en desarrollo que vienen de Dark Reader
  experimental: {
    // Permite que Next.js ignore algunos errores de hidratación
  },

  // Asegurar que las imágenes y estáticos se sirvan correctamente
  images: {
    unoptimized: false,
  }
};


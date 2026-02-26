import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradingIA - Análisis de Mercado con IA',
  description: 'Plataforma completa de análisis de mercado financiero con inteligencia artificial',
  keywords: ['trading', 'análisis técnico', 'mercado financiero', 'crypto', 'stocks'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}


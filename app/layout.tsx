import type { Metadata } from 'next';
import './globals.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ThemeProvider } from '@/components/theme-provider';
import { WidgetsDnDProvider } from '@/components/WidgetsDnDProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TradinAI - Análisis de Mercado con IA',
  description: 'Plataforma de análisis de mercado financiero con inteligencia artificial',
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
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <WidgetsDnDProvider>
            {children}
          </WidgetsDnDProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}


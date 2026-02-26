'use client';

import React from 'react';
import { BarChart3, Zap, MessageSquare, Bell, TrendingUp, Shield } from 'lucide-react';

export function FeaturesOverview() {
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Gráficos en Tiempo Real',
      description: 'Velas japonesas con indicadores técnicos (SMA, EMA, RSI)',
      color: 'from-primary to-primary/50',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Análisis con IA',
      description: 'Análisis automático de tendencias y recomendaciones',
      color: 'from-accent to-accent/50',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Chat Conversacional',
      description: 'Pregunta sobre el mercado y obtén respuestas inteligentes',
      color: 'from-secondary to-secondary/50',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Alertas Personalizadas',
      description: 'Crea alertas de precio y cruces de medias móviles',
      color: 'from-primary to-accent',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Noticias Financieras',
      description: 'Feed de noticias con análisis de sentimiento',
      color: 'from-accent to-secondary',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Datos Seguro',
      description: 'Datos almacenados localmente con persistencia',
      color: 'from-primary to-secondary',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature, index) => (
        <div
          key={index}
          className="card-glass p-6 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <span className="text-white">{feature.icon}</span>
          </div>
          <h3 className="font-bold text-sm mb-2">{feature.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}


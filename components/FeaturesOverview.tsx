'use client';

import React from 'react';
import { BarChart3, Zap, Bell, TrendingUp, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function FeaturesOverview() {
  const { t } = useTranslation();
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t('features.realtimeCharts'),
      description: t('features.realtimeChartsDesc'),
      color: 'from-primary to-primary/50',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('features.aiAnalysis'),
      description: t('features.aiAnalysisDesc'),
      color: 'from-accent to-accent/50',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: t('features.alerts'),
      description: t('features.alertsDesc'),
      color: 'from-primary to-accent',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: t('features.news'),
      description: t('features.newsDesc'),
      color: 'from-accent to-secondary',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('features.security'),
      description: t('features.securityDesc'),
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


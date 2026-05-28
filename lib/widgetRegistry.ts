'use client';

import type { TimeFrame } from '@/lib/types';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { AutoAnalysisWidget } from '@/components/widgets/AutoAnalysisWidget';
import { IndicatorsWidget } from '@/components/widgets/IndicatorsWidget';
import { NewsWidget } from '@/components/widgets/NewsWidget';
import { AlertsWidget } from '@/components/widgets/AlertsWidget';
import { RecommendationsWidget } from '@/components/widgets/RecommendationsWidget';
import { HeatmapWidget } from '@/components/widgets/HeatmapWidget';
import { RSIWidget } from '@/components/widgets/RSIWidget';
import { VolumeWidget } from '@/components/widgets/VolumeWidget';
import { MarketStatusWidget } from '@/components/widgets/MarketStatusWidget';

export interface WidgetProps {
  symbol: string;
  timeframe: TimeFrame;
}

export interface WidgetRegistration {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ComponentType<WidgetProps>;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
}

const registry = new Map<string, WidgetRegistration>();

export function registerWidget(def: WidgetRegistration): void {
  if (registry.has(def.id)) {
    console.warn(`Widget "${def.id}" ya está registrado. Se sobrescribe.`);
  }
  registry.set(def.id, def);
}

export function getWidgetComponent(id: string): React.ComponentType<WidgetProps> | null {
  return registry.get(id)?.component ?? null;
}

export function getWidgetDefinition(id: string): WidgetRegistration | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetRegistration[] {
  return Array.from(registry.values());
}

export const DEFAULT_WIDGETS: WidgetRegistration[] = [
  {
    id: 'chart',
    title: 'Gráfico Principal',
    description: 'Gráfico de velas con indicadores técnicos',
    icon: 'TrendingUp',
    component: ChartWidget,
    defaultLayout: { w: 8, h: 5, minW: 4, minH: 3 },
  },
  {
    id: 'auto-analysis',
    title: 'Análisis Automático',
    description: 'Análisis de velas con IA',
    icon: 'Brain',
    component: AutoAnalysisWidget,
    defaultLayout: { w: 8, h: 4, minW: 4, minH: 2 },
  },
  {
    id: 'indicators',
    title: 'Indicadores',
    description: 'Panel de indicadores técnicos',
    icon: 'BarChart3',
    component: IndicatorsWidget,
    defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  },
  {
    id: 'news',
    title: 'Noticias',
    description: 'Noticias del mercado financiero',
    icon: 'Newspaper',
    component: NewsWidget,
    defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  },
  {
    id: 'alerts',
    title: 'Alertas',
    description: 'Gestión de alertas de precio',
    icon: 'Bell',
    component: AlertsWidget,
    defaultLayout: { w: 4, h: 2, minW: 2, minH: 1 },
  },
  {
    id: 'recommendations',
    title: 'Recomendaciones',
    description: 'Recomendaciones de trading con IA',
    icon: 'Sparkles',
    component: RecommendationsWidget,
    defaultLayout: { w: 6, h: 4, minW: 3, minH: 2 },
  },
  {
    id: 'heatmap',
    title: 'Heatmap de Órdenes',
    description: 'Mapa de calor de órdenes de compra y venta en tiempo real',
    icon: 'Layers',
    component: HeatmapWidget,
    defaultLayout: { w: 6, h: 4, minW: 3, minH: 3 },
  },
  {
    id: 'rsi',
    title: 'RSI',
    description: 'Índice de Fuerza Relativa',
    icon: 'Activity',
    component: RSIWidget,
    defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  },
  {
    id: 'volume',
    title: 'Volumen',
    description: 'Histograma de volumen de trading',
    icon: 'BarChart3',
    component: VolumeWidget,
    defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  },
  {
    id: 'market-status',
    title: 'Estado del Mercado',
    description: 'Indicador de apertura/cierre del mercado',
    icon: 'Clock',
    component: MarketStatusWidget,
    defaultLayout: { w: 2, h: 2, minW: 1, minH: 1 },
  },
];

export function registerDefaultWidgets(): void {
  for (const w of DEFAULT_WIDGETS) {
    registerWidget(w);
  }
}

export { };

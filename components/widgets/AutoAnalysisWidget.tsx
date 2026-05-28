'use client';

import { useMarketData } from '@/app/hooks/useMarketData';
import { AutoAnalysisDisplay } from '@/components/AutoAnalysisDisplay';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function AutoAnalysisWidget({ symbol, timeframe }: WidgetProps) {
  const { data, loading } = useMarketData(symbol, timeframe);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground text-xs">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (data.length < 20) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-muted-foreground text-sm text-center">
          Se necesitan al menos 20 velas para el análisis
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <AutoAnalysisDisplay
        symbol={symbol}
        timeframe={timeframe}
        candleData={data}
      />
    </div>
  );
}

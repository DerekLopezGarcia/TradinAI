'use client';

import { useMarketData } from '@/app/hooks/useMarketData';
import { TradingViewChart } from '@/components/TradingViewChart';
import type { WidgetProps } from '@/lib/widgetRegistry';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ChartWidget({ symbol, timeframe }: WidgetProps) {
  const { t } = useTranslation();
  const { data, loading, error } = useMarketData(symbol, timeframe);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <TradingViewChart
        data={data}
        symbol={symbol}
        interval={timeframe}
        showVolume={false}
        showRSI={false}
        showBollinger={false}
      />
    </div>
  );
}

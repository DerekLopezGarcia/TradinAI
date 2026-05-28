'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    const tooltipHeight = 200;
    const tooltipWidth = 320;

    setPosition({
      top: rect.top - tooltipHeight - 12,
      left: Math.max(12, rect.left - tooltipWidth / 2 + rect.width / 2),
    });
  }, [isVisible]);

  return (
    <div className="relative inline-flex items-center group">
      {children}
      <div
        ref={iconRef}
        className="ml-1 cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
      </div>

      {isVisible && (
        <div 
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="bg-popover border border-border rounded-lg p-4 w-80 text-xs text-popover-foreground shadow-2xl max-h-64 overflow-y-auto">
            <div className="space-y-2 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface IndicatorLegendProps {
  isOpen?: boolean;
}

export function IndicatorLegend({ isOpen = false }: IndicatorLegendProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(isOpen);

  const indicators = [
    {
      name: 'SMA(20)',
      description: t('indicator.sma'),
      details: t('indicator.smaDesc'),
    },
    {
      name: 'EMA(20)',
      description: t('indicator.ema'),
      details: t('indicator.emaDesc'),
    },
    {
      name: 'RSI(14)',
      description: t('indicator.rsi'),
      details: t('indicator.rsiDesc'),
    },
    {
      name: 'ADX(14)',
      description: t('indicator.adx'),
      details: t('indicator.adxDesc'),
    },
    {
      name: 'Stoch %K',
      description: t('indicator.stochK'),
      details: t('indicator.stochKDesc'),
    },
    {
      name: 'Stoch %D',
      description: t('indicator.stochD'),
      details: t('indicator.stochDDesc'),
    },
    {
      name: 'Bollinger Bands',
      description: t('indicator.bb'),
      details: t('indicator.bbDesc'),
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
          {t('indicator.legend')}
        </h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-border">
          {indicators.map((indicator) => (
            <div key={indicator.name} className="text-xs space-y-2 pb-3 border-b border-border last:border-b-0">
              <div className="flex items-start gap-3">
                <span className="font-bold text-foreground flex-shrink-0 min-w-fit">{indicator.name}</span>
                <span className="text-muted-foreground">{indicator.description}</span>
              </div>
              <p className="text-muted-foreground/70 ml-0 pl-0 leading-relaxed whitespace-pre-wrap">{indicator.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


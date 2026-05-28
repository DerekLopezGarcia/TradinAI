'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(isOpen);

  const indicators = [
    {
      name: 'SMA(20)',
      description: 'Media Móvil Simple',
      details: 'Promedio aritmético de los últimos 20 períodos de cierre. Indicador de tendencia general. Valores altos = tendencia alcista, valores bajos = tendencia bajista. Reacciona lentamente a cambios de precio.',
    },
    {
      name: 'EMA(20)',
      description: 'Media Móvil Exponencial',
      details: 'Similar a SMA pero da mayor peso a los precios más recientes. Más reactiva y sensible a cambios actuales. Ideal para identificar cambios de tendencia rápidamente. Suele estar más cercana al precio actual que SMA.',
    },
    {
      name: 'RSI(14)',
      description: 'Índice de Fuerza Relativa',
      details: '• Escala 0-100. Mide momentum y velocidad de cambio de precio.\n• <30: Sobreventa (posible rebote al alza)\n• 30-70: Zona neutral\n• >70: Sobrecompra (posible corrección a la baja)\n• Útil para identificar puntos de entrada/salida.',
    },
    {
      name: 'ADX(14)',
      description: 'Índice Direccional Promedio',
      details: '• Mide la fuerza de una tendencia (no su dirección) en escala 0-100.\n• <20: Sin tendencia clara o débil (rango lateral)\n• 20-40: Tendencia moderada\n• >40: Tendencia fuerte y confiable\n• Útil para confirmar que el precio se mueve direccionalmente.',
    },
    {
      name: 'Stoch %K',
      description: 'Estocástico Rápido',
      details: 'Línea más sensible del oscilador estocástico (escala 0-100).\n• <20: Sobreventa (posible compra)\n• >80: Sobrecompra (posible venta)\n• Indica posición del precio vs rango reciente. Más volátil que %D.',
    },
    {
      name: 'Stoch %D',
      description: 'Estocástico Lento',
      details: 'Media móvil suavizada de %K (escala 0-100). Más estable y confiable.\n• Busca cruces: %K arriba %D = señal alcista, %K abajo %D = señal bajista\n• Confirmación de señales del estocástico. Menos falsas señales que %K.',
    },
    {
      name: 'Bollinger Bands',
      description: 'Bandas de Bollinger',
      details: '• Banda superior e inferior = desviación estándar del precio\n• Línea central = SMA(20)\n• Precio tocando banda superior = posible sobrecompra\n• Precio tocando banda inferior = posible sobreventa\n• Estrechamiento de bandas = baja volatilidad (posible ruptura próxima)',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Leyenda de Indicadores
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


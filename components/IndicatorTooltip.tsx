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
    const tooltipHeight = 200; // Aumentado para más contenido
    const tooltipWidth = 320; // Más ancho para mejor legibilidad

    setPosition({
      top: rect.top - tooltipHeight - 12, // 12px de margen
      left: Math.max(12, rect.left - tooltipWidth / 2 + rect.width / 2), // Centrado y evitar salir de pantalla
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
        <HelpCircle className="w-4 h-4 text-cyan-400 hover:text-cyan-300 transition-colors" />
      </div>

      {isVisible && (
        <div 
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-400/60 rounded-lg p-4 w-80 text-xs text-slate-200 shadow-2xl max-h-64 overflow-y-auto">
            <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-slate-100">
              {content}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
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
      color: 'text-slate-400',
    },
    {
      name: 'EMA(20)',
      description: 'Media Móvil Exponencial',
      details: 'Similar a SMA pero da mayor peso a los precios más recientes. Más reactiva y sensible a cambios actuales. Ideal para identificar cambios de tendencia rápidamente. Suele estar más cercana al precio actual que SMA.',
      color: 'text-slate-400',
    },
    {
      name: 'RSI(14)',
      description: 'Índice de Fuerza Relativa',
      details: '• Escala 0-100. Mide momentum y velocidad de cambio de precio.\n• <30: Sobreventa (posible rebote al alza)\n• 30-70: Zona neutral\n• >70: Sobrecompra (posible corrección a la baja)\n• Útil para identificar puntos de entrada/salida.',
      color: 'text-slate-400',
    },
    {
      name: 'ADX(14)',
      description: 'Índice Direccional Promedio',
      details: '• Mide la fuerza de una tendencia (no su dirección) en escala 0-100.\n• <20: Sin tendencia clara o débil (rango lateral)\n• 20-40: Tendencia moderada\n• >40: Tendencia fuerte y confiable\n• Útil para confirmar que el precio se mueve direccionalmente.',
      color: 'text-slate-400',
    },
    {
      name: 'Stoch %K',
      description: 'Estocástico Rápido',
      details: 'Línea más sensible del oscilador estocástico (escala 0-100).\n• <20: Sobreventa (posible compra)\n• >80: Sobrecompra (posible venta)\n• Indica posición del precio vs rango reciente. Más volátil que %D.',
      color: 'text-slate-400',
    },
    {
      name: 'Stoch %D',
      description: 'Estocástico Lento',
      details: 'Media móvil suavizada de %K (escala 0-100). Más estable y confiable.\n• Busca cruces: %K arriba %D = señal alcista, %K abajo %D = señal bajista\n• Confirmación de señales del estocástico. Menos falsas señales que %K.',
      color: 'text-slate-400',
    },
    {
      name: 'Bollinger Bands',
      description: 'Bandas de Bollinger',
      details: '• Banda superior e inferior = desviación estándar del precio\n• Línea central = SMA(20)\n• Precio tocando banda superior = posible sobrecompra\n• Precio tocando banda inferior = posible sobreventa\n• Estrechamiento de bandas = baja volatilidad (posible ruptura próxima)',
      color: 'text-slate-400',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          📚 Leyenda de Indicadores
        </h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-cyan-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-cyan-500/10">
          {indicators.map((indicator) => (
            <div key={indicator.name} className="text-xs space-y-2 pb-3 border-b border-slate-700/50 last:border-b-0">
              <div className="flex items-start gap-3">
                <span className="font-bold text-cyan-300 flex-shrink-0 min-w-fit">{indicator.name}</span>
                <span className="text-slate-300">{indicator.description}</span>
              </div>
              <p className="text-slate-400 ml-0 pl-0 leading-relaxed whitespace-pre-wrap">{indicator.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


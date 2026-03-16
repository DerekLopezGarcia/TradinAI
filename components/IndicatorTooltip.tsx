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
    const tooltipHeight = 120; // Aproximadamente
    const tooltipWidth = 224; // w-56 = 14rem = 224px

    setPosition({
      top: rect.top - tooltipHeight - 8, // 8px de margen
      left: rect.left - tooltipWidth / 2 + rect.width / 2, // Centrado respecto al icono
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
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-3 w-56 text-xs text-slate-300 shadow-2xl">
            {content}
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
      details: 'Promedio de precios últimos 20 períodos. Indica tendencia general.',
      color: 'text-slate-400',
    },
    {
      name: 'EMA(20)',
      description: 'Media Móvil Exponencial',
      details: 'Como SMA pero da más peso a precios recientes. Más reactiva.',
      color: 'text-slate-400',
    },
    {
      name: 'RSI(14)',
      description: 'Índice de Fuerza Relativa',
      details: 'Mide momentum. Verde <30 (sobreventa), Rojo >70 (sobrecompra), Azul neutral.',
      color: 'text-slate-400',
    },
    {
      name: 'ADX(14)',
      description: 'Índice Direccional Promedio',
      details: 'Mide fuerza de tendencia 0-100. Gris <20 (sin tendencia), Azul 20-25 (débil), Amarillo 25-40 (moderada), Rojo >40 (fuerte).',
      color: 'text-slate-400',
    },
    {
      name: 'Stoch %K',
      description: 'Estocástico Rápido',
      details: 'Línea sensible del estocástico. Verde <20 (sobreventa), Rojo >80 (sobrecompra).',
      color: 'text-slate-400',
    },
    {
      name: 'Stoch %D',
      description: 'Estocástico Lento',
      details: 'Media móvil de %K. Confirmación de señales. Busca cruces %K vs %D.',
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
        <div className="px-4 py-3 space-y-3 border-t border-cyan-500/10">
          {indicators.map((indicator) => (
            <div key={indicator.name} className="text-xs space-y-1">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-cyan-400 flex-shrink-0">{indicator.name}</span>
                <span className="text-slate-300">{indicator.description}</span>
              </div>
              <p className="text-slate-500 ml-0 pl-0">{indicator.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


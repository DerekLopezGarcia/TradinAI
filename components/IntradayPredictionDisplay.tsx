/**
 * Componente para mostrar predicciones intraday - T2.3
 */

'use client';

import React from 'react';
import { IntradayPrediction } from '@/lib/services/intradayPredictionService';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface IntradayPredictionDisplayProps {
  prediction: IntradayPrediction | null;
  loading: boolean;
  error: string | null;
}

export function IntradayPredictionDisplay({
  prediction,
  loading,
  error
}: IntradayPredictionDisplayProps) {
  if (loading) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">No prediction available</p>
      </div>
    );
  }

  const directionColor = prediction.expectedDirection === 'up'
    ? 'text-green-600 dark:text-green-400'
    : prediction.expectedDirection === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-600 dark:text-slate-400';

  const directionBg = prediction.expectedDirection === 'up'
    ? 'bg-green-50 dark:bg-green-900/20'
    : prediction.expectedDirection === 'down'
      ? 'bg-red-50 dark:bg-red-900/20'
      : 'bg-slate-50 dark:bg-slate-900/50';

  const DirectionIcon = prediction.expectedDirection === 'up'
    ? TrendingUp
    : prediction.expectedDirection === 'down'
      ? TrendingDown
      : AlertCircle;

  return (
    <div className={`p-4 rounded-lg ${directionBg}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Intraday Prediction ({prediction.timeframe})
          </h3>
          <DirectionIcon className={`w-5 h-5 ${directionColor}`} />
        </div>

        {/* Main Prediction */}
        <div className="flex items-end gap-2">
          <span className={`text-2xl font-bold ${directionColor}`}>
            {prediction.expectedDirection === 'up' ? '↑' : prediction.expectedDirection === 'down' ? '↓' : '→'}
          </span>
          <div>
            <p className={`text-sm font-medium ${directionColor}`}>
              {prediction.expectedDirection.toUpperCase()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {prediction.probability.toFixed(0)}% confidence
            </p>
          </div>
        </div>

        {/* Price Target */}
        {prediction.priceTarget != null && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Target Price</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {prediction.priceTarget.toFixed(2)} ({prediction.priceTargetPercent > 0 ? '+' : ''}{prediction.priceTargetPercent.toFixed(2)}%)
            </p>
          </div>
        )}

        {/* Factors Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Momentum */}
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Momentum</p>
            <p className="text-xs font-medium text-slate-900 dark:text-white capitalize">
              {prediction.factors.momentum.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Trend */}
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Trend</p>
            <p className="text-xs font-medium text-slate-900 dark:text-white capitalize">
              {prediction.factors.trend.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Volatility */}
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Volatility</p>
            <p className="text-xs font-medium text-slate-900 dark:text-white capitalize">
              {prediction.factors.volatility.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Pattern Match */}
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Pattern Match</p>
            <p className="text-xs font-medium text-slate-900 dark:text-white">
              {prediction.factors.patternMatch.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Support/Resistance */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Support</p>
            <p className="text-xs font-mono font-medium text-slate-900 dark:text-white">
              {prediction.expectedLevels.support.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
            <p className="text-xs text-slate-600 dark:text-slate-400">Resistance</p>
            <p className="text-xs font-mono font-medium text-slate-900 dark:text-white">
              {prediction.expectedLevels.resistance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded">
          <p className="text-xs text-slate-600 dark:text-slate-400">Analysis</p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {prediction.reasoning}
          </p>
        </div>

        {/* Market Time Context */}
        <div className="text-xs text-slate-500 dark:text-slate-400 italic">
          {prediction.factors.timeOfDay}
        </div>
      </div>
    </div>
  );
}

export default IntradayPredictionDisplay;


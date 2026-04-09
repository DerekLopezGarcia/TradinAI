/**
 * Componente mejorado para gestionar alertas dinámicas - T2.4
 */

'use client';

import React, { useState } from 'react';
import { Alert, AlertCondition, AlertConditionType, AlertOperator } from '@/lib/services/alertService';
import { useAlerts } from '@/app/hooks/useAlerts';
import { Bell, Trash2, Plus, X, AlertCircle } from 'lucide-react';

interface DynamicAlertManagerProps {
  symbol?: string;
  currentPrice?: number;
}

export function DynamicAlertManager({ symbol, currentPrice }: DynamicAlertManagerProps) {
  const { alerts, triggeredEvents, createAlert, deleteAlert, setAlertEnabled, clearTriggeredEvents } = useAlerts({ symbol, currentPrice });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'price' as AlertConditionType,
    operator: 'gt' as AlertOperator,
    value: '',
    soundEnabled: true
  });

  const handleCreateAlert = () => {
    if (!formData.name || !formData.value) {
      alert('Please fill all fields');
      return;
    }

    if (!symbol) {
      alert('Symbol is required');
      return;
    }

    const numericValue = parseFloat(formData.value);
    if (isNaN(numericValue)) {
      alert('Please enter a valid numeric value');
      return;
    }

    const condition: AlertCondition = {
      type: formData.type,
      operator: formData.operator,
      value: numericValue
    };

    const result = createAlert(formData.name, condition, {
      soundEnabled: formData.soundEnabled
    });

    if (result === null) {
      alert('Failed to create alert. Please check your inputs.');
      return;
    }

    // Reset form
    setFormData({
      name: '',
      type: 'price',
      operator: 'gt',
      value: '',
      soundEnabled: true
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Dynamic Alerts {alerts.length > 0 && `(${alerts.length})`}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Add alert"
        >
          <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Triggered Events */}
      {triggeredEvents.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {triggeredEvents.length} Alert{triggeredEvents.length !== 1 ? 's' : ''} Triggered
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                {triggeredEvents.slice(-3).map((event, idx) => (
                  <li key={idx} className="line-clamp-1">
                    • {event.message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => clearTriggeredEvents()}
              className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Alert Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Price High"
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertConditionType })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                <option value="price">Price</option>
                <option value="percent_change">% Change</option>
                <option value="rsi">RSI</option>
                <option value="macd">MACD</option>
                <option value="sma_cross">SMA Cross</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Operator</label>
              <select
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value as AlertOperator })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                <option value="gt">Greater than (&gt;)</option>
                <option value="lt">Less than (&lt;)</option>
                <option value="eq">Equals (=)</option>
                <option value="gte">Greater or equal (&ge;)</option>
                <option value="lte">Less or equal (&le;)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Value</label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === 'price' ? currentPrice?.toFixed(2) : '50'}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.soundEnabled}
              onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Enable sound notification</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleCreateAlert}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            >
              Create Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No alerts configured
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItemDisplay
              key={alert.id}
              alert={alert}
              onToggle={(enabled) => setAlertEnabled(alert.id, enabled)}
              onDelete={() => deleteAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Componente individual de alerta
 */
function AlertItemDisplay({
  alert,
  onToggle,
  onDelete
}: {
  alert: Alert;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const getConditionLabel = (alert: Alert): string => {
    const { type, operator, value } = alert.condition;
    const opMap: Record<string, string> = {
      gt: '>',
      lt: '<',
      eq: '=',
      gte: '≥',
      lte: '≤'
    };

    switch (type) {
      case 'price':
        return `Price ${opMap[operator]} ${value.toFixed(2)}`;
      case 'percent_change':
        return `Change ${opMap[operator]} ${value}%`;
      case 'rsi':
        return `RSI ${opMap[operator]} ${value}`;
      case 'macd':
        return `MACD ${opMap[operator]} ${value}`;
      case 'sma_cross':
        return `SMA Crossover`;
      default:
        return 'Unknown condition';
    }
  };

  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      alert.enabled
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alert.enabled}
                onChange={(e) => onToggle(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className={`font-medium text-sm ${
                alert.enabled
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 line-through'
              }`}>
                {alert.name}
              </span>
              {alert.soundEnabled && (
                <span className="text-xs bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">
                  🔔 Sound
                </span>
              )}
            </label>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {getConditionLabel(alert)}
          </p>

          {alert.lastTriggeredAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ⏰ Last triggered: {new Date(alert.lastTriggeredAt).toLocaleTimeString()}
            </p>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Cooldown: {alert.minMinutesBetweenAlerts}m
          </p>
        </div>

        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
          title="Delete alert"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default DynamicAlertManager;


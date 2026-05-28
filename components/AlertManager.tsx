'use client';

import { useState, useRef, useEffect } from 'react';
import { Alert, AlertType } from '@/lib/types';
import { useMarketStore } from '@/lib/store';
import { Bell, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AlertManager() {
  const { t } = useTranslation();
  const { alerts, selectedAsset, addAlert, removeAlert } = useMarketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'price_above' as AlertType, value: '' });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value || !selectedAsset) {
      toast.error(t('alerts.completeFields'));
      return;
    }

    addAlert({
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedAsset.symbol,
      type: formData.type,
      value: parseFloat(formData.value),
      isActive: true,
      createdAt: Date.now(),
    });
    setFormData({ type: 'price_above', value: '' });
    toast.success(t('alerts.created'));
  };

  const recentAlerts = alerts.slice(-5).reverse();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow z-40 flex items-center justify-center"
      >
        <Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold flex items-center justify-center">
            {Math.min(alerts.length, 9)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div ref={modalRef} className="bg-card border border-border rounded-xl w-full sm:w-96 max-h-[80vh] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">{t('alerts.title')}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <form onSubmit={handleAddAlert} className="space-y-3">
                <p className="text-sm font-medium">
                  {t('alerts.newFor')} <span className="text-primary">{selectedAsset?.symbol}</span>
                </p>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {([
    ['price_above', t('alerts.priceAbove')],
    ['price_below', t('alerts.priceBelow')],
    ['sma_cross', t('alerts.crossSMA')],
    ['ema_cross', t('notification.emaCross')],
  ] as const).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
                />
                <button type="submit" className="w-full btn-primary">
                  <Plus className="w-4 h-4 inline mr-2" />
                  {t('alerts.createAlert')}
                </button>
              </form>

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">{t('alerts.activeAlerts')}</p>
                {recentAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('alerts.noAlerts')}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                        <div className="flex items-center gap-2">
                          {alert.type.includes('above') ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{alert.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {(alert.type === 'price_above' ? t('alerts.priceAbove') :
                                alert.type === 'price_below' ? t('alerts.priceBelow') :
                                alert.type === 'sma_cross' ? t('alerts.crossSMA') :
                                t('notification.emaCross'))} ${alert.value.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


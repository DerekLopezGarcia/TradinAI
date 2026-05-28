'use client';

import { useState, useRef, useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Bell, X, TrendingUp, TrendingDown, Trash2, Clock } from 'lucide-react';

export function NotificationPanel() {
  const { t, locale } = useTranslation();
  const { alerts, removeAlert } = useMarketStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar panel al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const sortedAlerts = [...alerts].sort((a, b) => b.createdAt - a.createdAt);
  const hasAlerts = alerts.length > 0;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notification.now');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES');
  };

  const getAlertLabel = (type: string) => {
    const labels: Record<string, string> = {
      'price_above': t('notification.priceAbove'),
      'price_below': t('notification.priceBelow'),
      'sma_cross': t('notification.smaCross'),
      'ema_cross': t('notification.emaCross'),
    };
    return labels[type] || t('notification.alert');
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors hover:bg-muted relative group"
        title={hasAlerts ? t('notification.count', { count: alerts.length }) : t('notification.noNotifications')}
      >
        <Bell className="w-5 h-5 text-foreground" />
        {hasAlerts && (
          <>
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs font-bold flex items-center justify-center">
              {Math.min(alerts.length, 9)}
            </span>
          </>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">{t('notification.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  {hasAlerts ? t('notification.alertCount', { count: alerts.length }) : t('notification.noAlerts')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            {!hasAlerts ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notification.noNotifications')}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t('notification.hint')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {sortedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-foreground">
                            {alert.symbol}
                          </p>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            {getAlertLabel(alert.type)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${alert.value.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(alert.createdAt)}
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title={t('notification.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Limpiar todo */}
          {hasAlerts && (
            <div className="border-t border-border/50 p-3 bg-muted/20">
              <button
                onClick={() => {
                  alerts.forEach(alert => removeAlert(alert.id));
                  setIsOpen(false);
                }}
                className="w-full text-xs font-medium text-destructive hover:bg-destructive/10 px-3 py-2 rounded transition-colors"
              >
                {t('notification.clearAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


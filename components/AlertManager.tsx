'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, AlertType } from '@/lib/types';
import { useMarketStore } from '@/lib/store';
import { Bell, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AlertManager() {
  const { alerts, selectedAsset, addAlert, removeAlert } = useMarketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'price_above' as AlertType,
    value: '',
  });
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAddAlert = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || !selectedAsset) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const newAlert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedAsset.symbol,
      type: formData.type,
      value: parseFloat(formData.value),
      isActive: true,
      createdAt: Date.now(),
    };

    addAlert(newAlert);
    setFormData({ type: 'price_above', value: '' });
    toast.success('Alerta creada exitosamente');
  }, [formData, selectedAsset, addAlert]);

  const getAlertLabel = useCallback((type: AlertType) => {
    const labels: Record<AlertType, string> = {
      price_above: 'Precio mayor que',
      price_below: 'Precio menor que',
      sma_cross: 'Cruce de SMA',
      ema_cross: 'Cruce de EMA',
    };
    return labels[type];
  }, []);

  const recentAlerts = alerts.slice(-5).reverse();

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-primary-foreground z-40"
        title="Alertas"
      >
        <Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground rounded-full text-xs font-bold flex items-center justify-center">
            {Math.min(alerts.length, 9)}
          </span>
        )}
      </button>

      {/* Panel de alertas */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div ref={modalRef} className="card-glass w-full sm:w-96 max-h-96 flex flex-col rounded-2xl">
            {/* Encabezado */}
            <div className="flex items-center justify-between p-6 border-b border-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Alertas</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              {/* Crear alerta */}
              <div className="p-6 border-b border-muted/30">
                <h3 className="font-semibold text-sm mb-4">Nueva Alerta - {selectedAsset?.symbol}</h3>
                <form onSubmit={handleAddAlert} className="space-y-3">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                    className="w-full bg-muted/20 px-3 py-2 rounded-lg border border-muted text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="price_above">Precio mayor que</option>
                    <option value="price_below">Precio menor que</option>
                    <option value="sma_cross">Cruce de SMA</option>
                    <option value="ema_cross">Cruce de EMA</option>
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-muted/20 px-3 py-2 rounded-lg border border-muted text-sm focus:border-accent focus:outline-none placeholder-muted-foreground"
                  />

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Alerta
                  </button>
                </form>
              </div>

              {/* Lista de alertas */}
              <div className="p-6 space-y-3">
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay alertas creadas</p>
                  </div>
                ) : (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-muted/10 rounded-lg flex items-start justify-between group hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{alert.symbol}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            {getAlertLabel(alert.type)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.value} • {format(new Date(alert.createdAt), 'HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/20 rounded"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


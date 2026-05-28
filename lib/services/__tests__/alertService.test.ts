/**
 * @jest-environment jsdom
 */

import { AlertService, Alert, AlertCondition } from '@/lib/services/alertService';
import { CandleData } from '@/lib/types';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    localStorage.clear();
    service = new AlertService();
  });

  describe('createAlert', () => {
    it('creates an alert with valid params', () => {
      const alert = service.createAlert('BTCUSD', 'Bitcoin above 100k', {
        type: 'price',
        operator: 'gt',
        value: 100000,
      });
      expect(alert.id).toBeTruthy();
      expect(alert.symbol).toBe('BTCUSD');
      expect(alert.enabled).toBe(true);
      expect(alert.lastTriggeredAt).toBeNull();
    });

    it('throws for invalid symbol', () => {
      expect(() =>
        service.createAlert('', 'Test', { type: 'price', operator: 'gt', value: 100 })
      ).toThrow('Invalid symbol');
    });

    it('throws for invalid condition type', () => {
      expect(() =>
        service.createAlert('BTCUSD', 'Test', { type: 'invalid' as any, operator: 'gt', value: 100 })
      ).toThrow('Invalid condition type');
    });

    it('throws for invalid operator', () => {
      expect(() =>
        service.createAlert('BTCUSD', 'Test', { type: 'price', operator: 'invalid' as any, value: 100 })
      ).toThrow('Invalid condition operator');
    });

    it('throws for invalid period range', () => {
      expect(() =>
        service.createAlert('BTCUSD', 'Test', { type: 'rsi', operator: 'gt', value: 70, period: 1 })
      ).toThrow('Invalid period');
      expect(() =>
        service.createAlert('BTCUSD', 'Test', { type: 'rsi', operator: 'gt', value: 70, period: 201 })
      ).toThrow('Invalid period');
    });

    it('enforces maximum alerts limit', () => {
      for (let i = 0; i < 100; i++) {
        service.createAlert(`SYM${i}`, `Alert ${i}`, { type: 'price', operator: 'gt', value: 100 });
      }
      expect(() =>
        service.createAlert('OVER', 'Overflow', { type: 'price', operator: 'gt', value: 100 })
      ).toThrow('Maximum number of alerts');
    });
  });

  describe('getAlerts', () => {
    it('returns empty array initially', () => {
      expect(service.getAlerts()).toEqual([]);
    });

    it('returns all created alerts', () => {
      service.createAlert('BTCUSD', 'Test 1', { type: 'price', operator: 'gt', value: 50000 });
      service.createAlert('ETHUSD', 'Test 2', { type: 'price', operator: 'lt', value: 2000 });
      expect(service.getAlerts()).toHaveLength(2);
    });
  });

  describe('getAlertsBySymbol', () => {
    it('filters alerts by symbol', () => {
      service.createAlert('BTCUSD', 'Alert 1', { type: 'price', operator: 'gt', value: 50000 });
      service.createAlert('ETHUSD', 'Alert 2', { type: 'price', operator: 'lt', value: 2000 });
      const btcAlerts = service.getAlertsBySymbol('BTCUSD');
      expect(btcAlerts).toHaveLength(1);
      expect(btcAlerts[0].symbol).toBe('BTCUSD');
    });
  });

  describe('updateAlert', () => {
    it('updates alert fields', () => {
      const alert = service.createAlert('BTCUSD', 'Test', { type: 'price', operator: 'gt', value: 50000 });
      const updated = service.updateAlert(alert.id, { enabled: false, name: 'Updated' });
      expect(updated).not.toBeNull();
      expect(updated!.enabled).toBe(false);
      expect(updated!.name).toBe('Updated');
    });

    it('returns null for non-existent alert', () => {
      expect(service.updateAlert('nonexistent', { enabled: false })).toBeNull();
    });

    it('prevents ID change', () => {
      const alert = service.createAlert('BTCUSD', 'Test', { type: 'price', operator: 'gt', value: 50000 });
      const updated = service.updateAlert(alert.id, { id: 'new-id' });
      expect(updated!.id).toBe(alert.id);
    });
  });

  describe('deleteAlert', () => {
    it('deletes an existing alert', () => {
      const alert = service.createAlert('BTCUSD', 'Test', { type: 'price', operator: 'gt', value: 50000 });
      expect(service.deleteAlert(alert.id)).toBe(true);
      expect(service.getAlerts()).toHaveLength(0);
    });

    it('returns false for non-existent alert', () => {
      expect(service.deleteAlert('nonexistent')).toBe(false);
    });
  });

  describe('setAlertEnabled', () => {
    it('enables/disables alerts', () => {
      const alert = service.createAlert('BTCUSD', 'Test', { type: 'price', operator: 'gt', value: 50000 });
      expect(service.setAlertEnabled(alert.id, false)!.enabled).toBe(false);
      expect(service.setAlertEnabled(alert.id, true)!.enabled).toBe(true);
    });
  });

  describe('checkAlert', () => {
    const makeCandles = (closes: number[]): CandleData[] =>
      closes.map((c, i) => ({
        time: Date.now() + i * 60000,
        open: c,
        high: c + 1,
        low: c - 1,
        close: c,
        volume: 1000,
      }));

    it('triggers price_above condition', () => {
      const alert = service.createAlert('TEST', 'Test', { type: 'price', operator: 'gt', value: 100 });
      expect(service.checkAlert(alert, 150, [])).toBe(true);
      expect(service.checkAlert(alert, 50, [])).toBe(false);
    });

    it('triggers price_below condition', () => {
      const alert = service.createAlert('TEST', 'Test', { type: 'price', operator: 'lt', value: 100 });
      expect(service.checkAlert(alert, 50, [])).toBe(true);
      expect(service.checkAlert(alert, 150, [])).toBe(false);
    });

    it('triggers price equality with tolerance', () => {
      const alert = service.createAlert('TEST', 'Test', { type: 'price', operator: 'eq', value: 100 });
      expect(service.checkAlert(alert, 100.005, [])).toBe(true);
      expect(service.checkAlert(alert, 101, [])).toBe(false);
    });

    it('respects minimum minutes between alerts', () => {
      const alert = service.createAlert('TEST', 'Test', { type: 'price', operator: 'gt', value: 100 }, { minMinutesBetweenAlerts: 60 });
      service.updateAlert(alert.id, { lastTriggeredAt: Date.now() - 1000 });
      const updatedAlert = service.getAlert(alert.id);
      expect(updatedAlert).not.toBeNull();
      expect(service.checkAlert(updatedAlert!, 150, [])).toBe(false);
    });

    it('checks percent_change condition', () => {
      const alert = service.createAlert('TEST', 'Test', { type: 'percent_change', operator: 'gt', value: 5 });
      const candles = makeCandles([100, 110]);
      expect(service.checkAlert(alert, 110, candles)).toBe(true);
      expect(service.checkAlert(alert, 102, candles)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes old disabled alerts', () => {
      const alert = service.createAlert('OLD', 'Old Alert', { type: 'price', operator: 'gt', value: 100 });
      service.updateAlert(alert.id, { enabled: false, createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000 });
      service.cleanup();
      expect(service.getAlerts()).toHaveLength(0);
    });
  });
});

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Settings, X, Trash2, Download, Moon, Sun, RotateCcw, AlertCircle, LayoutPanelLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWidgetStore } from '@/lib/widgetStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { editMode, setEditMode } = useWidgetStore();
  const { t, locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleClearCache = () => {
    if (confirm(t('settings.clearCacheConfirm'))) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success(t('settings.clearCacheSuccess'));
      setIsOpen(false);
    }
  };

  const handleExportData = () => {
    try {
      const safeData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        theme,
        locale,
        userPreferences: {
          selectedTimeframe: localStorage.getItem('trading-ia-store')
            ? (() => {
              try {
                const store = JSON.parse(localStorage.getItem('trading-ia-store') || '{}');
                return { selectedTimeframe: store.state?.selectedTimeframe };
              } catch {
                return {};
              }
            })()
            : {},
        },
      };

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(safeData, null, 2)));
      element.setAttribute('download', `trading-ia-backup-${Date.now()}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success(t('settings.exportSuccess'));
    } catch {
      toast.error(t('settings.exportError'));
    }
  };

  const handleResetApp = () => {
    if (confirm(t('settings.resetConfirm'))) {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors hover:bg-muted"
        title={t('settings.title')}
      >
        <Settings className="w-5 h-5 text-foreground" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-[600px] overflow-y-auto flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 sticky top-0">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">{t('settings.title')}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {t('settings.theme')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Sun className="w-4 h-4 inline mr-1" />
                  {t('settings.light')}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Moon className="w-4 h-4 inline mr-1" />
                  {t('settings.dark')}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <LayoutPanelLeft className="w-4 h-4" />
                {t('settings.editDashboard')}
              </label>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  toast.success(editMode ? t('editMode.toggleOff') : t('editMode.toggleOn'));
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  editMode
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutPanelLeft className={`w-4 h-4 transition-transform duration-300 ${editMode ? 'rotate-12' : ''}`} />
                  {editMode ? t('settings.editModeActive') : t('settings.customizeLayout')}
                </span>
                <span
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                    editMode ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                      editMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
              {editMode && (
                <p className="text-xs text-primary/70 animate-fadeIn">
                  {t('settings.editModeHint')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('settings.language')}</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'es' | 'en')}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground">{t('settings.data')}</p>

              <button
                onClick={handleExportData}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium text-foreground transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('settings.exportData')}
              </button>

              <button
                onClick={handleClearCache}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t('settings.clearCache')}
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground">{t('settings.info')}</p>

              <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('settings.version')}</span>
                  <span className="font-mono">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settings.environment')}</span>
                  <span className="font-mono">{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settings.date')}</span>
                  <span className="font-mono">{new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={handleResetApp}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('settings.resetApp')}
              </button>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 flex gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t('settings.warning')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

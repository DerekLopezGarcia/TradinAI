'use client';

import { useEffect, useRef } from 'react';
import { X, LayoutPanelLeft } from 'lucide-react';
import { useWidgetStore, WIDGET_DEFINITIONS } from '@/lib/widgetStore';

const ICON_MAP: Record<string, string> = {
  TrendingUp: '📈',
  Brain: '🧠',
  BarChart3: '📊',
  MessageSquare: '💬',
  Newspaper: '📰',
  Bell: '🔔',
  Sparkles: '✨',
};

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, editMode, setEditMode, enabledWidgets, toggleWidget } = useWidgetStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Menú</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-60px)] scrollbar-hide">
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              editMode
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-muted/30 hover:bg-muted/50 text-foreground'
            }`}
          >
            <LayoutPanelLeft className={`w-5 h-5 transition-transform duration-300 ${editMode ? 'rotate-12' : ''}`} />
            <div className="text-left">
              <p className="text-sm font-medium">{editMode ? 'Modo Edición' : 'Editar Dashboard'}</p>
              <p className="text-xs text-muted-foreground">{editMode ? 'Widgets movibles' : 'Personalizar diseño'}</p>
            </div>
          </button>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Widgets ({enabledWidgets.length})
            </p>
            <div className="space-y-1">
              {WIDGET_DEFINITIONS.map((widget) => {
                const isEnabled = enabledWidgets.includes(widget.id);
                return (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base shrink-0">{ICON_MAP[widget.icon] || '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{widget.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

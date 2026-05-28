import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import { DEFAULT_WIDGETS, registerDefaultWidgets } from '@/lib/widgetRegistry';

registerDefaultWidgets();

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
  defaultEnabled: boolean;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = DEFAULT_WIDGETS.map((w) => ({
  id: w.id,
  title: w.title,
  description: w.description,
  icon: w.icon,
  defaultLayout: w.defaultLayout,
  defaultEnabled: ['chart', 'auto-analysis', 'indicators', 'news', 'heatmap', 'rsi', 'volume', 'market-status'].includes(w.id),
}));

function generateDefaultLayouts(): ResponsiveLayouts {
  const enabled = WIDGET_DEFINITIONS.filter((w) => w.defaultEnabled);
  const lg: LayoutItem[] = [];
  let y = 0;
  for (const w of enabled) {
    lg.push({
      i: w.id,
      x: 0,
      y,
      w: w.defaultLayout.w,
      h: w.defaultLayout.h,
      minW: w.defaultLayout.minW,
      minH: w.defaultLayout.minH,
    });
    y += w.defaultLayout.h;
  }
  return {
    lg,
    md: lg.map((l) => ({ ...l, w: Math.min(l.w, 6) })),
    sm: lg.map((l) => ({ ...l, w: 2, h: l.h + 2 })),
  };
}

export interface WidgetStore {
  enabledWidgets: string[];
  toggleWidget: (id: string) => void;
  layouts: ResponsiveLayouts;
  setLayouts: (layouts: ResponsiveLayouts) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
}

export const useWidgetStore = create<WidgetStore>()(
  persist(
    (set) => ({
      enabledWidgets: WIDGET_DEFINITIONS.filter((w) => w.defaultEnabled).map((w) => w.id),
      layouts: generateDefaultLayouts(),
      editMode: false,

      setEditMode: (mode) => set({ editMode: mode }),

      toggleWidget: (id) =>
        set((state) => {
          const isEnabled = state.enabledWidgets.includes(id);
          if (isEnabled) {
            const newLayouts: ResponsiveLayouts = {};
            for (const bp of ['lg', 'md', 'sm'] as const) {
              const layout = state.layouts[bp];
              if (layout) {
                newLayouts[bp] = layout.filter((l) => l.i !== id);
              }
            }
            return {
              enabledWidgets: state.enabledWidgets.filter((wid) => wid !== id),
              layouts: newLayouts,
            };
          }

          const def = WIDGET_DEFINITIONS.find((w) => w.id === id);
          if (!def) return state;

          const currentLg = state.layouts.lg || [];
          const maxY = Math.max(0, ...currentLg.map((l) => l.y + l.h));
          const newItem: LayoutItem = {
            i: id,
            x: 0,
            y: maxY,
            w: def.defaultLayout.w,
            h: def.defaultLayout.h,
            minW: def.defaultLayout.minW,
            minH: def.defaultLayout.minH,
          };
          return {
            enabledWidgets: [...state.enabledWidgets, id],
            layouts: {
              lg: [...currentLg, newItem],
              md: [...(state.layouts.md || []), { ...newItem, w: Math.min(newItem.w, 6) }],
              sm: [...(state.layouts.sm || []), { ...newItem, w: 2 }],
            },
          };
        }),

      setLayouts: (layouts) => set({ layouts }),
    }),
    {
      name: 'trading-ia-widgets',
      partialize: (state) => ({
        enabledWidgets: state.enabledWidgets,
        layouts: state.layouts,
      }),
    }
  )
);

'use client';

import { useContainerWidth, Responsive, verticalCompactor } from 'react-grid-layout';
import type { ResponsiveLayouts } from 'react-grid-layout';
import { useWidgetStore, WIDGET_DEFINITIONS } from '@/lib/widgetStore';
import { WidgetWrapper } from '@/components/WidgetWrapper';
import { getWidgetComponent } from '@/lib/widgetRegistry';
import type { TimeFrame } from '@/lib/types';

interface DashboardGridProps {
  symbol: string;
  timeframe: TimeFrame;
}

export function DashboardGrid({ symbol, timeframe }: DashboardGridProps) {
  const { enabledWidgets, layouts, setLayouts, editMode } = useWidgetStore();
  const { width, containerRef, mounted } = useContainerWidth();
  const enabledDefs = WIDGET_DEFINITIONS.filter((w) => enabledWidgets.includes(w.id));

  if (enabledDefs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">
          {editMode
            ? 'Arrastra widgets desde el panel lateral para comenzar'
            : 'Activa el modo edición para agregar widgets'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full transition-all duration-300 ease-out ${
        editMode ? 'dashboard-grid-edit' : ''
      }`}
    >
      {mounted && (
        <Responsive
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 } as const}
          cols={{ lg: 12, md: 8, sm: 4, xs: 2 } as const}
          rowHeight={100}
          maxRows={50}
          compactor={verticalCompactor}
          dragConfig={{
            enabled: editMode,
            handle: '.widget-drag-handle',
          }}
          resizeConfig={{
            enabled: editMode,
            handles: ['se'],
          }}
          onLayoutChange={(_layout, allLayouts: ResponsiveLayouts) => {
            if (allLayouts) setLayouts(allLayouts);
          }}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          autoSize={true}
        >
          {enabledDefs.map((widget) => {
            const Component = getWidgetComponent(widget.id);
            return (
              <div key={widget.id} className="overflow-hidden relative group">
                <WidgetWrapper title={widget.title} widgetId={widget.id}>
                  {Component ? (
                    <Component symbol={symbol} timeframe={timeframe} />
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      Widget &quot;{widget.id}&quot; no encontrado
                    </div>
                  )}
                </WidgetWrapper>
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}

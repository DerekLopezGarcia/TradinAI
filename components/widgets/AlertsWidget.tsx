'use client';

import { AlertManager } from '@/components/AlertManager';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function AlertsWidget(_props: WidgetProps) {
  return (
    <div className="h-full overflow-auto">
      <AlertManager />
    </div>
  );
}

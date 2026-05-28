'use client';

import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function RecommendationsWidget(_props: WidgetProps) {
  return (
    <div className="h-full overflow-auto">
      <RecommendationsPanel />
    </div>
  );
}

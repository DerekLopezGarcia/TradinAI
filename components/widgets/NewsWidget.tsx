'use client';

import { NewsFeed } from '@/components/NewsFeed';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function NewsWidget({ symbol }: WidgetProps) {
  return (
    <div className="h-full overflow-auto">
      <NewsFeed symbol={symbol} />
    </div>
  );
}

'use client';

import { ChatPanel } from '@/components/AIChat';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function ChatWidget({ symbol, timeframe }: WidgetProps) {
  return (
    <div className="h-full">
      <ChatPanel symbol={symbol} timeframe={timeframe} />
    </div>
  );
}

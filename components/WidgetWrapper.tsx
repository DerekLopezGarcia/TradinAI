'use client';

import { GripVertical, X } from 'lucide-react';
import { useWidgetStore } from '@/lib/widgetStore';

interface WidgetWrapperProps {
  title: string;
  widgetId: string;
  children: React.ReactNode;
}

export function WidgetWrapper({ title, widgetId, children }: WidgetWrapperProps) {
  const { editMode, toggleWidget } = useWidgetStore();

  return (
    <div
      className={`bg-card rounded-xl border overflow-hidden flex flex-col h-full transition-all duration-200 ease-out ${
        editMode
          ? 'border-dashed border-primary/40 shadow-sm hover:shadow-lg hover:border-primary/60 hover:scale-[1.01]'
          : 'border-border'
      }`}
    >
      {editMode && (
        <div className="widget-drag-handle flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50 cursor-grab active:cursor-grabbing select-none">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          </div>
          <button
            onClick={() => toggleWidget(widgetId)}
            className="p-0.5 hover:bg-destructive/20 rounded transition-colors shrink-0"
            title="Eliminar widget"
          >
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-auto ${editMode ? '' : ''}`}>
        {children}
      </div>

      {editMode && (
        <div className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg
            viewBox="0 0 10 10"
            className="w-full h-full text-muted-foreground"
            fill="currentColor"
          >
            <path d="M0 10 L10 10 L10 0 Z" opacity="0.3" />
          </svg>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { X, Plus, Check, Grid3x3, Search } from 'lucide-react';
import { useWidgetStore, WIDGET_DEFINITIONS } from '@/lib/widgetStore';
import { getAllWidgets } from '@/lib/widgetRegistry';
import { useTranslation } from '@/lib/i18n/useTranslation';

const widgetTitleKey = (id: string) => `widget.${id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Title`;
const widgetDescKey = (id: string) => `widget.${id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Desc`;

const DRAG_TYPE = 'WIDGET';

export function WidgetsPanel() {
  const { t } = useTranslation();
  const { editMode, enabledWidgets, toggleWidget } = useWidgetStore();
  const [searchQuery, setSearchQuery] = useState('');
  const allWidgets = getAllWidgets();
  const definitions = WIDGET_DEFINITIONS;

  const [{ isOver }, dropConnect] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: (item: { id: string }) => {
      if (!enabledWidgets.includes(item.id)) {
        toggleWidget(item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const dropRef = (node: HTMLDivElement | null) => {
    if (node) dropConnect(node);
  };

  const activeWidgets = definitions.filter((w) => enabledWidgets.includes(w.id));
  const availableWidgets = definitions.filter((w) => !enabledWidgets.includes(w.id));

  const filteredActive = searchQuery
    ? activeWidgets.filter((w) =>
        t(widgetTitleKey(w.id)).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(widgetDescKey(w.id)).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeWidgets;

  const filteredAvailable = searchQuery
    ? availableWidgets.filter((w) =>
        t(widgetTitleKey(w.id)).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(widgetDescKey(w.id)).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableWidgets;

  if (!editMode) return null;

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[270px] bg-card/95 backdrop-blur-md border-r border-border z-40 flex flex-col shadow-2xl transition-all duration-300 ease-out"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">{t('widgetPanel.title')}</h2>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('widgetPanel.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
        </div>
      </div>

      <div
        ref={dropRef}
        className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors duration-200 ${
          isOver ? 'bg-primary/5' : ''
        }`}
      >
        {filteredActive.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {t('widgetPanel.active', { count: filteredActive.length })}
            </p>
            <div className="space-y-1">
              {filteredActive.map((widget) => (
                <DraggableWidgetItem
                  key={widget.id}
                  id={widget.id}
                  title={t(widgetTitleKey(widget.id))}
                  description={t(widgetDescKey(widget.id))}
                  isActive={true}
                  onToggle={() => toggleWidget(widget.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredAvailable.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {t('widgetPanel.available', { count: filteredAvailable.length })}
            </p>
            <div className="space-y-1">
              {filteredAvailable.map((widget) => (
                <DraggableWidgetItem
                  key={widget.id}
                  id={widget.id}
                  title={t(widgetTitleKey(widget.id))}
                  description={t(widgetDescKey(widget.id))}
                  isActive={false}
                  onToggle={() => toggleWidget(widget.id)}
                />
              ))}
            </div>
          </div>
        )}

        {searchQuery && filteredActive.length === 0 && filteredAvailable.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{t('widgetPanel.noResults')}</p>
          </div>
        )}
      </div>

      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-lg pointer-events-none animate-pulse" />
      )}
    </aside>
  );
}

interface DraggableWidgetItemProps {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
}

import { useDrag } from 'react-dnd';

function DraggableWidgetItem({ id, title, description, isActive, onToggle }: DraggableWidgetItemProps) {
  const { t } = useTranslation();
  const [{ isDragging }, dragConnect] = useDrag(() => ({
    type: DRAG_TYPE,
    item: { id },
    canDrag: !isActive,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, isActive]);

  const dragRef = (node: HTMLDivElement | null) => {
    if (node) dragConnect(node);
  };

  return (
    <div
      ref={dragRef as unknown as React.RefObject<HTMLDivElement>}
      className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-150 cursor-default select-none ${
        isDragging
          ? 'opacity-50 scale-95'
          : isActive
            ? 'bg-primary/10 hover:bg-primary/15'
            : 'bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-grab active:cursor-grabbing'
      }`}
      onClick={() => {
        if (!isActive) onToggle();
      }}
      title={isActive ? t('widgetPanel.removeFromDashboard') : t('widgetPanel.addToDashboard')}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-2 p-1 rounded shrink-0 transition-colors ${
          isActive
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-primary hover:bg-primary/10'
        }`}
        title={isActive ? t('widgetPanel.remove') : t('widgetPanel.add')}
      >
        {isActive ? (
          <X className="w-3.5 h-3.5" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

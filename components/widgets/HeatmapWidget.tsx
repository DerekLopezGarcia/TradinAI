'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useOrderBook } from '@/app/hooks/useOrderBook';
import { useStockDepth } from '@/app/hooks/useStockDepth';
import type { WidgetProps } from '@/lib/widgetRegistry';
import type { OrderBookSnapshot, ConnectionState, OrderBookLevel } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/useTranslation';

function isCrypto(symbol: string): boolean {
  return symbol.endsWith('USD') || symbol.endsWith('USDT');
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.01) return p.toFixed(6);
  return p.toFixed(8);
}

function fmtSize(s: number): string {
  if (s >= 1_000_000) return `${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `${(s / 1_000).toFixed(1)}K`;
  if (s >= 1) return s.toFixed(2);
  return s.toFixed(4);
}

const BID_HUE = 142;
const ASK_HUE = 0;

function bidColor(t: number): string {
  return d3.hsl(BID_HUE, 0.75, 0.15 + t * 0.45).toString();
}

function askColor(t: number): string {
  return d3.hsl(ASK_HUE, 0.75, 0.15 + t * 0.45).toString();
}

const M = { top: 8, right: 8, bottom: 28, left: 70 };
const DEFAULT_VISIBLE_LEVELS = 14;

// ==================== STOCK SPREAD VIEW ====================

function StockSpreadView({ snapshot, spread, midPrice }: {
  snapshot: OrderBookSnapshot;
  spread: number;
  midPrice: number;
}) {
  const { t } = useTranslation();
  const bid = snapshot.bids[0];
  const ask = snapshot.asks[0];
  const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
      <div className="flex items-center gap-8 w-full max-w-xs">
        <div className="flex-1 text-center">
          <div className="text-xs text-muted-foreground font-mono mb-1">{t('heatmap.buy')}</div>
          <div className="text-2xl font-bold font-mono text-green-400">
            {formatPrice(bid?.price ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            {t('heatmap.volumeShort')}: {fmtSize(bid?.size ?? 0)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-8 bg-border" />
          <div className="text-lg font-bold font-mono text-foreground">
            {formatPrice(midPrice)}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {t('heatmap.spread')} {formatPrice(spread)} ({spreadPct.toFixed(3)}%)
          </div>
          <div className="w-0.5 h-8 bg-border" />
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs text-muted-foreground font-mono mb-1">{t('heatmap.sell')}</div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {formatPrice(ask?.price ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-1">
            {t('heatmap.volumeShort')}: {fmtSize(ask?.size ?? 0)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs h-3 relative">
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500/20 border-r border-green-500"
            style={{ flex: bid?.size ?? 1 }}
          />
          <div
            className="h-full bg-red-500/20 border-l border-red-500"
            style={{ flex: ask?.size ?? 1 }}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
          style={{
            left: `${bid && ask ? (bid.size / (bid.size + ask.size)) * 100 : 50}%`,
          }}
        />
      </div>
    </div>
  );
}

// ==================== TOOLTIP ====================

interface TooltipData {
  x: number; y: number;
  price: number; size: number; total: number;
  side: 'bid' | 'ask';
}

// ==================== CRYPTO DEPTH HEATMAP ====================

function drawHeatmap({ svg, snapshot, w, h, onTooltip, tr }: {
  svg: SVGSVGElement;
  snapshot: OrderBookSnapshot;
  w: number; h: number;
  onTooltip: (d: TooltipData | null) => void;
  tr: (key: string) => string;
}): void {
  const iw = w - M.left - M.right;
  const ih = h - M.top - M.bottom;
  if (iw < 120 || ih < 40) return;

  const allBids = snapshot.bids;
  const allAsks = snapshot.asks;
  const n = Math.max(allBids.length, allAsks.length);
  if (n === 0) return;

  const bestBid = allBids.length > 0 ? allBids[0].price : 0;
  const bestAsk = allAsks.length > 0 ? allAsks[0].price : 0;
  const spread = bestAsk - bestBid;
  const worstBid = allBids.length > 0 ? allBids[allBids.length - 1].price : 0;
  const worstAsk = allAsks.length > 0 ? allAsks[allAsks.length - 1].price : 0;
  const minP = Math.min(worstBid, worstAsk || Infinity);
  const maxP = Math.max(bestAsk, bestBid || 0);
  if (minP >= maxP) return;

  const maxBidVol = d3.max(allBids, (d) => d.size) ?? 1;
  const maxAskVol = d3.max(allAsks, (d) => d.size) ?? 1;
  const globalMaxVol = Math.max(maxBidVol, maxAskVol, 1);

  const halfW = iw / 2;
  const centerX = M.left + halfW;
  const barAreaH = ih - 14;

  const yScale = d3.scaleLinear()
    .domain([minP, maxP])
    .range([M.top + barAreaH, M.top])
    .nice();

  const xBid = d3.scaleLinear()
    .domain([0, globalMaxVol])
    .range([centerX, M.left + 4]);

  const xAsk = d3.scaleLinear()
    .domain([0, globalMaxVol])
    .range([centerX, M.left + iw - 4]);

  const sel = d3.select(svg);
  sel.attr('role', 'img')
    .attr('aria-label', `Order book depth for ${snapshot.symbol}`);

  let g = sel.select<SVGGElement>('.chart-group');
  if (g.empty()) g = sel.append('g').attr('class', 'chart-group');

  // Compute initial zoom to show ~14 levels around the spread
  const targetLevels = Math.min(DEFAULT_VISIBLE_LEVELS, n);
  const spreadCenter = (bestBid + bestAsk) / 2;
  const spreadToShow = (worstAsk - worstBid) * (targetLevels / n);
  const zoomDomainMin = Math.max(minP, spreadCenter - spreadToShow / 2 - spreadToShow * 0.2);
  const zoomDomainMax = Math.min(maxP, spreadCenter + spreadToShow / 2 + spreadToShow * 0.2);
  const zoomDomain = zoomDomainMax - zoomDomainMin;

  // Zoom behavior (one-time init per SVG)
  if (!(svg as any).__zoomInit) {
    (svg as any).__zoomInit = true;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, Math.max(2, n)])
      .translateExtent([[M.left, M.top], [M.left + iw, M.top + barAreaH]])
      .on('zoom', (event) => {
        (svg as any).__zoomState = event.transform;
        renderBars(event.transform);
        renderAxis(event.transform);
      });

    const fullRange = maxP - minP;
    const k = Math.max(1, Math.min(fullRange / (zoomDomain || 1), n));
    const yCenter = yScale(spreadCenter);
    const translateY = M.top + barAreaH / 2 - yCenter * k;

    const init = d3.zoomIdentity.translate(0, translateY).scale(k);
    (svg as any).__zoomState = init;

    sel.call(zoom);
    sel.call(zoom.transform, init);
  }

  const t = (svg as any).__zoomState || d3.zoomIdentity;
  renderBars(t);
  renderAxis(t);
  renderLegend();

  // ==================== BARS ====================

  function renderBars(tx: d3.ZoomTransform) {
    const yZoomed = (price: number) => tx.applyY(yScale(price));

    const screenMin = M.top - 10;
    const screenMax = M.top + barAreaH + 10;

    const visibleBids = allBids.filter(d => {
      const y = yZoomed(d.price);
      return y >= screenMin && y <= screenMax;
    });
    const visibleAsks = allAsks.filter(d => {
      const y = yZoomed(d.price);
      return y >= screenMin && y <= screenMax;
    });

    const barH = Math.max(3, Math.min(30, barAreaH / Math.max(visibleBids.length + visibleAsks.length, 1) * 0.8));

    // ---- BIDS ----
    const bidGroup = g.select<SVGGElement>('.bid-group');
    if (bidGroup.empty()) g.append('g').attr('class', 'bid-group');
    const bidRects = g.select('.bid-group').selectAll<SVGRectElement, OrderBookLevel>('rect')
      .data(visibleBids, (d: any) => String(d.price));

    const bidEnter = bidRects.enter()
      .append('rect')
      .attr('class', 'bid-bar')
      .attr('rx', 2).attr('ry', 2);

    bidRects.merge(bidEnter as any)
      .attr('x', (d) => xBid(d.size))
      .attr('y', (d) => yZoomed(d.price) - barH / 2)
      .attr('width', (d) => Math.max(0, centerX - xBid(d.size)))
      .attr('height', barH)
      .attr('fill', (d) => bidColor(Math.min(1, d.size / globalMaxVol)))
      .attr('aria-label', (d) => `Buy ${formatPrice(d.price)}, vol ${fmtSize(d.size)}`);

    bidRects.exit().remove();

    // ---- ASKS ----
    const askGroup = g.select<SVGGElement>('.ask-group');
    if (askGroup.empty()) g.append('g').attr('class', 'ask-group');
    const askRects = g.select('.ask-group').selectAll<SVGRectElement, OrderBookLevel>('rect')
      .data(visibleAsks, (d: any) => String(d.price));

    const askEnter = askRects.enter()
      .append('rect')
      .attr('class', 'ask-bar')
      .attr('rx', 2).attr('ry', 2);

    askRects.merge(askEnter as any)
      .attr('x', centerX)
      .attr('y', (d) => yZoomed(d.price) - barH / 2)
      .attr('width', (d) => Math.max(0, xAsk(d.size) - centerX))
      .attr('height', barH)
      .attr('fill', (d) => askColor(Math.min(1, d.size / globalMaxVol)))
      .attr('aria-label', (d) => `Sell ${formatPrice(d.price)}, vol ${fmtSize(d.size)}`);

    askRects.exit().remove();

    // Tooltip events (using event delegation on the chart group)
    g.selectAll('.bid-bar, .ask-bar')
      .on('mouseenter', function (event: MouseEvent, d: any) {
        const rect = svg.getBoundingClientRect();
        const side = d3.select(this).classed('bid-bar') ? 'bid' as const : 'ask' as const;
        onTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 8, price: d.price, size: d.size, total: d.total, side });
      })
      .on('mouseleave', () => onTooltip(null));

    // Center spread line
    if (spread > 0 && bestBid > 0) {
      let spreadLine = g.select<SVGLineElement>('.center-line');
      if (spreadLine.empty()) {
        spreadLine = g.append('line').attr('class', 'center-line');
      }
      const yBid = yZoomed(bestBid);
      const yAsk = yZoomed(bestAsk);
      if (Math.abs(yBid - yAsk) > 2) {
        spreadLine
          .attr('x1', M.left + 4)
          .attr('x2', M.left + iw - 4)
          .attr('y1', yBid)
          .attr('y2', yAsk)
          .attr('stroke', '#a1a1aa')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.4)
          .style('display', null);
      } else {
        spreadLine.style('display', 'none');
      }
    }
  }

  // ==================== Y-AXIS ====================

  function renderAxis(tx: d3.ZoomTransform) {
    const yZoomed = (price: number) => tx.applyY(yScale(price));
    const screenMin = M.top;
    const screenMax = M.top + barAreaH;

    let startPrice = yScale.invert(screenMin);
    let endPrice = yScale.invert(screenMax);
    startPrice = Math.max(minP, startPrice);
    endPrice = Math.min(maxP, endPrice);

    const visibleTicks = d3.scaleLinear()
      .domain([startPrice, endPrice])
      .nice()
      .ticks(Math.max(2, Math.floor(barAreaH / 30)));

    let yAxis = g.select<SVGGElement>('.y-axis');
    if (yAxis.empty()) yAxis = g.append('g').attr('class', 'y-axis');

    const tickTexts = yAxis.selectAll<SVGTextElement, number>('text')
      .data(visibleTicks, (d: any) => String(d));

    tickTexts.enter()
      .append('text')
      .merge(tickTexts as any)
      .attr('x', M.left - 6)
      .attr('y', (d) => {
        const pos = yZoomed(d);
        return Math.max(M.top, Math.min(M.top + barAreaH, pos));
      })
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)
      .attr('font-family', 'ui-monospace, monospace')
      .text((d) => formatPrice(d));

    tickTexts.exit().remove();
  }

  // ==================== LEGEND ====================

  function renderLegend() {
    let legend = g.select<SVGGElement>('.legend-group');
    if (legend.empty()) legend = g.append('g').attr('class', 'legend-group');

    const legendY = h - 6;
    const legendW = 160;
    const legendX = centerX - legendW / 2;
    const gradId = `heat-grad-${snapshot.symbol.replace(/[^a-zA-Z0-9]/g, '')}-${(svg as any).__legendIdx || 0}`;

    const grad = sel.select('defs').selectAll(`#${CSS.escape(gradId)}`)
      .data([0])
      .join('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');

    grad.selectAll('stop').remove();
    grad.append('stop').attr('offset', '0%').attr('stop-color', bidColor(0));
    grad.append('stop').attr('offset', '25%').attr('stop-color', bidColor(1));
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#333');
    grad.append('stop').attr('offset', '75%').attr('stop-color', askColor(0));
    grad.append('stop').attr('offset', '100%').attr('stop-color', askColor(1));

    const legLabels = legend.selectAll<SVGTextElement, string>('text.label')
      .data([tr('heatmap.low'), tr('heatmap.high')])
      .join('text')
      .attr('class', 'label')
      .attr('text-anchor', (d) => d === tr('heatmap.low') ? 'end' : 'start')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#71717a').attr('font-size', 9)
      .attr('font-family', 'ui-monospace, monospace')
      .attr('x', (d) => d === tr('heatmap.low') ? legendX - 4 : legendX + legendW + 4)
      .attr('y', legendY)
      .text((d) => d);

    legend.selectAll('rect.gradient').remove();
    legend.append('rect')
      .attr('class', 'gradient')
      .attr('x', legendX).attr('y', legendY - 5)
      .attr('width', legendW).attr('height', 10)
      .attr('fill', `url(#${gradId})`)
      .attr('rx', 3).attr('ry', 3);

    const bidLabel = legend.selectAll<SVGTextElement, string>('text.side-bid')
      .data([tr('heatmap.buy')])
      .join('text')
      .attr('class', 'side-bid')
      .attr('x', centerX - 40).attr('y', M.top + 10)
      .attr('text-anchor', 'end').attr('fill', '#22c55e')
      .attr('font-size', 10).attr('font-weight', 600)
      .attr('font-family', 'ui-monospace, monospace').attr('opacity', 0.7)
      .text(tr('heatmap.buy'));

    const askLabel = legend.selectAll<SVGTextElement, string>('text.side-ask')
      .data([tr('heatmap.sell')])
      .join('text')
      .attr('class', 'side-ask')
      .attr('x', centerX + 40).attr('y', M.top + 10)
      .attr('text-anchor', 'start').attr('fill', '#ef4444')
      .attr('font-size', 10).attr('font-weight', 600)
      .attr('font-family', 'ui-monospace, monospace').attr('opacity', 0.7)
      .text(tr('heatmap.sell'));
  }
}

// ==================== MAIN WIDGET ====================

export function HeatmapWidget({ symbol }: WidgetProps) {
  const { t } = useTranslation();
  const crypto = useMemo(() => isCrypto(symbol), [symbol]);

  const cryptoDepth = useOrderBook(crypto ? symbol : '');
  const stockDepth = useStockDepth(!crypto ? symbol : '');

  const { snapshot, connectionState, spread, midPrice, bidTotal, askTotal, isLoading, error } =
    crypto ? cryptoDepth : stockDepth;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drawVersion = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          (svgRef.current as any)?.__zoomInit && ((svgRef.current as any).__zoomInit = false);
          setDimensions({ w: width, h: height });
        }
      }, 200);
    });
    observer.observe(container);
    return () => {
      clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !snapshot || !crypto || dimensions.w === 0 || dimensions.h === 0) return;
    drawVersion.current++;
    drawHeatmap({
      svg: svgRef.current,
      snapshot,
      w: dimensions.w,
      h: dimensions.h,
      onTooltip: setTooltip,
      tr: t,
    });
  }, [snapshot, dimensions, crypto]);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    (svg as any).__zoomInit = false;
    if (snapshot) {
      setDimensions(prev => ({ ...prev }));
    }
  }, [snapshot]);

  const statusColor: Record<ConnectionState, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-gray-500',
    error: 'bg-red-500',
  };

  const clipX = Math.max(0, Math.min((tooltip?.x ?? 0), dimensions.w - 140));
  const clipY = Math.max(0, Math.min((tooltip?.y ?? 0), dimensions.h - 100));

  return (
    <div className="h-full flex flex-col overflow-hidden" role="region" aria-label={t('heatmap.regionAria', { symbol })}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor[connectionState]}`} aria-hidden />
          <span className="text-xs font-semibold text-foreground font-mono">
            {crypto ? symbol.replace('USD', '') : symbol}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {t('heatmap.mid')}: <span className="text-foreground">{formatPrice(midPrice)}</span>
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {t('heatmap.spread')} <span className="text-foreground">{formatPrice(spread)}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-green-400">{t('heatmap.bid')}: {fmtSize(bidTotal)}</span>
          <span className="text-red-400">{t('heatmap.ask')}: {fmtSize(askTotal)}</span>
          {crypto && (
            <button
              onClick={resetZoom}
              className="px-2 py-0.5 text-[10px] bg-muted hover:bg-muted/80 rounded transition-colors"
              aria-label={t('heatmap.resetAria')}
            >
              {t('heatmap.reset')}
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative min-h-0">
        {isLoading && !snapshot ? (
          <div className="h-full flex items-center justify-center" role="status" aria-label="Loading data">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="sr-only">{t('heatmap.loading')}</span>
          </div>
        ) : error && !snapshot ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-destructive text-xs text-center">{t(error)}</p>
          </div>
        ) : !crypto && snapshot ? (
          <StockSpreadView snapshot={snapshot} spread={spread} midPrice={midPrice} />
        ) : crypto && snapshot ? (
          <svg
            ref={svgRef}
            className="w-full h-full"
            role="img"
            aria-label={t('heatmap.regionAria', { symbol })}
            tabIndex={0}
            aria-live="polite"
          />
        ) : null}

        {tooltip && snapshot && crypto && (
          <div
            className="absolute pointer-events-none z-50 bg-popover/95 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${clipX}px`,
              top: `${clipY}px`,
              transform: `translate(${tooltip.x > dimensions.w / 2 ? -100 : 0}%, -100%)`,
            }}
            role="tooltip"
          >
            <div className={`font-bold font-mono ${tooltip.side === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
              {tooltip.side === 'bid' ? `◀ ${t('heatmap.buy')}` : `${t('heatmap.sell')} ▶`}
            </div>
            <div className="text-foreground font-mono mt-0.5">{formatPrice(tooltip.price)}</div>
            <div className="text-muted-foreground font-mono">{t('heatmap.volumeShort')}: {fmtSize(tooltip.size)}</div>
            <div className="text-muted-foreground font-mono">{t('heatmap.cumulativeShort')}: {fmtSize(tooltip.total)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeatmapWidget;

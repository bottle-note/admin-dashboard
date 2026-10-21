import { useEffect, useRef, useState } from 'react';
import {
  Graph,
  NodeEvent,
  CanvasEvent,
  GraphEvent,
  type GraphData,
  type NodeData,
  type IPointerEvent,
  type IElementEvent,
  type ElementDatum,
} from '@antv/g6';
import { relationshipStates } from './relationship-states';
import { Button } from '@/components/ui/button';

export function RelationshipCanvas({
  data,
  selectedId,
  onSelect,
  expanded = false,
}: {
  expanded?: boolean;
  data: GraphData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const initialDataRef = useRef(data);
  const updateRef = useRef<((next: GraphData) => void) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const hoverRef = useRef<string | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const [zoom, setZoom] = useState(1);
  async function fit(graph: Graph) {
    await graph.fitView();
    if (graph.getZoom() > 1) {
      await graph.zoomTo(1, false);
      await graph.fitCenter(false);
    }
  }
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    selectRef.current = onSelect;
    selectedRef.current = selectedId;
  }, [onSelect, selectedId]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let ready = false;
    let currentData: GraphData = initialDataRef.current;
    const labels = new Map<string, string>();
    const isEmphasized = (id: string) => id === selectedRef.current || id === hoverRef.current;
    const showDetail = (id: string) =>
      isEmphasized(id) || (graphRef.current?.getZoom() ?? 1) >= 0.85;
    const graph = new Graph({
      container,
      autoResize: true,
      padding: 24,
      animation: false,
      zoomRange: [0.05, 3],
      data: { nodes: [], edges: [] },
      layout: {
        type: 'd3-force',
        // Keep simulation ticks connected to the renderer when dragging reheats it.
        animation: true,
        preventOverlap: true,
        nodeSize: (node: NodeData) => (node.id.startsWith('alcohol-') ? 190 : 180),
        nodeSpacing: 12,
        linkDistance: 130,
        nodeStrength: -180,
        collideStrength: 1,
        collideIterations: 3,
        alphaDecay: 0.045,
        velocityDecay: 0.4,
      },
      node: {
        type: (node) => (node.type === 'image' ? 'image' : 'rect'),
        // Reserve collision space for expanded nodes, but keep the overview compact.
        style: {
          size: (node) => {
            if (node.type === 'image') {
              const scale = Math.min(2, Math.max(1, 0.7 / (graphRef.current?.getZoom() ?? 1)));
              return [36 * scale, 64 * scale];
            }
            return isEmphasized(node.id) || (graphRef.current?.getZoom() ?? 1) >= 0.55
              ? [160, 46]
              : [40, 14];
          },
          fill: (node) => node.style?.fill ?? '#edf5f3',
          stroke: (node) => node.style?.stroke ?? '#89aaa1',
          radius: 15,
          labelPlacement: (node) => (node.type === 'image' ? 'bottom' : 'center'),
          labelPointerEvents: 'none',
          labelWordWrap: true,
          labelMaxWidth: (node) => (node.type === 'image' ? 160 : 144),
          labelMaxLines: 2,
          labelTextOverflow: '…',
          labelText: (node) => {
            const label = labels.get(node.id) ?? '';
            const visible =
              node.type === 'image'
                ? showDetail(node.id)
                : isEmphasized(node.id) || (graphRef.current?.getZoom() ?? 1) >= 0.55;
            return visible ? label : '';
          },
          labelFontSize: (node) =>
            node.type === 'image'
              ? Math.max(13, (isEmphasized(node.id) ? 13 : 9) / (graphRef.current?.getZoom() ?? 1))
              : 12,
          labelLineHeight: (node) =>
            node.type === 'image'
              ? Math.max(17, (isEmphasized(node.id) ? 17 : 12) / (graphRef.current?.getZoom() ?? 1))
              : 16,
          labelBackground: (node) => node.type === 'image' && isEmphasized(node.id),
          labelBackgroundFill: '#ffffff',
          labelBackgroundRadius: 3,
          labelPadding: [3, 5],
          opacity: 1,
          fillOpacity: 1,
          labelOpacity: 1,
          labelFillOpacity: 1,
          halo: false,
          lineWidth: 1,
        },
        state: {
          normal: { opacity: 1, halo: false, lineWidth: 1 },
          chosen: {
            opacity: 1,
            halo: true,
            haloStroke: '#0f766e',
            haloLineWidth: 4,
            haloStrokeOpacity: 0.18,
            stroke: '#0f766e',
            lineWidth: 2,
          },
          related: { opacity: 1, halo: false, lineWidth: 1 },
          muted: { opacity: 0.3, halo: false, lineWidth: 1 },
          hovered: {
            opacity: 1,
            halo: true,
            haloStroke: '#0f766e',
            haloLineWidth: 2,
            haloStrokeOpacity: 0.12,
            stroke: '#0f766e',
            lineWidth: 1.5,
          },
        },
      },
      edge: {
        style: { stroke: '#94a3b8', lineWidth: 1, opacity: 0.65 },
        state: {
          normal: { stroke: '#94a3b8', lineWidth: 1, opacity: 0.65 },
          related: { stroke: '#0f766e', lineWidth: 2, opacity: 1 },
          muted: { stroke: '#94a3b8', lineWidth: 1, opacity: 0.06 },
        },
      },
      plugins: [
        {
          type: 'tooltip',
          enable: (_event: IElementEvent, items: ElementDatum[]) =>
            items.some((item) => labels.has(item.id ?? '')),
          getContent: async (_event: IElementEvent, items: ElementDatum[]) => {
            const content = document.createElement('div');
            content.style.cssText =
              'max-width:280px;white-space:pre-wrap;overflow-wrap:anywhere;padding:4px 6px;line-height:1.6';
            const node = items[0];
            content.textContent = node
              ? String(node.data?.detailLabel ?? labels.get(node.id ?? '') ?? '')
              : '';
            return content;
          },
        },
      ],
      behaviors: ['drag-canvas', 'zoom-canvas', { type: 'drag-element-force', fixed: false }],
    });
    graphRef.current = graph;
    let frame = 0;
    let hoverTimer = 0;
    let dragging = false;
    const sync = () => {
      if (!ready || disposed || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (disposed) return;
        // Apply emphasis in one render; never flash the normal graph first.
        void graph
          .setElementState(
            relationshipStates(currentData, selectedRef.current, hoverRef.current),
            false
          )
          .catch((cause: unknown) => console.error('Attribute graph emphasis failed', cause));
      });
    };
    syncRef.current = sync;
    const queueHover = (id: string | null) => {
      window.clearTimeout(hoverTimer);
      if (dragging) return;
      hoverTimer = window.setTimeout(() => {
        if (disposed || dragging || hoverRef.current === id) return;
        hoverRef.current = id;
        sync();
      }, 100);
    };
    const leave = () => queueHover(null);
    container.addEventListener('pointerleave', leave);
    graph.on(NodeEvent.CLICK, (event: IPointerEvent) => {
      const id = String((event.target as { id?: string }).id ?? '');
      selectedRef.current = id;
      selectRef.current(id);
      sync();
    });
    graph.on(NodeEvent.POINTER_ENTER, (event: IPointerEvent) => {
      queueHover(String((event.target as { id?: string }).id ?? ''));
    });
    graph.on(NodeEvent.POINTER_LEAVE, leave);
    graph.on(NodeEvent.DRAG_START, (event: IPointerEvent) => {
      dragging = true;
      window.clearTimeout(hoverTimer);
      hoverRef.current = String((event.target as { id?: string }).id ?? '');
      sync();
    });
    graph.on(NodeEvent.DRAG_END, () => {
      dragging = false;
      leave();
    });
    graph.on(CanvasEvent.CLICK, () => {
      selectedRef.current = null;
      hoverRef.current = null;
      selectRef.current(null);
      sync();
    });
    graph.on(GraphEvent.AFTER_TRANSFORM, () => {
      setZoom(graph.getZoom());
      sync();
    });
    const images = new Map<string, Promise<HTMLImageElement>>();
    const loadImage = (source: string) => {
      const cached = images.get(source);
      if (cached) return cached;
      const pending = new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => {
          if (element.getAttribute('src') === '/images/whisky-node.svg') {
            images.delete(source);
            reject(new Error('술병 이미지를 불러오지 못했습니다.'));
          } else element.src = '/images/whisky-node.svg';
        };
        element.src = source;
      });
      images.set(source, pending);
      return pending;
    };
    let pendingData: GraphData | null = null;
    let rendering = false;
    let hasRendered = false;
    const update = async () => {
      if (rendering || disposed) return;
      rendering = true;
      ready = false;
      try {
        while (pendingData && !disposed) {
          const next = pendingData;
          pendingData = null;
          const previous = new Map(
            (hasRendered ? graph.getNodeData() : []).map((node) => [node.id, node])
          );
          const nodes = await Promise.all(
            (next.nodes ?? []).map(async (node) => {
              const position = previous.get(node.id)?.style;
              const style = { ...node.style };
              if (position) {
                style.x = position.x;
                style.y = position.y;
              }
              if (node.type === 'image' && typeof style.src === 'string')
                style.src = await loadImage(style.src);
              return { ...node, style };
            })
          );
          if (disposed) return;
          // Coalesce rapid requests; never replace the canvas or reset its viewport.
          if (pendingData) continue;
          currentData = next;
          labels.clear();
          for (const node of next.nodes ?? [])
            labels.set(node.id, String(node.style?.labelText ?? ''));
          graph.setData({ ...next, nodes });
          await graph.render();
          if (disposed) return;
          if (!hasRendered) await fit(graph);
          if (disposed) return;
          hasRendered = true;
          setError(null);
          setZoom(graph.getZoom());
          container.querySelectorAll('canvas').forEach((canvas) => {
            canvas.tabIndex = -1;
          });
        }
        ready = true;
        sync();
      } catch (cause) {
        if (!disposed) {
          console.error('Attribute graph render failed', cause);
          setError('그래프를 표시하지 못했습니다. 조건을 좁히거나 다시 조회해 주세요.');
        }
      } finally {
        rendering = false;
      }
    };
    updateRef.current = (next) => {
      pendingData = next;
      void update();
    };
    const observer = new ResizeObserver(() => {
      if (!disposed && ready) {
        graph.resize();
        // Resizing must not discard the user's zoom and pan position.
      }
    });
    observer.observe(container);
    return () => {
      disposed = true;
      updateRef.current = null;
      pendingData = null;
      window.clearTimeout(hoverTimer);
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener('pointerleave', leave);
      hoverRef.current = null;
      syncRef.current = null;
      graphRef.current = null;
      graph.destroy();
    };
  }, []);
  useEffect(() => {
    updateRef.current?.(data);
  }, [data]);
  useEffect(() => {
    selectedRef.current = selectedId;
    syncRef.current?.();
  }, [selectedId, data]);
  const changeZoom = (factor: number) => {
    const graph = graphRef.current;
    if (graph)
      void graph
        .zoomTo(Math.min(3, Math.max(0.05, graph.getZoom() * factor)), false)
        .catch((cause: unknown) => console.error('Attribute graph zoom failed', cause));
  };
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape') onSelect(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs text-slate-500">
        <span className="shrink-0 whitespace-nowrap">
          위스키 · 속성 값{' '}
          <span className="ml-2 hidden text-slate-400 sm:inline">
            드래그로 이동 · 휠로 확대 · 선택하면 상세 보기
          </span>
        </span>
        <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
          <Button
            variant="ghost"
            size="sm"
            aria-label="그래프 축소"
            onClick={() => changeZoom(1 / 1.25)}
          >
            −
          </Button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="그래프 확대"
            onClick={() => changeZoom(1.25)}
          >
            +
          </Button>
          <Button variant="ghost" size="sm" disabled={!selectedId} onClick={() => onSelect(null)}>
            선택 해제
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (graphRef.current)
                void fit(graphRef.current).catch((cause: unknown) =>
                  console.error('Attribute graph fit failed', cause)
                );
            }}
          >
            화면에 맞추기
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="p-3 text-xs text-red-700">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        role="img"
        aria-label="G6 위스키 중심 속성 관계 그래프"
        className={
          expanded
            ? 'h-[calc(100dvh-270px)] min-h-80 w-full'
            : 'h-[max(440px,calc(100dvh-480px))] w-full'
        }
      />
    </div>
  );
}

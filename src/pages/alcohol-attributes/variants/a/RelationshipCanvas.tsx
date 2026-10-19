import { useEffect, useRef, useState } from 'react';
import {
  Graph,
  NodeEvent,
  CanvasEvent,
  GraphEvent,
  type GraphData,
  type IPointerEvent,
} from '@antv/g6';
import { relationshipStates } from './relationship-states';
import { Button } from '@/components/ui/button';

export function RelationshipCanvas({
  data,
  selectedId,
  onSelect,
}: {
  data: GraphData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
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
    const labels = new Map(
      (data.nodes ?? []).map((node) => [node.id, String(node.style?.labelText ?? '')])
    );
    const isEmphasized = (id: string) => id === selectedRef.current || id === hoverRef.current;
    const graph = new Graph({
      container,
      autoResize: true,
      autoFit: 'view',
      padding: 24,
      animation: false,
      zoomRange: [0.05, 3],
      data,
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 110,
        nodeSpacing: 24,
        linkDistance: 150,
      },
      node: {
        // Force layout writes its collision diameter into data.style.size.
        // Keep visual dimensions independent from that layout output.
        style: {
          size: (node) => (node.type === 'image' ? [48, 80] : [164, 52]),
          labelText: (node) => {
            const label = labels.get(node.id) ?? '';
            if (isEmphasized(node.id) || (graphRef.current?.getZoom() ?? 1) >= 0.6) return label;
            return node.type === 'image' ? '' : label.split('\n')[0];
          },
          labelFontSize: (node) =>
            Math.max(13, (isEmphasized(node.id) ? 13 : 9) / (graphRef.current?.getZoom() ?? 1)),
          labelLineHeight: (node) =>
            Math.max(17, (isEmphasized(node.id) ? 17 : 12) / (graphRef.current?.getZoom() ?? 1)),
          labelBackground: (node) => isEmphasized(node.id),
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
          normal: { opacity: 1, halo: false, lineWidth: 1, stroke: '#89aaa1' },
          chosen: {
            opacity: 1,
            halo: true,
            haloStroke: '#0f766e',
            haloLineWidth: 4,
            haloStrokeOpacity: 0.18,
            stroke: '#0f766e',
            lineWidth: 2,
          },
          related: { opacity: 1, halo: false, lineWidth: 1, stroke: '#89aaa1' },
          muted: { opacity: 0.55, halo: false, lineWidth: 1, stroke: '#89aaa1' },
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
          muted: { stroke: '#94a3b8', lineWidth: 1, opacity: 0.2 },
        },
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
    });
    graphRef.current = graph;
    const sync = () => {
      if (!ready || disposed) return;
      void graph
        .draw()
        .then(() =>
          graph.setElementState(relationshipStates(data, selectedRef.current, hoverRef.current))
        )
        .catch((cause: unknown) => console.error('Attribute graph emphasis failed', cause));
    };
    syncRef.current = sync;
    const leave = () => {
      hoverRef.current = null;
      sync();
    };
    container.addEventListener('pointerleave', leave);
    graph.on(NodeEvent.CLICK, (event: IPointerEvent) => {
      const id = String((event.target as { id?: string }).id ?? '');
      selectedRef.current = id;
      selectRef.current(id);
      sync();
    });
    graph.on(NodeEvent.POINTER_ENTER, (event: IPointerEvent) => {
      hoverRef.current = String((event.target as { id?: string }).id ?? '');
      sync();
    });
    graph.on(NodeEvent.POINTER_LEAVE, leave);
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
    const timer = window.setTimeout(() => {
      Promise.all(
        (data.nodes ?? []).map(async (node) => {
          if (node.type !== 'image' || typeof node.style?.src !== 'string') return node;
          // CDN 이미지에는 CORS 헤더가 없어 기본 anonymous 로더 대신 이미지 요소를 전달한다.
          const source = node.style.src;
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => {
              if (element.getAttribute('src') === '/images/whisky-node.svg')
                reject(new Error('술병 이미지를 불러오지 못했습니다.'));
              else element.src = '/images/whisky-node.svg';
            };
            element.src = source;
          });
          return { ...node, style: { ...node.style, src: img } };
        })
      )
        .then(async (nodes) => {
          if (disposed) return;
          graph.setData({ ...data, nodes });
          await graph.render();
        })
        .then(async () => {
          if (disposed) return;
          await fit(graph);
          if (disposed) return;
          ready = true;
          setError(null);
          setZoom(graph.getZoom());
          container.querySelectorAll('canvas').forEach((canvas) => {
            canvas.tabIndex = -1;
          });
          sync();
        })
        .catch((cause: unknown) => {
          if (!disposed) {
            console.error('Attribute graph render failed', cause);
            setError('그래프를 표시하지 못했습니다. 아래 노드 목록에서 관계를 조회할 수 있습니다.');
          }
        });
    }, 0);
    const observer = new ResizeObserver(() => {
      if (!disposed && ready) {
        graph.resize();
        void fit(graph).catch((cause: unknown) =>
          console.error('Attribute graph resize failed', cause)
        );
      }
    });
    observer.observe(container);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer.disconnect();
      container.removeEventListener('pointerleave', leave);
      hoverRef.current = null;
      syncRef.current = null;
      graphRef.current = null;
      graph.destroy();
    };
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
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-slate-500">
        <span>술병 · 속성 값</span>
        <div className="ml-auto flex items-center gap-1">
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
        className="h-[clamp(280px,calc(100dvh-490px),560px)] w-full"
      />
    </div>
  );
}

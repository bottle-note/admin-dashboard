import { useEffect, useRef, useState } from 'react';
import { Graph, NodeEvent, type GraphData, type IPointerEvent } from '@antv/g6';
import { Button } from '@/components/ui/button';

export function RelationshipCanvas({
  data,
  focusId,
  selectedId,
  onSelect,
}: {
  data: GraphData;
  focusId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const graphRef = useRef<Graph | null>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
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
    readyRef.current = false;
    const graph = new Graph({
      container,
      autoResize: true,
      autoFit: 'view',
      padding: 36,
      animation: false,
      zoomRange: [0.25, 3],
      data,
      layout: focusId
        ? {
            type: 'radial',
            focusNode: focusId,
            unitRadius: 170,
            preventOverlap: true,
            nodeSize: 110,
            nodeSpacing: 30,
          }
        : {
            type: 'force',
            preventOverlap: true,
            nodeSize: 110,
            nodeSpacing: 40,
            linkDistance: 180,
          },
      node: {
        state: {
          selected: { halo: true, haloStroke: '#d7813d', haloLineWidth: 8 },
          active: { halo: true },
          inactive: { opacity: 0.35 },
        },
      },
      edge: {
        style: { stroke: '#9aa6b4', lineWidth: 1.5 },
        state: { active: { stroke: '#d7813d', lineWidth: 3 }, inactive: { opacity: 0.15 } },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'drag-element',
        { type: 'hover-activate', degree: 1, inactiveState: 'inactive' },
      ],
    });
    graphRef.current = graph;
    graph.on(NodeEvent.CLICK, (event: IPointerEvent) =>
      selectRef.current(String((event.target as { id?: string }).id ?? ''))
    );
    const timer = window.setTimeout(() => {
      graph
        .render()
        .then(async () => {
          if (disposed) return;
          await fit(graph);
          if (disposed) return;
          ready = true;
          readyRef.current = true;
          setError(null);
          if (selectedRef.current && data.nodes?.some((node) => node.id === selectedRef.current))
            await graph.setElementState({ [selectedRef.current]: ['selected'] });
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
      graphRef.current = null;
      graph.destroy();
    };
  }, [data, focusId]);
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !readyRef.current) return;
    void graph
      .setElementState(
        Object.fromEntries(
          (data.nodes ?? []).map((node) => [node.id, node.id === selectedId ? ['selected'] : []])
        )
      )
      .catch((cause: unknown) => console.error('Attribute graph selection failed', cause));
  }, [selectedId, data]);
  return (
    <div>
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-slate-500">
        <span>술병 = 위스키 · 사각형 = 속성 · 드래그 이동 / 휠 확대·축소</span>
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
      {error && (
        <p role="alert" className="p-3 text-xs text-red-700">
          {error}
        </p>
      )}
      <div
        ref={containerRef}
        role="img"
        aria-label="G6 위스키 중심 속성 관계 그래프"
        className="h-[42dvh] w-full"
      />
    </div>
  );
}

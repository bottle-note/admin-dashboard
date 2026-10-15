/**
 * 태그 그룹 ↔ 테이스팅 태그 관계 그래프 (AntV G6)
 * - 목록 탭이 받아 둔 그룹 목록을 그대로 노드·엣지로 바꿔 그린다. 추가 API 호출은 없다.
 * - 보기 방식 5종은 G6 예제 갤러리를 우리 데이터에 맞게 옮긴 것이다.
 *   dendrogram: Scene Case · Radial Dendrogram / mindmap: TreeGraph · Mind Map /
 *   fishbone: TreeGraph · Fishbone / combo: Combo Combined Layout / circular: Circular + Edge Bundling
 * - 트리 계열(dendrogram·mindmap·fishbone)은 루트 → 그룹 → 태그 구조라 여러 그룹에 속한 태그를
 *   그룹마다 한 번씩 두고 점선 테두리로 표시한다. 콤보·원형은 태그 노드 하나에 엣지만 여러 개 잇는다.
 * - 그래프 영역은 main의 남는 높이를 그대로 쓰고 전체를 그 안에 맞춘다(확대는 하지 않는다).
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Graph,
  NodeEvent,
  type ComboData,
  type EdgeData,
  type GraphData,
  type IPointerEvent,
  type NodeData,
} from '@antv/g6';

import type { TastingGroupItem, TastingGroupRole } from '@/types/api';
import { ROLE_LABEL, familyColorScale, type GraphLayout } from './tasting-group.schema';
import { formatNumber } from '@/lib/format';

interface TastingGroupGraphProps {
  groups: TastingGroupItem[];
  layout: GraphLayout;
  /** 보조 태그(0.4)까지 그릴지. 끄면 그룹과 대표 태그만 그려 작은 영역에서도 읽힌다 */
  showPeripheral: boolean;
  selectedCode: string | null;
  onSelect: (groupCode: string) => void;
}

const ROOT_ID = 'root';

const hubId = (code: string) => `group:${code}`;
const tagNodeId = (id: number, code?: string) => (code ? `tag:${id}:${code}` : `tag:${id}`);
const comboId = (code: string) => `combo:${code}`;

/** 밝은 계열색 위에서는 어두운 글자를 써서 대비를 지킨다 */
function readableTextOn(hex: string) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1f2937' : '#ffffff';
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** shadcn CSS 변수(HSL 성분)를 캔버스가 쓸 수 있는 색 문자열로 바꾼다 */
function themeColors() {
  const fallback = {
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#64748b',
    isDark: false,
  };
  if (typeof window === 'undefined') return fallback;
  const root = document.documentElement;
  const read = (name: string, defaultValue: string) => {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return value ? `hsl(${value})` : defaultValue;
  };
  return {
    background: read('--background', fallback.background),
    foreground: read('--foreground', fallback.foreground),
    muted: read('--muted-foreground', fallback.muted),
    isDark: root.classList.contains('dark'),
  };
}

type Colors = ReturnType<typeof themeColors>;

/** 그래프가 차지할 수 있는 영역. 화면에 스크롤이 생기지 않도록 main의 남는 높이로 정한다 */
interface Box {
  width: number;
  height: number;
}

interface TagInfo {
  tag: TastingGroupItem['tags'][number];
  group: TastingGroupItem;
  color: string;
  shared: boolean;
}

const textWidth = (name: string, charWidth: number, pad: number) =>
  Math.max(32, name.length * charWidth + pad);

const NO_FAMILY = '계열 없음';
const colorScale = familyColorScale;

function sharedCounts(groups: TastingGroupItem[]) {
  const counts = new Map<number, number>();
  groups.forEach((group) =>
    group.tags.forEach((tag) =>
      counts.set(tag.tastingTagId, (counts.get(tag.tastingTagId) ?? 0) + 1)
    )
  );
  return counts;
}

// ============================================
// 노드 스타일
// ============================================

function hubNode(
  group: TastingGroupItem,
  color: string,
  colors: Colors,
  shape: 'circle' | 'pill'
): NodeData {
  const name = group.name;
  const common = {
    kind: 'hub',
    code: group.code,
    name,
    family: group.family ?? NO_FAMILY,
    tagCount: group.tags.length,
  };
  if (shape === 'pill') {
    return {
      id: hubId(group.code),
      type: 'rect',
      data: common,
      style: {
        size: [textWidth(name, 13, 28), 32],
        radius: 16,
        fill: color,
        stroke: colors.background,
        lineWidth: 2,
        labelText: name,
        labelPlacement: 'center',
        labelFill: readableTextOn(color),
        labelFontSize: 12,
        labelFontWeight: 600,
        haloStroke: color,
        cursor: 'pointer',
        zIndex: 3,
      },
    };
  }
  return {
    id: hubId(group.code),
    type: 'circle',
    data: common,
    style: {
      size: 46,
      fill: color,
      stroke: colors.background,
      lineWidth: 2,
      labelText: name,
      labelPlacement: 'center',
      labelFill: readableTextOn(color),
      labelFontSize: 10,
      labelFontWeight: 600,
      labelWordWrap: true,
      labelMaxWidth: 40,
      labelMaxLines: 2,
      haloStroke: color,
      cursor: 'pointer',
      zIndex: 3,
    },
  };
}

/** 태그 노드. 트리 계열은 그룹별 복제 id를 쓰고, 그 외는 태그당 하나다 */
function tagNode(
  info: TagInfo,
  colors: Colors,
  shape: 'pill' | 'dot' | 'label',
  idSuffix?: string
): NodeData {
  const { tag, group, color, shared } = info;
  const isCore = tag.role.code === 'CORE';
  const data = {
    kind: 'tag',
    name: tag.korName,
    role: tag.role.code,
    shared,
    alcoholCount: tag.alcoholCount,
    groupCode: group.code,
  };
  const id = tagNodeId(tag.tastingTagId, idSuffix);
  if (shape === 'dot') {
    // 방사형 덴드로그램: 점 + 방사 방향 라벨
    return {
      id,
      type: 'circle',
      data,
      style: {
        size: isCore ? 10 : 7,
        fill: isCore ? color : colors.background,
        stroke: color,
        lineWidth: isCore ? 1.5 : 1,
        lineDash: shared ? [2, 2] : undefined,
        labelText: tag.korName,
        labelFontSize: isCore ? 11 : 10,
        labelFontWeight: isCore ? 600 : 400,
        labelFill: isCore ? colors.foreground : colors.muted,
        labelBackground: true,
        labelBackgroundFill: colors.background,
        labelBackgroundOpacity: 0.75,
        labelBackgroundRadius: 4,
        labelPadding: [1, 4],
        haloStroke: color,
        zIndex: 2,
      },
    };
  }
  if (shape === 'label') {
    // 피시본: 가시 끝에 글자만 둔다
    return {
      id,
      type: 'rect',
      data,
      style: {
        size: [2, 22],
        fill: 'transparent',
        labelText: tag.korName,
        labelPlacement: 'right',
        labelOffsetX: 4,
        labelFontSize: isCore ? 12 : 11,
        labelFontWeight: isCore ? 600 : 400,
        labelFill: isCore ? colors.foreground : colors.muted,
        labelBackground: shared,
        labelBackgroundFill: hexToRgba(color, 0.1),
        labelBackgroundRadius: 4,
        labelPadding: [1, 4],
        zIndex: 2,
      },
    };
  }
  const height = isCore ? 22 : 18;
  return {
    id,
    type: 'rect',
    data,
    style: {
      size: [textWidth(tag.korName, isCore ? 11 : 9, 14), height],
      radius: height / 2,
      fill: isCore ? hexToRgba(color, colors.isDark ? 0.28 : 0.16) : colors.background,
      stroke: color,
      lineWidth: isCore ? 1.6 : 1,
      strokeOpacity: isCore ? 0.95 : 0.55,
      lineDash: shared ? [3, 2] : undefined,
      labelText: tag.korName,
      labelPlacement: 'center',
      labelFill: isCore ? colors.foreground : colors.muted,
      labelFontSize: isCore ? 11 : 9,
      labelFontWeight: isCore ? 600 : 400,
      haloStroke: color,
      zIndex: 2,
    },
  };
}

function tagEdge(
  source: string,
  target: string,
  role: TastingGroupRole,
  color: string,
  type: string
): EdgeData {
  const isCore = role === 'CORE';
  return {
    id: `${source}->${target}`,
    source,
    target,
    type,
    data: { role },
    style: {
      stroke: color,
      lineWidth: isCore ? 2 : 1.2,
      lineDash: isCore ? undefined : [3, 3],
      strokeOpacity: isCore ? 0.9 : 0.55,
      zIndex: 0,
    },
  };
}

// ============================================
// 데이터 구성
// ============================================

interface Built {
  data: GraphData;
  families: Array<{ family: string; color: string }>;
}

/** 트리 계열: 루트 → 그룹 → 태그. 공유 태그는 그룹마다 복제한다 */
function buildTree(
  groups: TastingGroupItem[],
  colors: Colors,
  layout: 'dendrogram' | 'mindmap' | 'fishbone'
): Built {
  const { families, colorOf } = colorScale(groups);
  const counts = sharedCounts(groups);
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];
  const edgeType =
    layout === 'dendrogram'
      ? 'cubic-radial'
      : layout === 'mindmap'
        ? 'cubic-horizontal'
        : 'polyline';
  const tagShape = layout === 'dendrogram' ? 'dot' : layout === 'fishbone' ? 'label' : 'pill';
  const hubShape = layout === 'dendrogram' ? 'circle' : 'pill';

  const rootStyle =
    layout === 'fishbone'
      ? {
          size: [120, 44] as [number, number],
          radius: 10,
          fill: colors.foreground,
          labelText: '태그 그룹',
          labelPlacement: 'center' as const,
          labelFill: colors.background,
          labelFontSize: 14,
          labelFontWeight: 700,
          zIndex: 4,
        }
      : {
          size: 60,
          fill: colors.foreground,
          labelText: '태그\n그룹',
          labelPlacement: 'center' as const,
          labelFill: colors.background,
          labelFontSize: 12,
          labelFontWeight: 700,
          zIndex: 4,
        };
  nodes.push({
    id: ROOT_ID,
    type: layout === 'fishbone' ? 'rect' : 'circle',
    depth: 0,
    data: { kind: 'root' },
    style: rootStyle,
    children: groups.map((group) => hubId(group.code)),
  });

  groups.forEach((group) => {
    const color = colorOf(group.family);
    const hub = hubNode(group, color, colors, hubShape);
    hub.depth = 1;
    hub.children = group.tags.map((tag) => tagNodeId(tag.tastingTagId, group.code));
    nodes.push(hub);
    edges.push({
      id: `${ROOT_ID}->${hub.id}`,
      source: ROOT_ID,
      target: String(hub.id),
      type: edgeType,
      data: { role: 'ROOT' },
      style: { stroke: color, lineWidth: 2.5, strokeOpacity: 0.9, zIndex: 1 },
    });
    group.tags.forEach((tag) => {
      const info: TagInfo = {
        tag,
        group,
        color,
        shared: (counts.get(tag.tastingTagId) ?? 0) > 1,
      };
      const node = tagNode(info, colors, tagShape, group.code);
      node.depth = 2;
      nodes.push(node);
      edges.push(tagEdge(String(hub.id), String(node.id), tag.role.code, color, edgeType));
    });
  });

  return { data: { nodes, edges }, families };
}

/** 콤보·원형: 태그 노드는 하나, 엣지는 그룹마다 */
function buildNetwork(
  groups: TastingGroupItem[],
  colors: Colors,
  layout: 'combo' | 'circular'
): Built {
  const { families, colorOf } = colorScale(groups);
  const counts = sharedCounts(groups);
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];
  const combos: ComboData[] = [];
  const placed = new Set<number>();

  groups.forEach((group) => {
    const color = colorOf(group.family);
    const hub = hubNode(group, color, colors, 'circle');
    if (layout === 'combo') {
      hub.combo = comboId(group.code);
      combos.push({
        id: comboId(group.code),
        data: { kind: 'combo', name: group.name },
        style: {
          fill: hexToRgba(color, colors.isDark ? 0.14 : 0.08),
          stroke: color,
          strokeOpacity: 0.45,
          lineWidth: 1,
          labelText: group.name,
          labelPlacement: 'top',
          labelFill: color,
          labelFontSize: 12,
          labelFontWeight: 600,
          padding: 12,
        },
      });
    }
    nodes.push(hub);
    group.tags.forEach((tag) => {
      if (!placed.has(tag.tastingTagId)) {
        placed.add(tag.tastingTagId);
        const node = tagNode(
          { tag, group, color, shared: (counts.get(tag.tastingTagId) ?? 0) > 1 },
          colors,
          'pill'
        );
        if (layout === 'combo') node.combo = comboId(group.code);
        nodes.push(node);
      }
      edges.push(
        tagEdge(String(hub.id), tagNodeId(tag.tastingTagId), tag.role.code, color, 'line')
      );
    });
  });

  return { data: { nodes, edges, combos }, families };
}

// ============================================
// 레이아웃
// ============================================

function layoutOptions(layout: GraphLayout, box: Box, nodeCount: number) {
  switch (layout) {
    case 'dendrogram':
      return {
        type: 'dendrogram',
        radial: true,
        nodeSep: 18,
        rankSep: Math.max(110, box.height / 4),
      };
    case 'mindmap':
      return {
        type: 'mindmap',
        direction: 'H',
        getHeight: () => 24,
        getWidth: (node: NodeData) => {
          const size = (node.style as { size?: number | [number, number] } | undefined)?.size;
          return Array.isArray(size) ? size[0] : (size ?? 40);
        },
        getVGap: () => 5,
        getHGap: () => 56,
      };
    case 'fishbone':
      return { type: 'fishbone', direction: 'LR', hGap: 36, vGap: 32 };
    case 'combo':
      return { type: 'combo-combined', comboPadding: 10, spacing: 20 };
    case 'circular':
      // 노드마다 둘레 32px씩 확보한다. 자동 맞춤이 영역에 맞게 줄여 준다
      return {
        type: 'circular',
        radius: Math.max(
          Math.min(box.width, box.height) / 2 - 60,
          (nodeCount * 32) / (Math.PI * 2)
        ),
        startAngle: -Math.PI / 2,
        endAngle: (3 * Math.PI) / 2,
      };
    default:
      return undefined;
  }
}

export function TastingGroupGraph({
  groups,
  layout,
  showPeripheral,
  selectedCode,
  onSelect,
}: TastingGroupGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  /** render()가 끝난 인스턴스에만 상태를 쓴다. StrictMode에서 바로 파괴되는 첫 인스턴스를 거른다 */
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // 테마(dark 클래스)가 바뀌면 색을 다시 읽어 그래프를 다시 그린다
  const [colors, setColors] = useState<Colors>(() => themeColors());
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(themeColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const visibleGroups = useMemo(
    () =>
      showPeripheral
        ? groups
        : groups.map((group) => ({
            ...group,
            tags: group.tags.filter((tag) => tag.role.code === 'CORE'),
          })),
    [groups, showPeripheral]
  );
  const built = useMemo(
    () =>
      layout === 'combo' || layout === 'circular'
        ? buildNetwork(visibleGroups, colors, layout)
        : buildTree(visibleGroups, colors, layout),
    [visibleGroups, colors, layout]
  );

  // 그래프 영역은 main에서 그래프 위쪽과 아래 남는 것을 뺀 높이를 쓴다. 화면에 스크롤이 생기지 않게 하기 위함이다.
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 그래프 아래에는 래퍼 테두리(1)와 main 패딩(24)만 남는다
    const BELOW = 26;
    const measure = () => {
      const scroller = el.closest('main') ?? document.documentElement;
      const top =
        el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      const width = el.parentElement?.clientWidth ?? el.clientWidth;
      const height = Math.max(260, Math.floor(scroller.clientHeight - top - BELOW));
      setBox((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [layout, groups.length, showPeripheral]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || groups.length === 0 || !box) return;

    const isTree = layout === 'dendrogram' || layout === 'mindmap' || layout === 'fishbone';
    const graph = new Graph({
      container,
      autoResize: true,
      autoFit: 'view',
      padding: 20,
      animation: false,
      zoomRange: [0.2, 2.5],
      theme: colors.isDark ? 'dark' : 'light',
      background: 'transparent',
      data: built.data,
      layout: layoutOptions(layout, box, built.data.nodes?.length ?? 0),
      node: {
        state: {
          active: { halo: true, haloLineWidth: 10, haloStrokeOpacity: 0.18 },
          selected: { halo: true, haloLineWidth: 14, haloStrokeOpacity: 0.3 },
          inactive: { opacity: 0.18 },
        },
      },
      edge: {
        state: {
          active: { strokeOpacity: 1 },
          inactive: { strokeOpacity: 0.05 },
        },
      },
      combo: {
        type: 'circle',
        state: { inactive: { opacity: 0.25 } },
      },
      transforms: layout === 'dendrogram' ? ['place-radial-labels'] : [],
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        ...(isTree ? [] : ['drag-element']),
        {
          type: 'hover-activate',
          degree: 1,
          direction: isTree ? 'out' : 'both',
          state: 'active',
          inactiveState: 'inactive',
          enable: (event: { targetType?: string }) => event.targetType === 'node',
        },
      ],
      plugins: [
        {
          type: 'tooltip',
          trigger: 'hover',
          enable: (_event: unknown, items: Array<{ data?: Record<string, unknown> }>) =>
            items[0]?.data?.kind === 'tag',
          getContent: (_event: unknown, items: Array<{ data?: Record<string, unknown> }>) => {
            const item = items[0]?.data ?? {};
            const role = item.role as TastingGroupRole | undefined;
            const count = typeof item.alcoholCount === 'number' ? item.alcoholCount : 0;
            return `<div style="font-size:12px;line-height:1.5">
              <strong>${String(item.name ?? '')}</strong>
              <div>${role ? ROLE_LABEL[role] : ''}${item.shared ? ' · 여러 그룹 공유' : ''}</div>
              <div>위스키 ${formatNumber(count)}개</div>
            </div>`;
          },
        },
        ...(layout === 'circular' ? [{ type: 'edge-bundling', bundleThreshold: 0.1 }] : []),
      ],
    });

    graph.on(NodeEvent.CLICK, (event: IPointerEvent) => {
      const id = String((event.target as { id?: string }).id ?? '');
      if (id.startsWith('group:')) onSelectRef.current(id.slice('group:'.length));
    });

    graphRef.current = graph;
    let disposed = false;
    const renderTimer = window.setTimeout(() => {
      if (disposed) return;
      graph
        .render()
        .then(async () => {
          if (disposed) return;
          // 전체가 영역에 들어오게 맞추되 확대는 하지 않는다
          if (graph.getZoom() > 1) {
            await graph.zoomTo(1, false);
            await graph.fitCenter(false);
          }
          if (disposed) return;
          readyRef.current = true;
          if (selectedCode) {
            graph.setElementState(hubId(selectedCode), ['selected']).catch(() => undefined);
          }
        })
        .catch((error: unknown) => {
          console.error('[TastingGroupGraph] render failed', error);
        });
    }, 0);

    // 영역 크기가 바뀌면 캔버스를 따라가게 하고 다시 전체를 맞춘다
    let fitTimer = 0;
    const observer = new ResizeObserver(() => {
      if (disposed) return;
      graph.resize();
      window.clearTimeout(fitTimer);
      fitTimer = window.setTimeout(() => {
        if (disposed || !readyRef.current) return;
        graph
          .fitView({ when: 'always', direction: 'both' }, false)
          .then(() => (graph.getZoom() > 1 ? graph.zoomTo(1, false) : undefined))
          .catch(() => undefined);
      }, 120);
    });
    observer.observe(container);

    return () => {
      disposed = true;
      readyRef.current = false;
      window.clearTimeout(renderTimer);
      window.clearTimeout(fitTimer);
      observer.disconnect();
      graphRef.current = null;
      graph.destroy();
    };
    // selectedCode는 아래 효과에서 상태만 바꾸므로 그래프를 다시 만들지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built, layout, colors, groups.length, box]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graph.destroyed || !readyRef.current) return;
    const states: Record<string, string[]> = {};
    groups.forEach((group) => {
      states[hubId(group.code)] = group.code === selectedCode ? ['selected'] : [];
    });
    graph.setElementState(states).catch(() => undefined);
  }, [selectedCode, groups]);

  if (groups.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        그래프로 그릴 태그 그룹이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border">
      {/* 범례는 캔버스 위에 띄워 세로 공간을 쓰지 않는다 */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[85%] flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-background/85 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        {built.families.map(({ family, color }) => (
          <span key={family} className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            {family}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-5 rounded bg-foreground/70" />
          {ROLE_LABEL.CORE} 1.0
        </span>
        {showPeripheral && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t border-dashed border-foreground/50" />
            {ROLE_LABEL.PERIPHERAL} 0.4
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground/60 bg-background" />
          공유
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded bg-background/85 px-2 py-0.5 text-[11px] text-muted-foreground">
        올리면 연결 강조 · 누르면 선택 · 휠 확대 · 드래그 이동
      </span>
      <div
        ref={containerRef}
        role="img"
        aria-label="태그 그룹과 테이스팅 태그 연결 그래프"
        className="w-full overflow-hidden"
        style={{ height: box?.height ?? 280 }}
      />
    </div>
  );
}

/**
 * 태그 그룹 ↔ 테이스팅 태그 관계 그래프 (모의 화면)
 * - 좌측 열은 그룹, 우측 열은 태그 노드이고 엣지는 연결 역할을 나타낸다.
 * - 대표 태그(CORE)는 굵은 실선, 보조 태그(PERIPHERAL)는 가는 점선으로 그린다.
 * - 외부 그래프 라이브러리 없이 SVG로만 그린다.
 */

import { useMemo } from 'react';

import { ROLE_LABEL, type MockTastingGroup } from './tasting-group.mock';

interface TastingGroupGraphProps {
  groups: MockTastingGroup[];
  selectedId: number | null;
  onSelect: (groupId: number) => void;
}

const WIDTH = 760;
const ROW_HEIGHT = 34;
const PADDING_Y = 24;
const GROUP_X = 170;
const TAG_X = 560;
const GROUP_NODE_WIDTH = 150;
const TAG_NODE_WIDTH = 120;
const NODE_HEIGHT = 26;

export function TastingGroupGraph({ groups, selectedId, onSelect }: TastingGroupGraphProps) {
  // 태그는 소속 그룹 순서대로 세운다. 여러 그룹에 걸친 태그는 처음 나온 자리를 쓴다.
  const { tagRows, edges, height } = useMemo(() => {
    const tagIndex = new Map<number, { id: number; korName: string; y: number }>();
    const edgeList: Array<{
      groupId: number;
      tagId: number;
      role: MockTastingGroup['tags'][number]['role'];
    }> = [];

    groups.forEach((group) => {
      group.tags.forEach((tag) => {
        if (!tagIndex.has(tag.tastingTagId)) {
          tagIndex.set(tag.tastingTagId, {
            id: tag.tastingTagId,
            korName: tag.korName,
            y: PADDING_Y + tagIndex.size * ROW_HEIGHT + NODE_HEIGHT / 2,
          });
        }
        edgeList.push({ groupId: group.id, tagId: tag.tastingTagId, role: tag.role });
      });
    });

    const rows = Array.from(tagIndex.values());
    const contentHeight = Math.max(groups.length, rows.length) * ROW_HEIGHT;
    return { tagRows: rows, edges: edgeList, height: contentHeight + PADDING_Y * 2 };
  }, [groups]);

  // 그룹 노드는 자기 태그들의 중앙 높이에 두어 엣지가 한곳으로 모이게 한다. 태그가 없는 그룹은 맨 아래에 둔다.
  const groupY = useMemo(() => {
    const map = new Map<number, number>();
    const tagless: number[] = [];
    groups.forEach((group) => {
      const ys = group.tags
        .map((tag) => tagRows.find((row) => row.id === tag.tastingTagId)?.y)
        .filter((y): y is number => y != null);
      if (ys.length === 0) {
        tagless.push(group.id);
        return;
      }
      map.set(group.id, ys.reduce((a, b) => a + b, 0) / ys.length);
    });
    // 겹치는 그룹 노드는 아래로 밀어낸다.
    const sorted = [...map.entries()].sort((a, b) => a[1] - b[1]);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev && curr && curr[1] - prev[1] < ROW_HEIGHT) {
        curr[1] = prev[1] + ROW_HEIGHT;
        map.set(curr[0], curr[1]);
      }
    }
    let bottom = Math.max(
      ...Array.from(map.values()),
      PADDING_Y + (tagRows.length - 1) * ROW_HEIGHT + NODE_HEIGHT / 2,
      PADDING_Y + NODE_HEIGHT / 2 - ROW_HEIGHT
    );
    tagless.forEach((id) => {
      bottom += ROW_HEIGHT;
      map.set(id, bottom);
    });
    return map;
  }, [groups, tagRows]);

  const svgHeight = Math.max(
    height,
    Math.max(...Array.from(groupY.values()), 0) + NODE_HEIGHT / 2 + PADDING_Y
  );

  const isDimmed = (groupId: number) => selectedId != null && selectedId !== groupId;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-primary" />
          {ROLE_LABEL.CORE} (가중치 1.0)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0 w-6 border-t-2 border-dashed border-muted-foreground" />
          {ROLE_LABEL.PERIPHERAL} (가중치 0.4)
        </span>
        <span>그룹 노드를 누르면 해당 연결만 강조합니다.</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="태그 그룹과 테이스팅 태그 연결 그래프"
          viewBox={`0 0 ${WIDTH} ${svgHeight}`}
          width={WIDTH}
          height={svgHeight}
          className="min-w-[640px] text-foreground"
        >
          <text x={GROUP_X} y={12} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            태그 그룹
          </text>
          <text x={TAG_X} y={12} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            테이스팅 태그
          </text>

          {edges.map((edge) => {
            const y1 = groupY.get(edge.groupId);
            const tag = tagRows.find((row) => row.id === edge.tagId);
            if (y1 == null || !tag) return null;
            const x1 = GROUP_X + GROUP_NODE_WIDTH / 2;
            const x2 = TAG_X - TAG_NODE_WIDTH / 2;
            const cx = (x1 + x2) / 2;
            const dimmed = isDimmed(edge.groupId);
            const isCore = edge.role === 'CORE';
            return (
              <path
                key={`${edge.groupId}-${edge.tagId}`}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${tag.y}, ${x2} ${tag.y}`}
                fill="none"
                strokeWidth={isCore ? 2.5 : 1.25}
                strokeDasharray={isCore ? undefined : '4 4'}
                className={
                  dimmed
                    ? 'stroke-muted-foreground/15'
                    : isCore
                      ? 'stroke-primary'
                      : 'stroke-muted-foreground/70'
                }
              />
            );
          })}

          {groups.map((group) => {
            const y = groupY.get(group.id) ?? 0;
            const selected = selectedId === group.id;
            return (
              <g
                key={group.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                className="cursor-pointer"
                onClick={() => onSelect(group.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(group.id);
                  }
                }}
              >
                <title>{`${group.name} · ${group.family} · 태그 ${group.tags.length}개`}</title>
                <rect
                  x={GROUP_X - GROUP_NODE_WIDTH / 2}
                  y={y - NODE_HEIGHT / 2}
                  width={GROUP_NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  className={
                    selected
                      ? 'fill-primary stroke-primary'
                      : isDimmed(group.id)
                        ? 'fill-background stroke-border'
                        : 'fill-background stroke-primary/60'
                  }
                  strokeWidth={1.5}
                />
                <text
                  x={GROUP_X}
                  y={y + 4}
                  textAnchor="middle"
                  className={`text-[12px] font-medium ${selected ? 'fill-primary-foreground' : 'fill-foreground'}`}
                >
                  {group.name}
                </text>
              </g>
            );
          })}

          {tagRows.map((tag) => {
            const connected =
              selectedId == null || edges.some((e) => e.tagId === tag.id && e.groupId === selectedId);
            return (
              <g key={tag.id}>
                <rect
                  x={TAG_X - TAG_NODE_WIDTH / 2}
                  y={tag.y - NODE_HEIGHT / 2}
                  width={TAG_NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={13}
                  className={connected ? 'fill-muted stroke-border' : 'fill-background stroke-border/60'}
                  strokeWidth={1}
                />
                <text
                  x={TAG_X}
                  y={tag.y + 4}
                  textAnchor="middle"
                  className={`text-[12px] ${connected ? 'fill-foreground' : 'fill-muted-foreground/60'}`}
                >
                  {tag.korName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

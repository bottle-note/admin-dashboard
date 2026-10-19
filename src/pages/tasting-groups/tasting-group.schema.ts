import { z } from 'zod';

import type { TastingGroupItem, TastingGroupRole } from '@/types/api';

/** 역할 코드의 화면 표기. 서버 응답의 role.korName과 같은 값이다 */
export const ROLE_LABEL: Record<TastingGroupRole, string> = {
  CORE: '대표 태그',
  PERIPHERAL: '보조 태그',
};

/** 그래프 탭의 보기 방식. G6 갤러리 예제를 옮긴 다섯 가지이며 기본은 방사형 덴드로그램 */
export const GRAPH_LAYOUTS = [
  { value: 'dendrogram', label: '방사형 덴드로그램' },
  { value: 'mindmap', label: '마인드맵' },
  { value: 'fishbone', label: '피시본' },
  { value: 'combo', label: '콤보 묶음' },
  { value: 'circular', label: '원형 번들링' },
] as const;
export type GraphLayout = (typeof GRAPH_LAYOUTS)[number]['value'];
export const DEFAULT_GRAPH_LAYOUT: GraphLayout = 'dendrogram';

export function isGraphLayout(value: string | null): value is GraphLayout {
  return GRAPH_LAYOUTS.some((item) => item.value === value);
}

export const NO_FAMILY = '계열 없음';

/** 계열별 색. 밝은 배경과 어두운 배경 모두에서 읽히는 중간 채도다. 목록·그래프가 같이 쓴다 */
export const FAMILY_PALETTE = [
  '#e76f51',
  '#2a9d8f',
  '#e9c46a',
  '#8e7dbe',
  '#f4a261',
  '#4d908e',
  '#d1495b',
  '#577590',
];

/** 그룹 목록에서 계열을 가나다순으로 모아 색을 고정 배정한다 */
export function familyColorScale(groups: Array<{ family: string | null }>) {
  const families = Array.from(new Set(groups.map((g) => g.family ?? NO_FAMILY))).sort((a, b) =>
    a.localeCompare(b, 'ko')
  );
  const colorOf = (family: string | null) =>
    FAMILY_PALETTE[families.indexOf(family ?? NO_FAMILY) % FAMILY_PALETTE.length] ??
    FAMILY_PALETTE[0]!;
  return { families: families.map((family) => ({ family, color: colorOf(family) })), colorOf };
}

/** 역할을 바꿀 때 반대편 역할 */
export const OTHER_ROLE: Record<TastingGroupRole, TastingGroupRole> = {
  CORE: 'PERIPHERAL',
  PERIPHERAL: 'CORE',
};

/** 코드·이름 형식의 세부 검증은 서버 도메인이 맡고, 폼은 필수 여부와 숫자 형식만 본다 */
export const tastingGroupFormSchema = z.object({
  code: z.string().trim().min(1, '코드는 필수입니다'),
  name: z.string().trim().min(1, '이름은 필수입니다'),
  family: z.string(),
  description: z.string(),
  displayOrder: z
    .number({ message: '표시 순서는 숫자여야 합니다' })
    .int('표시 순서는 정수여야 합니다')
    .min(0, '표시 순서는 0 이상이어야 합니다'),
});

export type TastingGroupFormValues = z.infer<typeof tastingGroupFormSchema>;

export const tastingGroupDefaultValues: TastingGroupFormValues = {
  code: '',
  name: '',
  family: '',
  description: '',
  displayOrder: 0,
};

export function toFormValues(group: TastingGroupItem): TastingGroupFormValues {
  return {
    code: group.code,
    name: group.name,
    family: group.family ?? '',
    description: group.description ?? '',
    displayOrder: group.displayOrder ?? 0,
  };
}

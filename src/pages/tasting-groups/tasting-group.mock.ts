/**
 * 태그 그룹 모의 데이터
 * - 백엔드 `GET /admin/api/v1/tasting/groups` 응답 모양(groups + families)을 따른다.
 * - 화면 구성 확인용이며 API 연동 시 types/service/hook으로 교체한다.
 */

export type TastingGroupRole = 'CORE' | 'PERIPHERAL';

export interface MockGroupTag {
  tastingTagId: number;
  korName: string;
  role: TastingGroupRole;
  alcoholCount: number;
}

export interface MockTastingGroup {
  id: number;
  code: string;
  name: string;
  family: string;
  description: string | null;
  displayOrder: number;
  tags: MockGroupTag[];
}

export const ROLE_LABEL: Record<TastingGroupRole, string> = {
  CORE: '대표 태그',
  PERIPHERAL: '보조 태그',
};

export const mockFamilies = ['과일', '스모키', '단맛', '향신료', '우디'];

export const mockTastingGroups: MockTastingGroup[] = [
  {
    id: 1,
    code: 'TROPICAL_FRUIT',
    name: '열대 과일',
    family: '과일',
    description: '파인애플·망고처럼 달고 진한 과일 향이 중심인 맛',
    displayOrder: 1,
    tags: [
      { tastingTagId: 101, korName: '파인애플', role: 'CORE', alcoholCount: 142 },
      { tastingTagId: 102, korName: '망고', role: 'CORE', alcoholCount: 98 },
      { tastingTagId: 103, korName: '바나나', role: 'PERIPHERAL', alcoholCount: 211 },
      { tastingTagId: 104, korName: '패션프루트', role: 'PERIPHERAL', alcoholCount: 37 },
    ],
  },
  {
    id: 2,
    code: 'CITRUS',
    name: '시트러스',
    family: '과일',
    description: '레몬·오렌지 껍질처럼 산뜻한 산미',
    displayOrder: 2,
    tags: [
      { tastingTagId: 111, korName: '레몬', role: 'CORE', alcoholCount: 310 },
      { tastingTagId: 112, korName: '오렌지 껍질', role: 'CORE', alcoholCount: 265 },
      { tastingTagId: 113, korName: '자몽', role: 'PERIPHERAL', alcoholCount: 74 },
      // 열대 과일 그룹과 공유하는 태그. 한 태그가 여러 그룹에 속하는 경우의 예시
      { tastingTagId: 101, korName: '파인애플', role: 'PERIPHERAL', alcoholCount: 142 },
    ],
  },
  {
    id: 3,
    code: 'PEAT_SMOKE',
    name: '피트 스모크',
    family: '스모키',
    description: '아일라 위스키의 훈연·요오드 계열',
    displayOrder: 3,
    tags: [
      { tastingTagId: 121, korName: '피트', role: 'CORE', alcoholCount: 402 },
      { tastingTagId: 122, korName: '훈연', role: 'CORE', alcoholCount: 388 },
      { tastingTagId: 123, korName: '요오드', role: 'PERIPHERAL', alcoholCount: 96 },
      { tastingTagId: 124, korName: '타르', role: 'PERIPHERAL', alcoholCount: 58 },
      { tastingTagId: 125, korName: '해풍', role: 'PERIPHERAL', alcoholCount: 133 },
    ],
  },
  {
    id: 4,
    code: 'SHERRY_SWEET',
    name: '셰리 단맛',
    family: '단맛',
    description: '건포도·다크초콜릿 등 셰리 캐스크 유래 단맛',
    displayOrder: 4,
    tags: [
      { tastingTagId: 131, korName: '건포도', role: 'CORE', alcoholCount: 512 },
      { tastingTagId: 132, korName: '다크초콜릿', role: 'CORE', alcoholCount: 347 },
      { tastingTagId: 133, korName: '무화과', role: 'PERIPHERAL', alcoholCount: 120 },
    ],
  },
  {
    id: 5,
    code: 'HONEY_VANILLA',
    name: '허니 바닐라',
    family: '단맛',
    description: '버번 캐스크 유래의 꿀·바닐라 계열',
    displayOrder: 5,
    tags: [
      { tastingTagId: 141, korName: '꿀', role: 'CORE', alcoholCount: 689 },
      { tastingTagId: 142, korName: '바닐라', role: 'CORE', alcoholCount: 920 },
      { tastingTagId: 143, korName: '카라멜', role: 'PERIPHERAL', alcoholCount: 455 },
    ],
  },
  {
    id: 6,
    code: 'BAKING_SPICE',
    name: '베이킹 스파이스',
    family: '향신료',
    description: '시나몬·정향·육두구 같은 따뜻한 향신료',
    displayOrder: 6,
    tags: [
      { tastingTagId: 151, korName: '시나몬', role: 'CORE', alcoholCount: 377 },
      { tastingTagId: 152, korName: '정향', role: 'PERIPHERAL', alcoholCount: 140 },
      { tastingTagId: 153, korName: '육두구', role: 'PERIPHERAL', alcoholCount: 88 },
    ],
  },
  {
    id: 7,
    code: 'OAK_WOODY',
    name: '오크 우디',
    family: '우디',
    description: null,
    displayOrder: 7,
    tags: [
      { tastingTagId: 161, korName: '오크', role: 'CORE', alcoholCount: 1203 },
      { tastingTagId: 162, korName: '삼나무', role: 'PERIPHERAL', alcoholCount: 64 },
    ],
  },
  {
    id: 8,
    code: 'EMPTY_SAMPLE',
    name: '태그 미연결 그룹',
    family: '우디',
    description: '태그가 없어 삭제 가능한 상태 예시',
    displayOrder: 8,
    tags: [],
  },
];

/** `GET /tasting/tags/ungrouped` 응답 예시: 어느 그룹에도 속하지 않은 태그 */
export const mockUngroupedTags = [
  { id: 201, korName: '가죽', alcoholCount: 210 },
  { id: 202, korName: '담배', alcoholCount: 95 },
  { id: 203, korName: '민트', alcoholCount: 61 },
  { id: 204, korName: '소금', alcoholCount: 177 },
  { id: 205, korName: '풀', alcoholCount: 142 },
];

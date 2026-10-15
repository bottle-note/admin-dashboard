/**
 * 위스키 속성 모의 데이터
 * - 백엔드 `GET /admin/api/v1/alcohols/attributes/summary`, `/keys`, `/enums` 응답 모양을 따른다.
 * - 화면 구성 확인용이며 API 연동 시 types/service/hook으로 교체한다.
 */

export type AttributeType = 'KEYWORD' | 'POPULARITY' | 'PRICE' | 'FLAG' | 'IDENTITY' | 'NOTE';
export type AttributeDatatype = 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN';

export const TYPE_LABEL: Record<AttributeType, string> = {
  KEYWORD: '키워드',
  POPULARITY: '대중성 점수',
  PRICE: '가격',
  FLAG: '예/아니오 속성',
  IDENTITY: '묶음 코드',
  NOTE: '메모',
};

export const DATATYPE_LABEL: Record<AttributeDatatype, string> = {
  STRING: '텍스트',
  INT: '정수',
  DOUBLE: '소수',
  BOOLEAN: '예/아니오',
};

/** 화면에서 선택한 위스키 (실제로는 위스키 검색으로 고른다) */
export const mockSelectedAlcohols = [
  { id: 1001, korName: '아드벡 10년', engName: 'Ardbeg 10' },
  { id: 1002, korName: '라가불린 16년', engName: 'Lagavulin 16' },
  { id: 1003, korName: '라프로익 10년', engName: 'Laphroaig 10' },
];

/** `/summary` 응답 항목: 숫자형은 항목 단위, 그 외는 항목·값 단위 묶음 */
export interface MockAttributeSummary {
  key: string;
  value: string | null;
  type: AttributeType;
  datatype: AttributeDatatype;
  registeredCount: number;
  selectedCount: number;
  min: number | null;
  max: number | null;
  allSameValue: boolean;
}

export const mockAttributeSummary: MockAttributeSummary[] = [
  {
    key: 'keyword',
    value: '피트',
    type: 'KEYWORD',
    datatype: 'STRING',
    registeredCount: 3,
    selectedCount: 3,
    min: null,
    max: null,
    allSameValue: true,
  },
  {
    key: 'keyword',
    value: '아일라',
    type: 'KEYWORD',
    datatype: 'STRING',
    registeredCount: 3,
    selectedCount: 3,
    min: null,
    max: null,
    allSameValue: true,
  },
  {
    key: 'keyword',
    value: '입문용',
    type: 'KEYWORD',
    datatype: 'STRING',
    registeredCount: 1,
    selectedCount: 3,
    min: null,
    max: null,
    allSameValue: true,
  },
  {
    key: 'popularity_score',
    value: null,
    type: 'POPULARITY',
    datatype: 'DOUBLE',
    registeredCount: 3,
    selectedCount: 3,
    min: 72.5,
    max: 91,
    allSameValue: false,
  },
  {
    key: 'bottle_price_krw',
    value: null,
    type: 'PRICE',
    datatype: 'INT',
    registeredCount: 2,
    selectedCount: 3,
    min: 98000,
    max: 165000,
    allSameValue: false,
  },
  {
    key: 'is_flavored',
    value: 'false',
    type: 'FLAG',
    datatype: 'BOOLEAN',
    registeredCount: 3,
    selectedCount: 3,
    min: null,
    max: null,
    allSameValue: true,
  },
  {
    key: 'brand_group',
    value: 'ISLAY_CLASSIC',
    type: 'IDENTITY',
    datatype: 'STRING',
    registeredCount: 2,
    selectedCount: 3,
    min: null,
    max: null,
    allSameValue: true,
  },
];

/** `/keys` 응답: 항목별 등록 행 수와 위스키 수 (전체 기준) */
export const mockAttributeKeys = [
  { key: 'keyword', type: 'KEYWORD', datatype: 'STRING', count: 5120, alcoholCount: 2310 },
  { key: 'popularity_score', type: 'POPULARITY', datatype: 'DOUBLE', count: 1840, alcoholCount: 1840 },
  { key: 'bottle_price_krw', type: 'PRICE', datatype: 'INT', count: 960, alcoholCount: 960 },
  { key: 'is_flavored', type: 'FLAG', datatype: 'BOOLEAN', count: 3684, alcoholCount: 3684 },
  { key: 'brand_group', type: 'IDENTITY', datatype: 'STRING', count: 1205, alcoholCount: 1205 },
  { key: 'ops_note', type: 'NOTE', datatype: 'STRING', count: 42, alcoholCount: 39 },
] satisfies Array<{
  key: string;
  type: AttributeType;
  datatype: AttributeDatatype;
  count: number;
  alcoholCount: number;
}>;

/** `/keywords` 응답: 키워드 값별 위스키 수 */
export const mockKeywordCounts = [
  { value: '피트', alcoholCount: 402 },
  { value: '셰리', alcoholCount: 388 },
  { value: '입문용', alcoholCount: 265 },
  { value: '하이볼', alcoholCount: 211 },
  { value: '아일라', alcoholCount: 133 },
  { value: '한정판', alcoholCount: 96 },
];

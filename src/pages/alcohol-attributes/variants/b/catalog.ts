export const categories = [
  { value: 'KEYWORD', label: '키워드', description: '추천에 쓰는 공통 언어' },
  { value: 'PRICE', label: '가격', description: '금액과 비교 조건' },
  { value: 'POPULARITY', label: '대중성 점수', description: '시즌별 추천 기준' },
  { value: 'FLAG', label: '예/아니오 속성', description: '참과 거짓으로 구분' },
  { value: 'IDENTITY', label: '묶음 코드', description: '브랜드와 제품군' },
  { value: 'NOTE', label: '메모', description: '운영자가 남긴 맥락' },
] as const;

export type Attribute = {
  id: number;
  key: string;
  displayName: string;
  type: (typeof categories)[number]['value'];
  datatype: 'STRING' | 'INT' | 'DOUBLE';
  operator: 'EQ' | 'GTE';
  value: string;
  unit: string;
  description: string;
};

export const initialAttributes: Attribute[] = [
  {
    id: 101,
    key: 'smoky',
    displayName: '스모키',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'smoky',
    unit: '',
    description:
      '피트나 훈연에서 비롯한 연기 향이 뚜렷한 위스키. 단순한 오크의 탄 향과 구분해 사용합니다.',
  },
  {
    id: 102,
    key: 'sherry_rich',
    displayName: '셰리의 풍미',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'sherry',
    unit: '',
    description: '건과일과 견과류 등 셰리 캐스크의 풍미가 두드러지는 위스키에 사용합니다.',
  },
  {
    id: 103,
    key: 'beginner_friendly',
    displayName: '입문자 추천',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'beginner',
    unit: '',
    description:
      '위스키를 처음 접하는 사람에게 추천할 만한 균형 잡힌 풍미를 뜻합니다. 가격 기준과는 별개입니다.',
  },
  {
    id: 104,
    key: 'price_gte_100000',
    displayName: '10만 원 이상',
    type: 'PRICE',
    datatype: 'INT',
    operator: 'GTE',
    value: '100000',
    unit: '원',
    description:
      '운영자가 확인한 판매 가격이 10만 원 이상인 위스키. 실제 가격과 판매처를 검토한 뒤 직접 연결합니다.',
  },
  {
    id: 105,
    key: 'price_eq_45000',
    displayName: '45,000원',
    type: 'PRICE',
    datatype: 'INT',
    operator: 'EQ',
    value: '45000',
    unit: '원',
    description:
      '확인한 기준 가격이 45,000원인 위스키. 가격이 바뀌면 연결의 적절성을 다시 확인합니다.',
  },
  {
    id: 106,
    key: 'popular_2026_autumn',
    displayName: '가을 추천 4점 이상',
    type: 'POPULARITY',
    datatype: 'DOUBLE',
    operator: 'GTE',
    value: '4',
    unit: '점',
    description: '2026년 가을 큐레이션에서 운영자가 부여한 대중성 점수가 4점 이상인 위스키입니다.',
  },
  {
    id: 107,
    key: 'brand_glenfiddich',
    displayName: '글렌피딕 제품군',
    type: 'IDENTITY',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'glenfiddich',
    unit: '',
    description: '글렌피딕 브랜드의 위스키를 같은 제품군으로 묶습니다.',
  },
  {
    id: 108,
    key: 'review_packaging',
    displayName: '패키지 확인 필요',
    type: 'NOTE',
    datatype: 'STRING',
    operator: 'EQ',
    value: '패키지 변경 확인',
    unit: '',
    description: '제품 사진과 현재 유통 패키지가 같은지 확인할 때 사용하는 운영 메모입니다.',
  },
];

export const whiskies = [
  {
    id: 201,
    name: '라프로익 10년',
    english: 'Laphroaig 10 Year Old',
    region: '아일라',
    category: '싱글몰트',
    abv: '40%',
    initials: 'LP',
  },
  {
    id: 202,
    name: '아드벡 10년',
    english: 'Ardbeg 10 Year Old',
    region: '아일라',
    category: '싱글몰트',
    abv: '46%',
    initials: 'AR',
  },
  {
    id: 203,
    name: '라가불린 16년',
    english: 'Lagavulin 16 Year Old',
    region: '아일라',
    category: '싱글몰트',
    abv: '43%',
    initials: 'LG',
  },
  {
    id: 204,
    name: '탈리스커 10년',
    english: 'Talisker 10 Year Old',
    region: '아일 오브 스카이',
    category: '싱글몰트',
    abv: '45.8%',
    initials: 'TL',
  },
  {
    id: 205,
    name: '글렌피딕 12년',
    english: 'Glenfiddich 12 Year Old',
    region: '스페이사이드',
    category: '싱글몰트',
    abv: '40%',
    initials: 'GF',
  },
  {
    id: 206,
    name: '발베니 12년 더블우드',
    english: 'Balvenie 12 DoubleWood',
    region: '스페이사이드',
    category: '싱글몰트',
    abv: '40%',
    initials: 'BV',
  },
  {
    id: 207,
    name: '글렌드로낙 12년',
    english: 'Glendronach 12 Year Old',
    region: '하이랜드',
    category: '싱글몰트',
    abv: '43%',
    initials: 'GD',
  },
  {
    id: 208,
    name: '버팔로 트레이스',
    english: 'Buffalo Trace',
    region: '켄터키',
    category: '버번',
    abv: '45%',
    initials: 'BT',
  },
];

export type Mapping = { id: number; alcoholId: number; attributeId: number };
export const initialMappings: Mapping[] = [
  { id: 1001, alcoholId: 201, attributeId: 101 },
  { id: 1002, alcoholId: 202, attributeId: 101 },
  { id: 1003, alcoholId: 203, attributeId: 101 },
  { id: 1004, alcoholId: 206, attributeId: 102 },
  { id: 1005, alcoholId: 207, attributeId: 102 },
  { id: 1006, alcoholId: 205, attributeId: 103 },
  { id: 1007, alcoholId: 208, attributeId: 103 },
  { id: 1008, alcoholId: 203, attributeId: 104 },
  { id: 1009, alcoholId: 206, attributeId: 104 },
  { id: 1010, alcoholId: 205, attributeId: 107 },
];

export function definitionValue(attribute: Attribute) {
  const value =
    attribute.datatype === 'STRING'
      ? attribute.value
      : Number(attribute.value).toLocaleString('ko-KR');
  return `${value}${attribute.unit ? ` ${attribute.unit}` : ''}${attribute.operator === 'GTE' ? ' 이상' : ''}`;
}

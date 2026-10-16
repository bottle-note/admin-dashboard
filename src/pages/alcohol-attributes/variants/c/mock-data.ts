export const attributeTypes = {
  KEYWORD: '키워드',
  PRICE: '가격',
  POPULARITY: '대중성 점수',
  FLAG: '예/아니오 속성',
  IDENTITY: '묶음 코드',
  NOTE: '메모',
} as const;

export type AttributeType = keyof typeof attributeTypes;
export interface Attribute {
  id: number;
  key: string;
  displayName: string;
  type: AttributeType;
  datatype: 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN';
  operator: 'EQ' | 'GTE';
  value: string;
  unit: string;
  description: string;
}

export interface Mapping {
  id: number;
  alcoholId: number;
  attributeId: number;
}

export const whiskies = [
  {
    id: 201,
    name: '맥캘란 12년 셰리 오크',
    shortName: '맥캘란 12',
    region: '스페이사이드',
    abv: '40%',
    initial: 'M',
  },
  {
    id: 202,
    name: '발베니 12년 더블우드',
    shortName: '발베니 12',
    region: '스페이사이드',
    abv: '40%',
    initial: 'B',
  },
  {
    id: 203,
    name: '글렌피딕 15년 솔레라',
    shortName: '글렌피딕 15',
    region: '스페이사이드',
    abv: '40%',
    initial: 'G',
  },
  {
    id: 204,
    name: '탈리스커 10년',
    shortName: '탈리스커 10',
    region: '스카이섬',
    abv: '45.8%',
    initial: 'T',
  },
  {
    id: 205,
    name: '아드벡 10년',
    shortName: '아드벡 10',
    region: '아일라',
    abv: '46%',
    initial: 'A',
  },
  { id: 206, name: '아란 10년', shortName: '아란 10', region: '아란섬', abv: '46%', initial: 'R' },
];

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
    description: '피트와 연기 향이 뚜렷한 위스키. 테이스팅을 바탕으로 직접 선정합니다.',
  },
  {
    id: 102,
    key: 'gift',
    displayName: '선물용',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'gift',
    unit: '',
    description: '브랜드 인지도와 패키지, 접근성을 고려해 선물로 추천하는 위스키입니다.',
  },
  {
    id: 103,
    key: 'sherry_cask',
    displayName: '셰리 캐스크',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'sherry',
    unit: '',
    description: '셰리 캐스크 숙성이 풍미에 기여하는 위스키를 선정합니다.',
  },
  {
    id: 104,
    key: 'price_gte_150000',
    displayName: '15만 원 이상',
    type: 'PRICE',
    datatype: 'INT',
    operator: 'GTE',
    value: '150000',
    unit: '원',
    description:
      '병 판매가 15만 원 이상을 의미합니다. 판매가를 확인한 뒤 관리자가 직접 연결합니다.',
  },
  {
    id: 105,
    key: 'popularity_gte_80',
    displayName: '대중성 80점 이상',
    type: 'POPULARITY',
    datatype: 'INT',
    operator: 'GTE',
    value: '80',
    unit: '점',
    description:
      '이번 시즌 큐레이터가 평가한 대중성 기준입니다. 점수 조건은 자동으로 연결하지 않습니다.',
  },
  {
    id: 106,
    key: 'island_selection',
    displayName: '섬의 위스키',
    type: 'IDENTITY',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'island_selection',
    unit: '',
    description: '스코틀랜드 섬에서 생산한 위스키를 모은 큐레이션 묶음입니다.',
  },
  {
    id: 107,
    key: 'vanilla',
    displayName: '바닐라',
    type: 'KEYWORD',
    datatype: 'STRING',
    operator: 'EQ',
    value: 'vanilla',
    unit: '',
    description:
      '바닐라 풍미가 두드러지는 위스키를 위한 속성입니다. 연결할 위스키를 검토 중입니다.',
  },
];

const initialPairs: [number, number][] = [
  [201, 102],
  [202, 102],
  [203, 102],
  [204, 101],
  [205, 101],
  [201, 103],
  [202, 103],
  [203, 103],
  [201, 104],
  [203, 104],
  [202, 105],
  [203, 105],
  [204, 105],
  [204, 106],
  [205, 106],
];

export const initialMappings: Mapping[] = initialPairs.map(([alcoholId, attributeId], index) => ({
  id: 1001 + index,
  alcoholId,
  attributeId,
}));

export function attributeMeaning(
  attribute: Pick<Attribute, 'datatype' | 'value' | 'unit' | 'operator'>
) {
  const value =
    attribute.datatype === 'STRING' || attribute.datatype === 'BOOLEAN'
      ? attribute.value
      : Number(attribute.value).toLocaleString('ko-KR');
  return `${value}${attribute.unit ? ` ${attribute.unit}` : ''}${attribute.operator === 'GTE' ? ' 이상' : ''}`;
}

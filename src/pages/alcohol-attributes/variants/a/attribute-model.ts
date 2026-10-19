export const TYPE_LABELS = {
  KEYWORD: '키워드',
  PRICE: '가격',
  POPULARITY: '대중성',
  FLAG: '예/아니오',
  IDENTITY: '묶음 코드',
  NOTE: '메모',
} as const;

export type AttributeType = keyof typeof TYPE_LABELS;
export type Attribute = {
  id: number;
  key: string;
  displayName: string;
  type: AttributeType;
  datatype: 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN';
  unit: string;
  description: string;
};
export type Mapping = { id: number; alcoholId: number; attributeId: number; value: string };

export const emptyAttribute: Attribute = {
  id: 0,
  key: '',
  displayName: '',
  type: 'KEYWORD',
  datatype: 'STRING',
  unit: '',
  description: '',
};

export function displayValue(attribute: Attribute, rawValue: string) {
  if (!rawValue?.trim()) return '값 미등록';
  const value =
    attribute.datatype === 'INT' || attribute.datatype === 'DOUBLE'
      ? rawValue
          .split('.')
          .map((part, index) => (index === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : part))
          .join('.')
      : attribute.datatype === 'BOOLEAN'
        ? rawValue === 'true'
          ? '예'
          : '아니오'
        : rawValue;
  return `${value}${attribute.unit ? ` ${attribute.unit}` : ''}`;
}

export type AlcoholNode = {
  id: number;
  name: string;
  english: string;
  region: string;
  category: string;
  imageUrl?: string | null;
};

export function valueError(datatype: Attribute['datatype'], raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return '값을 입력하세요.';
  if (value.length > 255) return '255자 이내로 입력하세요.';
  if (datatype === 'INT' && !/^-?\d{1,18}$/.test(value)) return '18자리 이내 정수를 입력하세요.';
  if (datatype === 'DOUBLE' && !/^-?\d{1,15}(\.\d{1,6})?$/.test(value))
    return '정수부 15자리, 소수점 6자리 이내로 입력하세요.';
  if (datatype === 'BOOLEAN' && !['true', 'false'].includes(value))
    return 'true 또는 false를 입력하세요.';
}

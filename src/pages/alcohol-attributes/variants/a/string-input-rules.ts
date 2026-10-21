export const inputFormats = [
  { pattern: '', label: '제한 없음', example: '한글, 영문, 숫자, 기호를 입력할 수 있어요.' },
  { pattern: '[0-9]+', label: '숫자만', example: '예: 12345 · 공백과 기호는 사용할 수 없어요.' },
  {
    pattern: '[A-Za-z]+',
    label: '영문만',
    example: '예: Whisky · 대소문자를 모두 사용할 수 있어요.',
  },
  {
    pattern: '[a-z]+',
    label: '영문 소문자만',
    example: '예: whisky · 대문자, 숫자, 공백은 사용할 수 없어요.',
  },
  {
    pattern: '[A-Z]+',
    label: '영문 대문자만',
    example: '예: WHISKY · 소문자, 숫자, 공백은 사용할 수 없어요.',
  },
  {
    pattern: '[a-z_]+',
    label: '영문 소문자와 밑줄(_)',
    example: '예: tasting_note · 숫자와 공백은 사용할 수 없어요.',
  },
  {
    pattern: '[a-z0-9_]+',
    label: '영문 소문자·숫자·밑줄(_)',
    example: '예: tasting_note_01 · 대문자와 공백은 사용할 수 없어요.',
  },
  {
    pattern: '[a-z0-9-]+',
    label: '영문 소문자·숫자·하이픈(-)',
    example: '예: tasting-note-01 · 대문자와 공백은 사용할 수 없어요.',
  },
  {
    pattern: '[A-Za-z0-9]+',
    label: '영문과 숫자',
    example: '예: AB123 · 공백과 기호는 사용할 수 없어요.',
  },
  {
    pattern: '[가-힣]+',
    label: '한글만',
    example: '예: 부드러움 · 공백과 기호는 사용할 수 없어요.',
  },
];

export function inputFormatLabel(pattern?: string | null): string {
  if (!pattern) return '제한 없음';
  const preset = inputFormats.find((format) => format.pattern === pattern);
  if (preset) return preset.label;
  const rule = parseInputPattern(pattern);
  if (!rule) return '기존 맞춤 형식';
  const labels = characterGroups
    .filter((group) => rule.characters.includes(group.id))
    .map((group) => group.label)
    .join(' · ');
  const first = characterGroups.find((group) => group.id === rule.first);
  return `${labels}, ${rule.min}~${rule.max}자${first ? `, 첫 글자 ${first.label}` : ''}`;
}

export const characterGroups = [
  { id: 'lower', label: '영문 소문자', sample: 'a–z', source: 'a-z' },
  { id: 'upper', label: '영문 대문자', sample: 'A–Z', source: 'A-Z' },
  { id: 'digit', label: '숫자', sample: '0–9', source: '0-9' },
  { id: 'korean', label: '한글', sample: '가–힣', source: '가-힣' },
  { id: 'underscore', label: '밑줄', sample: '_', source: '_' },
  { id: 'space', label: '띄어쓰기', sample: '공백', source: ' ' },
  { id: 'hyphen', label: '하이픈', sample: '-', source: '-' },
] as const;
export type CharacterGroup = (typeof characterGroups)[number]['id'];
export type InputRule = {
  characters: CharacterGroup[];
  first: 'any' | CharacterGroup;
  min: number;
  max: number;
};
export const defaultInputRule: InputRule = {
  characters: ['lower', 'digit', 'underscore'],
  first: 'any',
  min: 1,
  max: 255,
};

export function inputRuleError(rule: InputRule) {
  if (!rule.characters.some((id) => id !== 'space'))
    return '공백 외에 허용할 문자를 하나 이상 선택하세요.';
  if (rule.first === 'space') return '첫 글자로는 공백을 사용할 수 없어요.';
  if (![rule.min, rule.max].every((n) => Number.isInteger(n) && n >= 1 && n <= 255))
    return '글자 수는 1~255 사이의 정수로 입력하세요.';
  if (rule.min > rule.max) return '최소 글자 수는 최대 글자 수보다 클 수 없어요.';
  if (rule.first !== 'any' && !rule.characters.includes(rule.first))
    return '첫 글자는 허용 문자 안에서 선택하세요.';
}

export function buildInputPattern(rule: InputRule) {
  const error = inputRuleError(rule);
  if (error) throw new Error(error);
  const chars = characterGroups
    .filter((group) => rule.characters.includes(group.id))
    .map((group) => group.source)
    .join('');
  const first = characterGroups.find((group) => group.id === rule.first);
  return first
    ? `[${first.source}][${chars}]{${rule.min - 1},${rule.max - 1}}`
    : `[${chars}]{${rule.min},${rule.max}}`;
}

// Parse only the restricted grammar we generate and the previously shipped presets.
// Unrecognized Java expressions must remain unchanged.
export function parseInputPattern(pattern: string): InputRule | null {
  const match = /^(?:\[([^\]]+)\])?\[([^\]]+)\](?:\+|\{(\d+),(\d+)\})$/.exec(pattern);
  if (!match) return null;
  const parseCharacters = (source: string) => {
    const ids: CharacterGroup[] = [];
    while (source) {
      const group = characterGroups.find((item) => source.startsWith(item.source));
      if (!group || ids.includes(group.id) || (group.id === 'hyphen' && source !== '-'))
        return null;
      ids.push(group.id);
      source = source.slice(group.source.length);
    }
    return characterGroups.filter((item) => ids.includes(item.id)).map((item) => item.id);
  };
  const characters = parseCharacters(match[2]!);
  const prefix = match[1] ? parseCharacters(match[1]) : null;
  if (!characters || (match[1] && prefix?.length !== 1)) return null;
  const offset = match[1] ? 1 : 0;
  const rule: InputRule = {
    characters,
    first: prefix?.[0] ?? 'any',
    min: match[3] === undefined ? 1 + offset : Number(match[3]) + offset,
    max: match[4] === undefined ? 255 : Number(match[4]) + offset,
  };
  return inputRuleError(rule) ? null : rule;
}

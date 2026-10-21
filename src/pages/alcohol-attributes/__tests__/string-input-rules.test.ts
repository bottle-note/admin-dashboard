import { expect, it } from 'vitest';
import { inputFormats, inputFormatLabel } from '../variants/a/string-input-rules';

it.each([
  ['[a-z]+', 'whisky', ['Whisky', 'whisky1', 'whisky_note']],
  ['[A-Z]+', 'WHISKY', ['Whisky', 'WHISKY1']],
  ['[a-z_]+', 'tasting_note', ['Tasting_note', 'note1', 'tasting note']],
  ['[a-z0-9_]+', 'tasting_note_01', ['Tasting_note', 'tasting-note']],
  ['[a-z0-9-]+', 'tasting-note-01', ['Tasting-note', 'tasting_note']],
])('%s 형식은 허용 문자만 통과시킨다', (pattern, valid, invalid) => {
  const format = inputFormats.find((item) => item.pattern === pattern);
  expect(format).toBeDefined();
  expect(inputFormatLabel(pattern)).toBe(format?.label);
  const regex = new RegExp(`^(?:${pattern})$`);
  expect(regex.test(valid)).toBe(true);
  for (const value of [...invalid, '']) expect(regex.test(value)).toBe(false);
});

it('문자 조합과 첫 글자 및 길이를 생성하고 다시 복원한다', async () => {
  const { buildInputPattern, parseInputPattern } = await import('../variants/a/string-input-rules');
  const rule = {
    characters: ['lower', 'digit', 'underscore'],
    first: 'lower',
    min: 1,
    max: 64,
  } as const;
  const pattern = buildInputPattern({ ...rule, characters: [...rule.characters] });
  expect(parseInputPattern(pattern)).toEqual(rule);
  const regex = new RegExp(`^(?:${pattern})$`);
  expect(regex.test('tasting_note_01')).toBe(true);
  expect(regex.test('1tasting_note')).toBe(false);
  expect(regex.test('A_note')).toBe(false);
  expect(regex.test('a'.repeat(64))).toBe(true);
  expect(regex.test('a'.repeat(65))).toBe(false);
});
it('기존 프리셋을 복원하고 알 수 없는 Java 패턴은 변환하지 않는다', async () => {
  const { parseInputPattern } = await import('../variants/a/string-input-rules');
  for (const format of inputFormats.filter((item) => item.pattern))
    expect(parseInputPattern(format.pattern)).not.toBeNull();
  expect(parseInputPattern('\\p{L}{2,10}')).toBeNull();
});

it('한글·띄어쓰기·하이픈을 조합하고 길이 오류는 거부한다', async () => {
  const { buildInputPattern, inputRuleError, parseInputPattern } =
    await import('../variants/a/string-input-rules');
  const rule = {
    characters: ['korean', 'space', 'hyphen'],
    first: 'any',
    min: 2,
    max: 10,
  } as const;
  const pattern = buildInputPattern({ ...rule, characters: [...rule.characters] });
  expect(parseInputPattern(pattern)).toEqual(rule);
  expect(new RegExp(`^(?:${pattern})$`).test('부드러운 향-맛')).toBe(true);
  expect(new RegExp(`^(?:${pattern})$`).test('Whisky')).toBe(false);
  expect(inputRuleError({ ...rule, characters: [...rule.characters], min: 11 })).toBeTruthy();
  expect(inputRuleError({ ...rule, characters: [...rule.characters], max: 256 })).toBeTruthy();
});

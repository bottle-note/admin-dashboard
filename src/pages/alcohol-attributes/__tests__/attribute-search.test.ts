import { describe, expect, it } from 'vitest';
import { readAttributeSearch } from '../variants/a/attribute-search';

const parse = (conditions: unknown) =>
  readAttributeSearch(new URLSearchParams({ conditions: JSON.stringify(conditions) }));

describe('속성 검색 URL과 API 조건 계약', () => {
  it.each(['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS'])(
    '%s는 값이 없거나 공백이면 요청을 막는다',
    (operator) => {
      expect(parse([{ key: 'price', operator }]).error).toBeDefined();
      expect(parse([{ key: 'price', operator, value: '  ' }]).error).toBeDefined();
    }
  );
  it.each(['EXISTS', 'NOT_EXISTS'])('%s는 값이 붙은 URL을 거부한다', (operator) => {
    expect(parse([{ key: 'price', operator, value: '100' }]).error).toBeDefined();
    expect(parse([{ key: 'price', operator }]).error).toBeUndefined();
  });
  it('동일 속성 범위와 큰 숫자의 문자열 값을 보존한다', () => {
    const conditions = [
      { key: 'price', operator: 'GTE', value: '9007199254740993' },
      { key: 'price', operator: 'LTE', value: '9007199254740999' },
    ];
    expect(parse(conditions)).toEqual({ value: { match: 'AND', conditions } });
  });
  it('빈 조건과 20개 조건은 허용하고 21개는 거부한다', () => {
    const condition = { key: 'price', operator: 'EXISTS' };
    expect(parse([]).error).toBeUndefined();
    expect(parse(Array(20).fill(condition)).error).toBeUndefined();
    expect(parse(Array(21).fill(condition)).error).toBeDefined();
  });
});

import { describe, expect, it } from 'vitest';

import {
  createCurationTargetUrl,
  extractCurationIdFromTargetUrl,
} from '../banner-curation-link';

describe('banner curation links', () => {
  it('V2 큐레이션 상세 링크를 생성한다', () => {
    expect(createCurationTargetUrl(42)).toBe('/curation/42');
  });

  it.each([
    ['/curation/42', 42],
    ['/search?curationId=42', 42],
    ['/alcohols/search?curationId=42', 42],
  ])('V2 및 레거시 링크에서 큐레이션 ID를 추출한다', (targetUrl, expectedId) => {
    expect(extractCurationIdFromTargetUrl(targetUrl)).toBe(expectedId);
  });

  it.each([
    undefined,
    '',
    '/curation/0',
    '/curation/-1',
    '/curation/abc',
    '/search',
    '/search?curationId=1&curationId=2',
    '/search?curationId=1.5',
    '/other?curationId=42',
    'https://example.com/search?curationId=42',
  ])('안전하지 않거나 관련 없는 링크는 추출하지 않는다: %s', (targetUrl) => {
    expect(extractCurationIdFromTargetUrl(targetUrl)).toBeNull();
  });
});

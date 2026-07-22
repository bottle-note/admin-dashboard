import { describe, expect, it } from 'vitest';

import { regionDefaultValues, regionFormSchema } from '../region.schema';

describe('regionFormSchema', () => {
  const validRegion = {
    ...regionDefaultValues,
    korName: '스코틀랜드',
    engName: 'Scotland',
  };

  it('imageUrl 기본값을 null로 유지한다', () => {
    expect(regionDefaultValues.imageUrl).toBeNull();
    expect(regionFormSchema.parse(validRegion).imageUrl).toBeNull();
  });

  it('imageUrl에 URL 문자열과 null을 허용한다', () => {
    expect(
      regionFormSchema.parse({
        ...validRegion,
        imageUrl: 'https://example.com/regions/scotland.webp',
      }).imageUrl
    ).toBe('https://example.com/regions/scotland.webp');
    expect(regionFormSchema.parse({ ...validRegion, imageUrl: null }).imageUrl).toBeNull();
  });
});

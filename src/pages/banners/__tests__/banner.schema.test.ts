import { describe, it, expect } from 'vitest';
import { bannerFormSchema, DEFAULT_BANNER_FORM } from '../banner.schema';

describe('bannerFormSchema', () => {
  it('기본값으로 유효성 검사를 통과하지 못한다 (필수값 누락)', () => {
    const result = bannerFormSchema.safeParse(DEFAULT_BANNER_FORM);
    expect(result.success).toBe(false);
  });

  it('모든 필수값을 채우면 통과한다', () => {
    const validData = {
      ...DEFAULT_BANNER_FORM,
      name: '테스트 배너',
      imageUrl: 'https://example.com/test.jpg',
      startDate: '2024-01-01T00:00:00',
      endDate: '2024-12-31T23:59:59',
      targetUrl: '/test',
      curationId: 1,
    };

    const result = bannerFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe('mediaType 필드', () => {
    const validBase = {
      ...DEFAULT_BANNER_FORM,
      name: '테스트 배너',
      imageUrl: 'https://example.com/test.jpg',
      startDate: '2024-01-01T00:00:00',
      endDate: '2024-12-31T23:59:59',
      targetUrl: '/test',
      curationId: 1,
    };

    it('mediaType이 IMAGE이면 통과한다', () => {
      const result = bannerFormSchema.safeParse({ ...validBase, mediaType: 'IMAGE' });
      expect(result.success).toBe(true);
    });

    it('mediaType이 VIDEO이면 통과한다', () => {
      const result = bannerFormSchema.safeParse({ ...validBase, mediaType: 'VIDEO' });
      expect(result.success).toBe(true);
    });

    it('mediaType 기본값은 IMAGE이다', () => {
      expect(DEFAULT_BANNER_FORM.mediaType).toBe('IMAGE');
    });

    it('잘못된 mediaType 값은 통과하지 못한다', () => {
      const result = bannerFormSchema.safeParse({ ...validBase, mediaType: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});

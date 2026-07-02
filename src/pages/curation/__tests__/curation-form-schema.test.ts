import { describe, expect, it } from 'vitest';

import type { CurationTextFieldModel } from '../curation-form-model';
import { createCurationFieldValueSchema, formatCurationFieldTopic } from '../curation-form-schema';

function createRequiredTextField(label: string): CurationTextFieldModel {
  return {
    key: 'field',
    label,
    required: true,
    kind: 'text',
  };
}

describe('curation form schema validation messages', () => {
  it('받침 있는 한글 라벨은 은 조사로 표시한다', () => {
    const schema = createCurationFieldValueSchema(createRequiredTextField('장소명'));
    const result = schema.safeParse('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('장소명은 필수입니다.');
    }
  });

  it('받침 없는 한글 라벨은 는 조사로 표시한다', () => {
    expect(formatCurationFieldTopic('주소')).toBe('주소는');
  });

  it('한글 음절로 끝나지 않는 라벨은 기존처럼 는 조사로 표시한다', () => {
    expect(formatCurationFieldTopic('참가비(1인당)')).toBe('참가비(1인당)는');
  });
});

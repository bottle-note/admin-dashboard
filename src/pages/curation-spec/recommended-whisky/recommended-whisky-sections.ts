import type { JsonSchemaNode } from '@/types/api';

import type { CurationSpecSections } from '../curation-sections.type';
import type { WhiskyCurationRequestSpec } from '../curation-spec.schema';

export function getRecommendedWhiskySections(requestSpec: WhiskyCurationRequestSpec) {
  return {
    라인업: {
      subtitle: '큐레이션에 노출할 라인업을 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: {
          schema: requestSpec as JsonSchemaNode,
          required: true,
        },
      },
    },
  } satisfies CurationSpecSections;
}

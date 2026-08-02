import type { JsonSchemaNode } from '@/types/api';

import type { CurationSpecSections } from '../curation-sections.type';
import type { WhiskyCurationRequestSpec } from '../curation-spec.schema';

export function getWhiskyPairingSections(requestSpec: WhiskyCurationRequestSpec) {
  return {
    라인업: {
      subtitle: '페어링할 라인업과 음식을 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: {
          schema: requestSpec as JsonSchemaNode,
          required: true,
          pairing: {
            itemLabel: '페어링 음식',
            addButtonLabel: '페어링 음식 추가',
            fields: {
              itemName: { label: '음식명', placeholder: '예: 바닐라 아이스크림' },
              pairingNote: {
                label: '페어링 설명',
                placeholder: '라인업의 풍미와 잘 어울리는 이유를 입력해주세요.',
              },
              itemImageUrl: { label: '음식 이미지' },
            },
          },
        },
      },
    },
  } satisfies CurationSpecSections;
}

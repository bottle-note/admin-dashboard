import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/test-utils';

import type { WhiskyTastingEventAlcoholItemSchema } from '../../curation-spec.schema';
import { CurationSpecDatabaseAlcoholAddCard } from '../CurationSpecDatabaseAlcoholAddCard';

const schema = {
  properties: {
    alcohol: {
      properties: {
        selectedTags: {
          maxItems: 1,
        },
      },
    },
  },
} as WhiskyTastingEventAlcoholItemSchema;

describe('CurationSpecDatabaseAlcoholAddCard', () => {
  it('선택한 DB 위스키를 상세 조회해 태그와 평점 통계를 매핑한다', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <CurationSpecDatabaseAlcoholAddCard
        index={0}
        schema={schema}
        config={{
          itemLabel: '라인업',
          emptyMessage: '라인업을 추가해주세요.',
          fields: {},
        }}
        required={false}
        excludeIds={[]}
        onAdd={onAdd}
        onAddManual={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText('위스키 검색 ...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({
        source: 'BOTTLE_NOTE',
        alcohol: {
          alcoholId: 10,
          korName: '글렌피딕 12년',
          engName: 'Glenfiddich 12',
          imageUrl: 'https://example.com/glenfiddich.jpg',
          abv: '40',
          cask: '오크',
          volume: '700ml',
          regionName: '스코틀랜드',
          korCategory: '싱글몰트',
          selectedTags: ['바닐라'],
        },
        stats: {
          rating: 4.2,
          totalRatingsCount: 150,
        },
        comment: '',
      });
    });
  });
});

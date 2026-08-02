import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/test-utils';

import type { WhiskyTastingEventAlcoholItemSchema } from '../../curation-spec.schema';
import { CurationSpecAlcoholCard } from '../CurationSpecAlcoholCard';

const schema = {
  required: [],
  properties: {
    alcohol: {
      required: ['korName', 'selectedTags'],
      properties: {
        selectedTags: {
          maxItems: 12,
          'x-display-name': '테이스팅 태그',
        },
      },
    },
    comment: {
      maxLength: 500,
      'x-display-name': '위스키 기대평',
    },
  },
} as unknown as WhiskyTastingEventAlcoholItemSchema;

function TestForm() {
  const form = useForm({
    defaultValues: {
      alcohols: [
        {
          alcohol: {
            korName: '테스트 위스키',
            selectedTags: [],
          },
          comment: '',
        },
      ],
    },
  });

  return (
    <FormProvider {...form}>
      <CurationSpecAlcoholCard
        name="alcohols.0"
        index={0}
        schema={schema}
        required={false}
        imageUrl=""
        imageAlt="테스트 위스키"
        isDragOver={false}
        onRemove={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        canMoveUp={false}
        canMoveDown={false}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
        onDragEnd={vi.fn()}
      >
        <p>테스트 위스키</p>
      </CurationSpecAlcoholCard>
    </FormProvider>
  );
}

describe('CurationSpecAlcoholCard', () => {
  it('테이스팅 태그를 스키마 required 여부와 관계없이 선택 입력으로 표시한다', () => {
    render(<TestForm />);

    const tastingTagLabel = screen.getByText('테이스팅 태그');
    expect(tastingTagLabel).not.toHaveTextContent('*');
    expect(screen.getByText('0/12')).toBeInTheDocument();
  });
});

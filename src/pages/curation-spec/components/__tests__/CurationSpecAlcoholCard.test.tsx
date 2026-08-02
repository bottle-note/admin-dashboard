import { FormProvider, useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/test-utils';

import type {
  WhiskyCurationPairingListSchema,
  WhiskyTastingEventAlcoholItemSchema,
} from '../../curation-spec.schema';
import { CurationSpecAlcoholCard } from '../CurationSpecAlcoholCard';
import { CurationSpecManualAlcoholCard } from '../CurationSpecManualAlcoholCard';

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
        config={{
          itemLabel: '라인업',
          emptyMessage: '라인업을 추가해주세요.',
          fields: {},
        }}
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

const pairingSchema = {
  minItems: 1,
  maxItems: 2,
  items: {
    required: ['itemName', 'pairingNote'],
    properties: {
      itemName: { maxLength: 100, 'x-display-name': '서버 음식명' },
      pairingNote: { maxLength: 500, 'x-display-name': '서버 페어링 설명' },
    },
  },
} as unknown as WhiskyCurationPairingListSchema;

function PairingTestForm() {
  const form = useForm({
    defaultValues: {
      alcohols: [
        {
          alcohol: {
            korName: '테스트 위스키',
            selectedTags: [],
          },
          comment: '',
          pairings: [{ itemName: '', pairingNote: '' }],
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
        config={{ itemLabel: '라인업', emptyMessage: '', fields: {} }}
        pairingSchema={pairingSchema}
        pairingConfig={{
          itemLabel: '페어링 음식',
          addButtonLabel: '페어링 음식 추가',
          fields: {
            itemName: { label: '음식명', placeholder: '음식 입력' },
            pairingNote: { label: '페어링 설명', placeholder: '설명 입력' },
          },
        }}
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
  it('section 설정의 항목 라벨을 카드 제목에 사용한다', () => {
    render(<TestForm />);

    expect(screen.getByRole('heading', { name: '라인업 1' })).toBeInTheDocument();
    expect(screen.queryByText('시음 위스키 1')).not.toBeInTheDocument();
  });

  it('테이스팅 태그를 스키마 required 여부와 관계없이 선택 입력으로 표시한다', () => {
    render(<TestForm />);

    const tastingTagLabel = screen.getByText('테이스팅 태그');
    expect(tastingTagLabel).not.toHaveTextContent('*');
    expect(screen.getByText('0/12')).toBeInTheDocument();
  });

  it('pairing section 설정을 카드 내부 페어링 필드에 적용한다', async () => {
    const user = userEvent.setup();
    render(<PairingTestForm />);

    expect(screen.getByRole('heading', { name: /페어링 음식 1/ })).toBeInTheDocument();
    expect(screen.getByLabelText('음식명')).toHaveAttribute('placeholder', '음식 입력');
    expect(screen.queryByText('위스키 기대평')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '페어링 음식 추가' }));

    expect(screen.getByRole('heading', { name: /페어링 음식 2/ })).toBeInTheDocument();
  });
});

const manualSchema = {
  required: [],
  properties: {
    alcohol: {
      required: ['korName'],
      properties: {
        korName: { description: '위스키 한글명' },
        engName: { description: '위스키 영문명' },
        imageUrl: { description: '위스키 이미지' },
        abv: { description: '도수' },
        volume: { description: '용량' },
        cask: { description: '캐스크' },
        regionName: { description: '지역' },
        korCategory: { description: '카테고리' },
        selectedTags: {
          maxItems: 12,
          'x-display-name': '테이스팅 태그',
        },
      },
    },
    comment: {
      maxLength: 500,
      'x-display-name': '기대평',
    },
  },
} as unknown as WhiskyTastingEventAlcoholItemSchema;

function ManualAlcoholTestForm() {
  const form = useForm({
    defaultValues: {
      alcohols: [
        {
          alcohol: {
            korName: '',
            engName: '',
            imageUrl: '',
            abv: '',
            volume: '',
            cask: '',
            regionName: '',
            korCategory: '',
            selectedTags: [],
          },
          comment: '',
        },
      ],
    },
  });

  return (
    <FormProvider {...form}>
      <CurationSpecManualAlcoholCard
        name="alcohols.0"
        index={0}
        schema={manualSchema}
        config={{
          itemLabel: '라인업',
          emptyMessage: '라인업을 추가해주세요.',
          fields: {
            korName: { label: '한글명' },
            engName: { label: '영문명' },
          },
        }}
        required={false}
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
      />
    </FormProvider>
  );
}

describe('CurationSpecManualAlcoholCard', () => {
  it('section 커스텀 라벨을 서버 description보다 우선한다', () => {
    render(<ManualAlcoholTestForm />);

    expect(screen.getByText('한글명')).toBeInTheDocument();
    expect(screen.getByText('영문명')).toBeInTheDocument();
    expect(screen.queryByText('위스키 한글명')).not.toBeInTheDocument();
    expect(screen.queryByText('위스키 영문명')).not.toBeInTheDocument();
  });
});

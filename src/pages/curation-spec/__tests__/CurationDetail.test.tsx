import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { CurationSpecCode, type CurationV2Detail } from '@/types/api';

import { CurationDetail } from '../CurationDetail';

const testState = vi.hoisted(() => ({
  curation: undefined as CurationV2Detail | undefined,
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '10' }),
  };
});

vi.mock('@/hooks/useCurations', () => ({
  useCurationDetail: () => ({
    data: testState.curation,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../curation-spec.schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../curation-spec.schema')>();

  return {
    ...actual,
    whiskyCurationRequestSpecSchema: {
      safeParse: (value: unknown) => ({ success: true, data: value }),
    },
    whiskyCurationDetailPayloadSchema: {
      safeParse: (value: unknown) => ({ success: true, data: value }),
    },
  };
});

vi.mock('../recommended-whisky/RecommendedWhiskyForm', () => ({
  RecommendedWhiskyForm: ({ initialValues }: { initialValues: { alcohols: unknown[] } }) => (
    <div data-testid="whisky-curation-form">추천:{initialValues.alcohols.length}</div>
  ),
}));

vi.mock('../whisky-pairing/WhiskyPairingForm', () => ({
  WhiskyPairingForm: ({ initialValues }: { initialValues: { alcohols: unknown[] } }) => (
    <div data-testid="whisky-curation-form">페어링:{initialValues.alcohols.length}</div>
  ),
}));

function createCuration(code: string): CurationV2Detail {
  return {
    id: 10,
    name: '큐레이션',
    description: null,
    coverImageUrl: null,
    imageUrls: [],
    exposureStartDate: null,
    exposureEndDate: null,
    displayOrder: 0,
    isActive: true,
    createdAt: '2026-08-02T00:00:00',
    modifiedAt: '2026-08-02T00:00:00',
    spec: {
      id: 1,
      code,
      name: '스펙',
      description: null,
      hydratorKey: 'alcohol',
      version: 1,
      isActive: true,
      requestSpec: { type: 'object' },
      responseSpec: { type: 'object' },
    },
    payload: [
      {
        source: 'MANUAL',
        alcohol: { korName: '라인업', selectedTags: [] },
      },
    ],
  };
}

describe('CurationDetail 추천·페어링 분기', () => {
  beforeEach(() => {
    testState.curation = undefined;
  });

  it('추천 위스키는 추천 section을 명시적으로 전달한다', () => {
    testState.curation = createCuration(CurationSpecCode.RECOMMENDED_WHISKY);

    render(<CurationDetail />);

    expect(screen.getByTestId('whisky-curation-form')).toHaveTextContent('추천:1');
  });

  it('위스키 페어링은 페어링 section을 명시적으로 전달한다', () => {
    testState.curation = createCuration(CurationSpecCode.WHISKY_PAIRING);

    render(<CurationDetail />);

    expect(screen.getByTestId('whisky-curation-form')).toHaveTextContent('페어링:1');
  });
});

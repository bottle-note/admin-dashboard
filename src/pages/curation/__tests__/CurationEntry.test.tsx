import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import type { CurationV2Spec } from '@/types/api';
import { CurationEntryPage } from '../CurationEntry';

const SPEC_BASE = '/admin/api/v2/curation-specs';

const mockSpecs: CurationV2Spec[] = [
  {
    id: 3,
    code: 'WHISKY_PAIRING',
    name: '페어링',
    description: '위스키와 어울리는 음식/아이템 페어링을 작성합니다.',
    hydratorKey: 'pairing',
    version: 1,
    isActive: true,
    requestSpec: {
      type: 'object',
    },
    responseSpec: {
      type: 'object',
    },
  },
  {
    id: 2,
    code: 'RECOMMENDED_WHISKY',
    name: '추천 위스키',
    description: '추천 위스키 카드 목록',
    hydratorKey: 'alcohol',
    version: 1,
    isActive: true,
    requestSpec: {
      type: 'object',
      required: ['source', 'alcohol'],
    },
    responseSpec: {
      type: 'object',
    },
  },
  {
    id: 1,
    code: 'WHISKY_TASTING_EVENT',
    name: '시음회',
    description: '시음회 날짜, 장소, 참가 정보와 시음 위스키 라인업',
    hydratorKey: 'alcohol',
    version: 1,
    isActive: true,
    requestSpec: {
      type: 'object',
      required: ['eventDate'],
    },
    responseSpec: {
      type: 'object',
    },
  },
  {
    id: 4,
    code: 'INACTIVE_SPEC',
    name: '비활성 스펙',
    description: '비활성 스펙',
    hydratorKey: null,
    version: 1,
    isActive: false,
    requestSpec: {
      type: 'object',
    },
    responseSpec: {
      type: 'object',
    },
  },
];

function mockSpecList(specs = mockSpecs) {
  server.use(
    http.get(SPEC_BASE, () => {
      return HttpResponse.json(wrapApiResponse(specs));
    })
  );
}

describe('CurationEntryPage', () => {
  const getFirstPreviewButton = async () => {
    const [firstPreviewButton] = await screen.findAllByRole('button', { name: /미리보기/ });

    if (!firstPreviewButton) {
      throw new Error('미리보기 버튼을 찾을 수 없습니다.');
    }

    return firstPreviewButton;
  };

  it('활성 큐레이션 스펙을 API 응답 기반으로 표시하고 정해진 code 순서로 정렬한다', async () => {
    mockSpecList();

    render(<CurationEntryPage />);

    const typeSection = screen.getByLabelText('큐레이션 유형 선택');
    await screen.findByRole('heading', { name: '시음회' });
    const headings = within(typeSection).getAllByRole('heading', { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      '시음회',
      '추천 위스키',
      '페어링',
    ]);
    expect(screen.queryByRole('heading', { name: '비활성 스펙' })).not.toBeInTheDocument();
  });

  it('각 활성 스펙 카드에 작성하기와 미리보기 액션을 표시한다', async () => {
    mockSpecList();

    render(<CurationEntryPage />);

    expect(await screen.findAllByRole('link', { name: /작성하기/ })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /미리보기/ })).toHaveLength(3);
  });

  it('미리보기 패널은 빈 공간을 확보한다', async () => {
    mockSpecList();

    render(<CurationEntryPage />);

    await screen.findByRole('heading', { name: '시음회' });

    expect(screen.getByRole('heading', { name: '미리보기' })).toBeInTheDocument();
    expect(screen.getByLabelText('비어 있는 미리보기 공간')).toBeInTheDocument();
  });

  it.skip('미리보기 버튼을 누르면 선택한 유형의 미리보기 이미지를 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecList();

    render(<CurationEntryPage />);

    await user.click(await getFirstPreviewButton());

    expect(screen.getByRole('img', { name: '시음회 미리보기' })).toBeInTheDocument();
  });

  it('미리보기 버튼을 누르면 선택된 타입만 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecList();

    render(<CurationEntryPage />);

    await user.click(await getFirstPreviewButton());

    expect(screen.getByText('시음회 미리보기 선택됨')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '큐레이션' })).toBeInTheDocument();
  });

  it('활성 스펙이 없으면 빈 상태를 표시한다', async () => {
    mockSpecList(mockSpecs.map((spec) => ({ ...spec, isActive: false })));

    render(<CurationEntryPage />);

    expect(await screen.findByText('생성 가능한 큐레이션 스펙이 없습니다.')).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import type { CurationV2SpecListItem } from '@/types/api';
import { CurationEntryPage } from '../CurationEntry';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const mockShowToast = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useToast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useToast')>();

  return {
    ...actual,
    useToast: () => ({
      toasts: [],
      showToast: mockShowToast,
      dismissToast: vi.fn(),
      clearAllToasts: vi.fn(),
    }),
  };
});

const mockSpecs: CurationV2SpecListItem[] = [
  {
    id: 3,
    code: 'WHISKY_PAIRING',
    name: '페어링',
    description: '위스키와 어울리는 음식/아이템 페어링을 작성합니다.',
    version: 1,
    isActive: true,
  },
  {
    id: 2,
    code: 'RECOMMENDED_WHISKY',
    name: '추천 위스키',
    description: '추천 위스키 카드 목록',
    version: 1,
    isActive: true,
  },
  {
    id: 1,
    code: 'WHISKY_TASTING_EVENT',
    name: '시음회',
    description: '시음회 날짜, 장소, 참가 정보와 시음 위스키 라인업',
    version: 1,
    isActive: true,
  },
  {
    id: 4,
    code: 'INACTIVE_SPEC',
    name: '비활성 스펙',
    description: '비활성 스펙',
    version: 1,
    isActive: false,
  },
];

function mockSpecList(specs: CurationV2SpecListItem[] = mockSpecs) {
  server.use(
    http.get(SPEC_BASE, () => {
      return HttpResponse.json(wrapApiResponse(specs));
    })
  );
}

describe('CurationEntryPage', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
  });

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
    expect(await screen.findByRole('heading', { name: '시음회' })).toBeInTheDocument();
    const headings = within(typeSection).getAllByRole('heading', { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      '시음회',
      '일반 큐레이션',
      '페어링 · 위스키 → 음식',
    ]);
    expect(screen.getByText('특정 바에서 특정 기간 동안 위스키를 시음하는 모집을 만듭니다.')).toBeInTheDocument();
    expect(screen.getByText('입문자를 위한 스카치 베스트 6')).toBeInTheDocument();
    expect(screen.getByText('추천 음식 N개(자유 입력)')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '비활성 스펙' })).not.toBeInTheDocument();
  });

  it('각 활성 스펙 카드에 작성하기와 미리보기 액션을 표시한다', async () => {
    mockSpecList();

    render(<CurationEntryPage />);

    expect(await screen.findAllByRole('button', { name: /작성하기/ })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /미리보기/ })).toHaveLength(3);
  });

  it('준비되지 않은 활성 스펙의 작성하기를 누르면 준비중 안내를 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecList([
      ...mockSpecs,
      {
        id: 5,
        code: 'SEASONAL_PICK',
        name: '시즌 큐레이션',
        description: '아직 작성 화면이 준비되지 않은 스펙',
        version: 1,
        isActive: true,
      },
    ]);

    render(<CurationEntryPage />);

    await screen.findByRole('heading', { name: '시즌 큐레이션' });

    await user.click(screen.getByRole('button', { name: '시즌 큐레이션 작성하기' }));

    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'info',
      message: '준비중입니다',
    });
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
    expect(
      screen.getByRole('heading', { name: '어떤 큐레이션을 만드시겠어요?' })
    ).toBeInTheDocument();
  });

  it('활성 스펙이 없으면 빈 상태를 표시한다', async () => {
    mockSpecList(mockSpecs.map((spec) => ({ ...spec, isActive: false })));

    render(<CurationEntryPage />);

    expect(await screen.findByText('생성 가능한 큐레이션 스펙이 없습니다.')).toBeInTheDocument();
  });
});

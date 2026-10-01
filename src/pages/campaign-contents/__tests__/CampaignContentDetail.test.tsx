import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ApiError } from '@/lib/api-error';
import { CampaignContentDetailPage } from '../CampaignContentDetail';

const navigate = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const metrics = vi.fn((_id: number | undefined, _range: unknown) => ({
  data: {
    from: '2026-09-24',
    to: '2026-09-30',
    viewVisitors: 10,
    startVisitors: 8,
    finishVisitors: 4,
    resultMembers: 3,
    activeMembers: 20,
    completionRate: 50.125,
    loginConversionRate: 75.0,
    participationRate: 15.0,
  },
  isLoading: false,
  isError: false,
}));
let id = 'new';
let deleteError: unknown = null;
const detailData = {
  id: 7,
  code: 'whiskey-mbti',
  name: '위스키 MBTI',
  description: '성격 테스트',
  isActive: true,
  createdAt: '2026-09-15',
  modifiedAt: '2026-09-15',
};
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate, useParams: () => ({ id }) };
});
vi.mock('@/hooks/useCampaignContents', () => ({
  useCampaignContentDetail: () => ({
    data: id === 'new' ? undefined : detailData,
    isLoading: false,
    isError: false,
  }),
  useCampaignContentMetrics: (campaignId: number | undefined, range: unknown) =>
    metrics(campaignId, range),
  useCampaignContentCreate: (opts: { onSuccess: (result: { targetId: number }) => void }) => ({
    mutate: (data: unknown) => {
      create(data);
      opts.onSuccess({ targetId: 9 });
    },
    isPending: false,
  }),
  useCampaignContentUpdate: () => ({ mutate: update, isPending: false }),
  useCampaignContentDelete: (opts: { onError: (error: unknown) => void }) => ({
    mutate: (value: unknown) => {
      remove(value);
      if (deleteError) opts.onError(deleteError);
    },
    isPending: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  id = 'new';
  deleteError = null;
});

describe('캠페인 콘텐츠 등록·상세', () => {
  it('설명 필수·코드 형식을 확인하고 등록 후 생성된 상세로 이동한다', async () => {
    render(<CampaignContentDetailPage />);
    await userEvent.type(screen.getByLabelText('이름'), '타로');
    await userEvent.type(screen.getByLabelText('코드'), 'Bad_Code');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(create).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText('코드'));
    await userEvent.type(screen.getByLabelText('코드'), 'whiskey-tarot');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(create).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('설명'), '카드 세 장');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: '타로',
        code: 'whiskey-tarot',
        description: '카드 세 장',
        isActive: true,
      })
    );
    expect(navigate).toHaveBeenCalledWith('/campaign-contents/9');
    expect(metrics).not.toHaveBeenCalled();
  });

  it('코드를 수정하지 못하며 PUT에는 코드를 보내지 않고 기본 기간 지표를 보여준다', async () => {
    id = '7';
    render(<CampaignContentDetailPage />);
    expect(screen.getByLabelText('코드')).toBeDisabled();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50.125%')).toBeInTheDocument();
    expect(metrics).toHaveBeenCalledWith(7, {});
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        id: 7,
        data: { name: '위스키 MBTI', description: '성격 테스트', isActive: true },
      })
    );
  });

  it('로그인 전환율의 근사 집계 기준을 툴팁으로 설명한다', async () => {
    id = '7';
    render(<CampaignContentDetailPage />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    await userEvent.hover(screen.getByRole('button', { name: '로그인 전환율 집계 기준' }));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('완료(FINISH) 방문자');
    expect(tooltip).toHaveTextContent('결과 조회(RESULT)');
    expect(tooltip).toHaveTextContent('근사치');
    expect(tooltip).toHaveTextContent('이미 로그인한 방문자도 포함');
    expect(tooltip).toHaveTextContent('비회원 공유 결과 조회는 제외');
  });

  it('잘못된 기간은 요청하지 않고 유효한 서울 날짜 기간만 조회한다', async () => {
    id = '7';
    render(<CampaignContentDetailPage />);
    expect(metrics).toHaveBeenCalledWith(7, {});
    metrics.mockClear();
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '2000-01-01' } });
    await userEvent.click(screen.getByRole('button', { name: '조회' }));
    expect(screen.getByRole('alert')).toHaveTextContent('최근 90일');
    expect(metrics.mock.calls.every(([, range]) => Object.keys(range as object).length === 0)).toBe(
      true
    );
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: today } });
    fireEvent.change(screen.getByLabelText('종료일'), { target: { value: today } });
    await userEvent.click(screen.getByRole('button', { name: '조회' }));
    expect(metrics).toHaveBeenLastCalledWith(7, { from: today, to: today });
  });

  it('삭제 확인 뒤 기록이 있으면 상세에 남아 비활성화를 안내한다', async () => {
    id = '7';
    deleteError = new ApiError({
      success: false,
      code: 409,
      data: null,
      errors: [{ code: 'CAMPAIGN_CONTENT_HAS_EVENTS' }],
      meta: {
        serverVersion: '',
        serverPathVersion: '',
        serverEncoding: '',
        serverResponseTime: '',
      },
    });
    render(<CampaignContentDetailPage />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' })
    );
    expect(remove).toHaveBeenCalledWith(7);
    expect(await screen.findByText(/비활성화하세요/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});

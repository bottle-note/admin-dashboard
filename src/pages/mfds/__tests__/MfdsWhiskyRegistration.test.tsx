import { expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { MfdsWhiskyRegistration } from '../MfdsWhiskyRegistration';

it('신고 이름을 채우고 미입력 규격을 경고하지만 등록·매칭·업로드 요청은 보내지 않는다', async () => {
  const writes: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    if (request.method !== 'GET') writes.push(request.method);
  };
  server.events.on('request:start', listener);
  try {
    const user = userEvent.setup();
    render(
      <MfdsWhiskyRegistration
        onComplete={vi.fn()}
        source={{
          id: 19612,
          rcno: 'TEST',
          skuDisplayNameKo: '신고 SKU 18년',
          skuDisplayNameEn: 'SKU 18',
          baseProductNameKo: '기본명',
          baseProductNameEn: 'Base',
          abvPercent: null,
          ageYears: 18,
          unitVolumeMl: null,
          selectedRegionId: null,
          selectedDistilleryId: null,
        }}
      />
    );
    const button = await screen.findByRole('button', { name: '등록하고 연결' });
    expect(await screen.findByDisplayValue('신고 SKU 18년')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('40')).not.toBeInTheDocument();
    await user.click(button);
    expect(screen.getByRole('alert')).toHaveTextContent('필수 입력값과 이미지를 확인하세요.');
    expect(screen.getByText('용량은 필수입니다')).toBeInTheDocument();
    expect(screen.getByText('이미지는 필수입니다')).toBeInTheDocument();
    expect(screen.getByText('신고 데이터에 도수가 없어 직접 입력해야 합니다.')).toBeVisible();
    await user.type(screen.getByPlaceholderText('예: 40 또는 50~60 (% 제외)'), '43');
    expect(
      screen.queryByText('신고 데이터에 도수가 없어 직접 입력해야 합니다.')
    ).not.toBeInTheDocument();
    expect(writes).toEqual([]);
  } finally {
    server.events.removeListener('request:start', listener);
  }
});

// Image decoding/cropping is a browser boundary; keep the real form, upload hook and API mutations.
vi.mock('@/pages/whisky/components/WhiskyImageCard', () => ({
  WhiskyImageCard: ({ onImageChange }: { onImageChange: (file: File, url: string) => void }) => (
    <button
      onClick={() =>
        onImageChange(new File(['image'], 'qa.webp', { type: 'image/webp' }), 'blob:qa')
      }
    >
      테스트 이미지 선택
    </button>
  ),
}));

it('등록 후 연결 실패 시 재진입해도 같은 위스키로 연결만 재시도한다', async () => {
  const { http, HttpResponse } = await import('msw');
  const { wrapApiResponse } = await import('@/test/mocks/data');
  const { s3Service } = await import('@/services/s3.service');
  const upload = vi.spyOn(s3Service, 'uploadFile').mockResolvedValue('https://cdn.example/qa.webp');
  let creates = 0;
  const matches: unknown[] = [];
  const completed = vi.fn();
  const source = {
    id: 98765,
    rcno: 'QA',
    skuDisplayNameKo: '새 위스키',
    skuDisplayNameEn: 'New whisky',
    baseProductNameKo: null,
    baseProductNameEn: null,
    abvPercent: 43.5,
    ageYears: null,
    unitVolumeMl: 700,
    selectedRegionId: 1,
    selectedDistilleryId: 2,
  };
  sessionStorage.removeItem('mfds-registration:98765');
  server.use(
    http.post('/admin/api/v1/alcohols', async ({ request }) => {
      creates++;
      expect(await request.json()).toMatchObject({
        abv: '43.5%',
        volume: '700ml',
        imageUrl: 'https://cdn.example/qa.webp',
        regionId: 1,
        distilleryId: 2,
      });
      return HttpResponse.json(wrapApiResponse({ targetId: 90001 }));
    }),
    http.post('/admin/api/v1/mfds/declarations/98765/matching/confirm', async ({ request }) => {
      matches.push(await request.json());
      return matches.length === 1
        ? HttpResponse.json({ success: false, message: '연결 실패' }, { status: 500 })
        : HttpResponse.json(wrapApiResponse({ alcoholId: 90001, regionId: 1, distilleryId: 2 }));
    })
  );
  try {
    const user = userEvent.setup();
    const first = render(<MfdsWhiskyRegistration source={source} onComplete={completed} />);
    await screen.findByDisplayValue('새 위스키');
    const categorySelect = screen.getAllByRole('combobox')[0];
    if (!categorySelect) throw new Error('카테고리 선택 필드가 없습니다.');
    fireEvent.keyDown(categorySelect, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: '싱글몰트' }));
    await user.click(screen.getByRole('button', { name: '테스트 이미지 선택' }));
    await user.click(screen.getByRole('button', { name: '등록하고 연결' }));
    const retry = await screen.findByRole('button', { name: '연결 재시도' });
    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => expect(retry).toBeEnabled());
    expect(sessionStorage.getItem('mfds-registration:98765')).toBe('90001');
    expect(completed).not.toHaveBeenCalled();
    first.unmount();
    render(<MfdsWhiskyRegistration source={source} onComplete={completed} />);
    const restored = await screen.findByRole('button', { name: '연결 재시도' });
    await waitFor(() => expect(restored).toBeEnabled());
    await user.click(restored);
    await waitFor(() => expect(completed).toHaveBeenCalledOnce());
    expect(creates).toBe(1);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(matches).toEqual([{ alcoholId: 90001 }, { alcoholId: 90001 }]);
    expect(sessionStorage.getItem('mfds-registration:98765')).toBeNull();
  } finally {
    upload.mockRestore();
    sessionStorage.removeItem('mfds-registration:98765');
  }
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { CurationV2CreateRequest, CurationV2Detail } from '@/types/api';

import { SchemaDrivenCurationEditPage } from '../SchemaDrivenCurationEditPage';
import { CurationCreatePage } from '../../CurationCreate';
import { programSpec } from './program-spec.fixture';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const CURATION_BASE = '/admin/api/v2/curations';
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ specCode: 'PROGRAM' }),
  };
});

function mockProgramSpec() {
  server.use(
    http.get(SPEC_BASE, () =>
      HttpResponse.json(
        wrapApiResponse([
          {
            id: programSpec.id,
            code: programSpec.code,
            name: programSpec.name,
            description: programSpec.description,
            version: programSpec.version,
            isActive: programSpec.isActive,
          },
        ])
      )
    ),
    http.get(`${SPEC_BASE}/:specId`, () => HttpResponse.json(wrapApiResponse(programSpec)))
  );
}

describe('schema driven curation pages', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('PROGRAM requestSpec으로 행사 필드와 프로그램 object array를 렌더링한다', async () => {
    const user = userEvent.setup();
    mockProgramSpec();

    render(<CurationCreatePage />);

    expect(await screen.findByLabelText('행사 시작일')).toBeInTheDocument();
    expect(screen.getByLabelText('행사 종료일')).toBeInTheDocument();
    expect(screen.getByLabelText('프로그램 태그')).toBeInTheDocument();
    expect(screen.getByText('프로그램을 추가해주세요.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '프로그램 추가' }));

    expect(screen.getByRole('heading', { name: '프로그램 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('1번 프로그램 프로그램명')).toBeInTheDocument();
    expect(screen.getByLabelText('1번 프로그램 프로그램 유형')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '1번 프로그램 시음 위스키 추가' })
    ).toBeInTheDocument();
  });

  it('입력한 프로그램 배열 순서와 object payload로 생성 요청을 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockProgramSpec();
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(wrapApiResponse({ targetId: 100 }));
      })
    );

    render(<CurationCreatePage />);

    await screen.findByLabelText('큐레이션명');
    fillCommonFields();
    fireEvent.change(screen.getByLabelText('행사 시작일'), {
      target: { value: '2026-07-24' },
    });
    fireEvent.change(screen.getByLabelText('행사 종료일'), {
      target: { value: '2026-07-26' },
    });
    fireEvent.change(screen.getByLabelText('장소명'), { target: { value: '코엑스' } });
    fireEvent.change(screen.getByLabelText('장소 및 주소'), {
      target: { value: '서울 강남구 영동대로 513' },
    });

    await user.click(screen.getByRole('button', { name: '프로그램 추가' }));
    fillProgram(1, '마스터클래스');

    await user.click(screen.getByRole('button', { name: '프로그램 추가' }));
    fillProgram(2, '테이스팅');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 4,
      payload: {
        eventStartDate: '2026-07-24',
        eventEndDate: '2026-07-26',
        placeName: '코엑스',
        address: '서울 강남구 영동대로 513',
        programs: [
          expect.objectContaining({ name: '마스터클래스' }),
          expect.objectContaining({ name: '테이스팅' }),
        ],
      },
    });
  });

  it('각 프로그램의 중첩 위스키 목록을 독립적인 field path로 관리한다', async () => {
    const user = userEvent.setup();
    mockProgramSpec();

    render(<CurationCreatePage />);

    await screen.findByLabelText('행사 시작일');
    await user.click(screen.getByRole('button', { name: '프로그램 추가' }));
    await user.click(screen.getByRole('button', { name: '프로그램 추가' }));

    const firstProgram = screen.getByRole('group', { name: '프로그램 1' });
    const secondProgram = screen.getByRole('group', { name: '프로그램 2' });

    await user.click(
      within(firstProgram).getByRole('button', {
        name: '1번 프로그램 시음 위스키 추가',
      })
    );

    expect(within(firstProgram).getByRole('button', { name: '직접 입력' })).toBeInTheDocument();
    expect(
      within(secondProgram).queryByRole('button', { name: '직접 입력' })
    ).not.toBeInTheDocument();
  });

  it('PROGRAM 상세 payload를 수정 폼에 복원한다', async () => {
    const curation: CurationV2Detail = {
      id: 10,
      name: '2026 바쇼',
      description: '행사 소개',
      coverImageUrl: null,
      imageUrls: [],
      exposureStartDate: '2026-07-01',
      exposureEndDate: '2026-07-31',
      displayOrder: 0,
      isActive: true,
      createdAt: '2026-07-01T00:00:00',
      modifiedAt: '2026-07-01T00:00:00',
      spec: programSpec,
      payload: {
        eventStartDate: '2026-07-24',
        eventEndDate: '2026-07-26',
        placeName: '코엑스',
        address: '서울 강남구 영동대로 513',
        programs: [
          {
            name: '마스터클래스',
            type: 'MASTER_CLASS',
            programDate: '2026-07-24',
            startTime: '14:00',
            description: '행사 설명',
            whiskies: [],
          },
        ],
      },
    };

    render(<SchemaDrivenCurationEditPage curation={curation} />);

    expect(screen.getByLabelText('큐레이션명')).toHaveValue('2026 바쇼');
    expect(screen.getByLabelText('행사 시작일')).toHaveValue('2026-07-24');
    expect(screen.getByLabelText('1번 프로그램 프로그램명')).toHaveValue('마스터클래스');
  });
});

function fillCommonFields() {
  fireEvent.change(screen.getByLabelText('큐레이션명'), {
    target: { value: '2026 바쇼' },
  });
  fireEvent.change(screen.getByLabelText('설명'), {
    target: { value: '여러 프로그램을 소개합니다.' },
  });
  fireEvent.change(screen.getByLabelText('광고노출 시작일'), {
    target: { value: '2026-07-01' },
  });
  fireEvent.change(screen.getByLabelText('광고노출 종료일'), {
    target: { value: '2026-07-31' },
  });
}

function fillProgram(index: number, name: string) {
  fireEvent.change(screen.getByLabelText(`${index}번 프로그램 프로그램명`), {
    target: { value: name },
  });
  fireEvent.click(screen.getByLabelText(`${index}번 프로그램 프로그램 유형`));
  fireEvent.click(screen.getByRole('option', { name: 'Master Class' }));
  fireEvent.change(screen.getByLabelText(`${index}번 프로그램 날짜`), {
    target: { value: '2026-07-24' },
  });
  fireEvent.change(screen.getByLabelText(`${index}번 프로그램 시작 시간`), {
    target: { value: '14:00' },
  });
  fireEvent.change(screen.getByLabelText(`${index}번 프로그램 프로그램 설명`), {
    target: { value: '프로그램 설명' },
  });
}

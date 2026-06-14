import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiError, wrapApiResponse } from '@/test/mocks/data';
import { useAuthStore } from '@/stores/auth';
import type { CurationV2CreateRequest, CurationV2Spec } from '@/types/api';

import { CurationTastingEventCreatePage } from '../CurationTastingEventCreate';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const CURATION_BASE = '/admin/api/v2/curations';
const S3_BASE = '/admin/api/v1/s3/presign-url';

const tastingEventSpec: CurationV2Spec = {
  id: 3,
  code: 'WHISKY_TASTING_EVENT',
  name: '위스키 시음회',
  description: '시음회 날짜, 장소, 참가 정보와 시음 위스키 라인업',
  hydratorKey: 'alcohol',
  version: 2,
  isActive: true,
  requestSpec: {
    type: 'object',
    required: [
      'eventDate',
      'eventTime',
      'barAddress',
      'detailAddress',
      'entryFee',
      'capacity',
      'applicationLink',
      'guideText',
      'alcohols',
    ],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        description: '시음회 날짜',
        'x-display-name': '시음회 날짜',
      },
      eventTime: {
        type: 'string',
        description: '시음회 시간',
        'x-display-name': '시음회 시간',
      },
      barAddress: {
        type: 'string',
        maxLength: 200,
        description: '장소 및 바 주소',
        'x-display-name': '장소 및 바(bar) 주소',
      },
      detailAddress: {
        type: 'string',
        maxLength: 200,
        description: '상세 주소',
        'x-display-name': '상세 주소',
      },
      isRecruiting: {
        type: 'boolean',
        description: '시음회 참여자 모집 여부',
        'x-display-name': '참여자 모집 여부',
      },
      entryFee: {
        type: 'integer',
        minimum: 0,
        description: '참가비',
        'x-display-name': '참가비(1인당)',
      },
      capacity: {
        type: 'integer',
        minimum: 1,
        maximum: 999,
        description: '총 모집 인원수',
        'x-display-name': '총 모집 인원수',
      },
      applicationLink: {
        type: 'string',
        maxLength: 2048,
        description: '신청 링크',
        'x-display-name': '신청링크',
      },
      guideText: {
        type: 'string',
        maxLength: 1000,
        description: '시음회 안내사항',
        'x-field-style': 'long-text',
        'x-display-name': '안내사항',
      },
      alcohols: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        description: '시음 위스키 라인업',
        'x-field-style': 'alcohol-card-list',
        'x-display-name': '시음 위스키',
        items: {
          type: 'object',
          required: ['source', 'alcohol'],
          properties: {
            source: {
              type: 'string',
              enum: ['BOTTLE_NOTE', 'MANUAL'],
            },
            alcohol: {
              type: 'object',
              required: ['korName', 'selectedTags'],
              properties: {
                korName: { type: 'string', 'x-display-name': '위스키 한글명' },
                selectedTags: {
                  type: 'array',
                  maxItems: 12,
                  'x-field-style': 'tag-list',
                  'x-display-name': '테이스팅 태그',
                  items: { type: 'string' },
                },
              },
            },
            comment: {
              type: 'string',
              maxLength: 500,
              'x-field-style': 'long-text',
              'x-display-name': '위스키 기대평',
            },
          },
        },
      },
    },
    'x-form-style': 'tasting-form',
  },
  responseSpec: {
    type: 'object',
  },
};

function createTastingEventSpec(overrides: { alcoholsMaxItems?: number } = {}): CurationV2Spec {
  return {
    ...tastingEventSpec,
    requestSpec: {
      ...tastingEventSpec.requestSpec,
      properties: {
        ...tastingEventSpec.requestSpec.properties,
        alcohols: {
          ...tastingEventSpec.requestSpec.properties!.alcohols!,
          maxItems:
            overrides.alcoholsMaxItems ??
            tastingEventSpec.requestSpec.properties!.alcohols!.maxItems,
        },
      },
    },
  };
}

function mockSpecSuccess(spec: CurationV2Spec = tastingEventSpec) {
  server.use(
    http.get(SPEC_BASE, () => HttpResponse.json(wrapApiResponse([spec]))),
    http.get(`${SPEC_BASE}/:specId`, () => HttpResponse.json(wrapApiResponse(spec)))
  );
}

function mockImageUpload(
  viewUrls = [
    'https://cdn.example.com/curation/1.jpg',
    'https://cdn.example.com/curation/2.jpg',
    'https://cdn.example.com/curation/3.jpg',
  ]
) {
  let issuedUploadCount = 0;

  server.use(
    http.get(S3_BASE, ({ request }) => {
      const url = new URL(request.url);
      const uploadSize = Number(url.searchParams.get('uploadSize') ?? '1');
      const startIndex = issuedUploadCount;
      issuedUploadCount += uploadSize;

      return HttpResponse.json(
        wrapApiResponse({
          bucketName: 'test-bucket',
          expiryTime: 15,
          uploadSize,
          imageUploadInfo: Array.from({ length: uploadSize }, (_, index) => {
            const uploadIndex = startIndex + index;
            return {
              order: index,
              viewUrl:
                viewUrls[uploadIndex] ?? `https://cdn.example.com/curation/${uploadIndex + 1}.jpg`,
              uploadUrl: `https://s3.amazonaws.com/test-bucket/curation/${uploadIndex + 1}.jpg?presigned=true`,
            };
          }),
        })
      );
    }),
    http.put('https://s3.amazonaws.com/*', () => new HttpResponse(null, { status: 200 }))
  );
}

function setCurrentUserRoles(roles: Array<'ROOT_ADMIN' | 'BAR_OWNER' | 'COMMUNITY_MANAGER'>) {
  const state = useAuthStore.getState();
  state.user =
    roles.length > 0
      ? {
          adminId: 1,
          email: 'admin@example.com',
          roles,
        }
      : null;
  state.accessToken = roles.length > 0 ? 'access-token' : null;
  state.refreshToken = roles.length > 0 ? 'refresh-token' : null;
  state.isAuthenticated = roles.length > 0;
}

describe('CurationTastingEventCreatePage', () => {
  beforeEach(() => {
    setCurrentUserRoles([]);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('스펙 목록과 상세 조회 후 시음회 작성 폼을 렌더링한다', async () => {
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    expect(await screen.findByRole('heading', { name: '시음회 작성' })).toBeInTheDocument();
    expect(await screen.findByText('기본정보')).toBeInTheDocument();
    expect(screen.getByText('모든 큐레이션에 공통으로 들어갑니다.')).toBeInTheDocument();
    expect(screen.getByText('큐레이션 내용')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모집기간 안내' })).toBeInTheDocument();
    expect(screen.getByText('날짜 및 장소')).toBeInTheDocument();
    expect(screen.getByText('날짜 및 장소를 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('참가 정보')).toBeInTheDocument();
    expect(screen.getAllByText('시음 위스키').length).toBeGreaterThan(0);
    expect(screen.getByText('장소 및 바(bar) 주소')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '큐레이션 이미지 업로드' })).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, WEBP 지원/)).toBeInTheDocument();
    expect(screen.getByText('미리보기')).toBeInTheDocument();
    expect(screen.queryByText('요약')).not.toBeInTheDocument();
    expect(screen.queryByText('관리자 전용 설정')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('노출 순서')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('활성화 상태')).not.toBeInTheDocument();
    expect(screen.queryByText('BOTTLE_NOTE')).not.toBeInTheDocument();
  });

  it('상세 스펙의 alcohols maxItems로 위스키 추가 안내와 제한을 적용한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess(createTastingEventSpec({ alcoholsMaxItems: 1 }));

    render(<CurationTastingEventCreatePage />);

    expect(await screen.findByText(/1-1개까지 등록할 수 있습니다/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));
    const whiskySearchInput = screen.getByPlaceholderText('위스키 검색 ...');
    await user.type(whiskySearchInput, '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));

    expect(screen.getByRole('button', { name: '시음 위스키 추가' })).toBeDisabled();
  });

  it('직접 입력 카드 삭제 후 다시 추가하면 검색 카드로 시작한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await user.click(await screen.findByRole('button', { name: '시음 위스키 추가' }));
    await user.click(screen.getByRole('button', { name: '직접 입력' }));

    expect(screen.getByLabelText('1번 수동 위스키 한글명')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));

    expect(screen.getByPlaceholderText('위스키 검색 ...')).toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 한글명')).not.toBeInTheDocument();
  });

  it('시음 위스키 카드에 우측 핸들을 표시하고 드래그 앤 드롭으로 순서를 변경한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await user.click(await screen.findByRole('button', { name: '시음 위스키 추가' }));
    let whiskySearchInput = await screen.findByPlaceholderText('위스키 검색 ...');

    await user.type(whiskySearchInput, '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));
    expect(await screen.findByText('위스키 1')).toBeInTheDocument();
    expect(await screen.findByLabelText('글렌피딕 12년 순서 변경')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));
    whiskySearchInput = await screen.findByPlaceholderText('위스키 검색 ...');
    await user.type(whiskySearchInput, '맥');
    await user.click(await screen.findByText('맥캘란 18년'));
    expect(await screen.findByText('위스키 2')).toBeInTheDocument();
    expect(await screen.findByLabelText('맥캘란 18년 순서 변경')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(2);

    expect(
      screen
        .getAllByRole('button', { name: /순서 변경/ })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['글렌피딕 12년 순서 변경', '맥캘란 18년 순서 변경']);

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => '1'),
    };
    const targetHandle = screen.getByLabelText('맥캘란 18년 순서 변경');

    expect(targetHandle.closest('[draggable="true"]')).toBeInTheDocument();
    expect(targetHandle).not.toHaveAttribute('draggable');

    await act(async () => {
      fireEvent.dragStart(targetHandle, { dataTransfer });
      fireEvent.dragOver(screen.getByLabelText('글렌피딕 12년 순서 변경'), { dataTransfer });
      fireEvent.drop(screen.getByLabelText('글렌피딕 12년 순서 변경'), { dataTransfer });
    });

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', '1');

    await waitFor(() => {
      expect(
        screen
          .getAllByRole('button', { name: /순서 변경/ })
          .map((button) => button.getAttribute('aria-label'))
      ).toEqual(['맥캘란 18년 순서 변경', '글렌피딕 12년 순서 변경']);
    });
  });

  it('시음 위스키 카드 내부 입력 영역에서는 드래그 정렬을 시작하지 않는다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await user.click(await screen.findByRole('button', { name: '시음 위스키 추가' }));
    const whiskySearchInput = await screen.findByPlaceholderText('위스키 검색 ...');

    await user.type(whiskySearchInput, '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));

    const tagInput = await screen.findByLabelText('글렌피딕 12년 테이스팅 태그');
    const commentTextarea = screen.getByLabelText('글렌피딕 12년 기대평');
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => ''),
    };

    const tagInputDragStart = createEvent.dragStart(tagInput, { dataTransfer });
    fireEvent(tagInput, tagInputDragStart);

    const commentDragStart = createEvent.dragStart(commentTextarea, { dataTransfer });
    fireEvent(commentTextarea, commentDragStart);

    expect(tagInputDragStart.defaultPrevented).toBe(true);
    expect(commentDragStart.defaultPrevented).toBe(true);
    expect(dataTransfer.setData).not.toHaveBeenCalled();
  });

  it('ROOT_ADMIN에게만 관리자 전용 설정을 표시한다', async () => {
    setCurrentUserRoles(['ROOT_ADMIN']);
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    expect(await screen.findByText('관리자 전용 설정')).toBeInTheDocument();
    expect(screen.getByLabelText('노출 순서')).toBeInTheDocument();
    expect(screen.getByLabelText('활성화 상태')).toBeInTheDocument();
  });

  it('참여자 모집 목적을 광고 전용으로 선택할 수 있다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    expect(await screen.findByText('시음회 참여자를 모집할 목적이신가요?')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '네' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('신청링크')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('신청링크'), {
      target: { value: 'https://forms.example.com/tasting' },
    });

    await user.click(screen.getByRole('radio', { name: '아니요, 광고만 하겠습니다.' }));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: '네' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: '아니요, 광고만 하겠습니다.' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
    expect(screen.queryByLabelText('신청링크')).not.toBeInTheDocument();
    expect(screen.queryByText('https://forms.example.com/tasting')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '네' }));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: '네' })).toHaveAttribute('aria-checked', 'true');
    });
    expect(screen.getByLabelText('신청링크')).toHaveValue('');
  });

  it('참여자 모집 상태에서는 신청링크를 필수로 검사한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    expect(await screen.findByLabelText('신청링크')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '네' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: /저장/ }));

    expect(await screen.findByText('신청링크는 필수입니다.')).toBeInTheDocument();
  });

  it('노출 시작일이나 종료일이 과거 날짜이면 저장 전 validation을 표시한다', async () => {
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('노출 시작일');

    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-30' } });

    expect(await screen.findByText('노출 시작일은 오늘 이후 날짜로 입력해주세요.')).toBeInTheDocument();
  });

  it('노출 종료일이 시작일보다 빠르면 저장 전 validation을 표시한다', async () => {
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('노출 시작일');

    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-01' } });

    expect(
      await screen.findByText('노출 종료일은 노출 시작일보다 빠를 수 없습니다.')
    ).toBeInTheDocument();
  });

  it('이미지 단일 업로드 영역에서 3장까지 등록하고 드래그 앤 드롭으로 순서를 변경한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();
    mockImageUpload();

    render(<CurationTastingEventCreatePage />);

    const imageFileInput = await screen.findByLabelText('큐레이션 이미지 파일 선택');

    const files = [
      new File(['1'], 'one.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'two.jpg', { type: 'image/jpeg' }),
      new File(['3'], 'three.webp', { type: 'image/webp' }),
      new File(['4'], 'four.png', { type: 'image/png' }),
    ];

    await user.upload(imageFileInput, files);

    await waitFor(() => {
      const images = screen.getAllByRole('img', { name: /큐레이션 이미지/ });
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://cdn.example.com/curation/1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://cdn.example.com/curation/2.jpg');
      expect(images[2]).toHaveAttribute('src', 'https://cdn.example.com/curation/3.jpg');
    });

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => '1'),
    };

    await act(async () => {
      fireEvent.dragStart(screen.getByLabelText('큐레이션 이미지 2 순서 변경'), { dataTransfer });
      fireEvent.dragOver(screen.getByLabelText('큐레이션 이미지 1 순서 변경'), { dataTransfer });
      fireEvent.drop(screen.getByLabelText('큐레이션 이미지 1 순서 변경'), { dataTransfer });
    });

    await waitFor(() => {
      const reorderedImages = screen.getAllByRole('img', { name: /큐레이션 이미지/ });
      expect(reorderedImages[0]).toHaveAttribute('src', 'https://cdn.example.com/curation/2.jpg');
      expect(reorderedImages[1]).toHaveAttribute('src', 'https://cdn.example.com/curation/1.jpg');
      expect(reorderedImages[2]).toHaveAttribute('src', 'https://cdn.example.com/curation/3.jpg');
    });
  });

  it('스펙 상세 조회가 403이면 작성 폼과 저장 버튼을 표시하지 않는다', async () => {
    server.use(
      http.get(SPEC_BASE, () => HttpResponse.json(wrapApiResponse([tastingEventSpec]))),
      http.get(`${SPEC_BASE}/:specId`, () =>
        HttpResponse.json(wrapApiError(403, 'FORBIDDEN', '접근 권한이 없습니다.'), {
          status: 403,
        })
      )
    );

    render(<CurationTastingEventCreatePage />);

    expect(
      await screen.findByText('시음회 스펙 상세를 불러올 권한이 없습니다.')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('큐레이션명')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /저장/ })).not.toBeInTheDocument();
  });

  it('시음 위스키를 추가하지 않고 저장하면 alcohols validation을 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess();

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('큐레이션명');

    fireEvent.change(screen.getByLabelText('큐레이션명'), {
      target: { value: '6월 싱글몰트 시음회' },
    });
    fireEvent.change(screen.getByLabelText('설명'), {
      target: { value: '소규모 위스키 시음회' },
    });
    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-01' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('시음회 날짜'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('시음회 시간'), { target: { value: '19:30' } });
    fireEvent.change(screen.getByLabelText('장소 및 바(bar) 주소'), {
      target: { value: '서울 강남구 테헤란로 123' },
    });
    fireEvent.change(screen.getByLabelText('상세 주소'), { target: { value: '2층 도시남 바' } });
    fireEvent.change(screen.getByLabelText('참가비(1인당)'), { target: { value: '75000' } });
    fireEvent.change(screen.getByLabelText('총 모집 인원수'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('신청링크'), {
      target: { value: 'https://forms.example.com/tasting' },
    });
    fireEvent.change(screen.getByLabelText('안내사항'), {
      target: { value: '시작 10분 전 입장해 주세요.' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    expect(
      await screen.findByText('시음 위스키를 최소 1개 이상 추가해주세요.')
    ).toBeInTheDocument();
  });

  it('입력값을 specId와 시음회 payload로 조립해 생성 API에 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess();
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 10,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('큐레이션명');

    fireEvent.change(screen.getByLabelText('큐레이션명'), {
      target: { value: '6월 싱글몰트 시음회' },
    });
    fireEvent.change(screen.getByLabelText('설명'), {
      target: { value: '소규모 위스키 시음회' },
    });
    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-01' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('시음회 날짜'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('시음회 시간'), { target: { value: '19:30' } });
    fireEvent.change(screen.getByLabelText('장소 및 바(bar) 주소'), {
      target: { value: '서울 강남구 테헤란로 123' },
    });
    fireEvent.change(screen.getByLabelText('상세 주소'), { target: { value: '2층 도시남 바' } });
    fireEvent.change(screen.getByLabelText('참가비(1인당)'), { target: { value: '75000' } });
    fireEvent.change(screen.getByLabelText('총 모집 인원수'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('신청링크'), {
      target: { value: 'https://forms.example.com/tasting' },
    });
    fireEvent.change(screen.getByLabelText('안내사항'), {
      target: { value: '시작 10분 전 입장해 주세요.' },
    });

    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));
    await user.type(screen.getByPlaceholderText('위스키 검색 ...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));
    expect(await screen.findByText('도수 40% · 싱글몰트')).toBeInTheDocument();
    expect(screen.getByText('평균별점 4.2 (유저평가 150)')).toBeInTheDocument();
    expect(screen.queryByText('리뷰 수')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('테이스팅 태그검색 후 추가')).toBeInTheDocument();
    expect(screen.getByText('2/12')).toBeInTheDocument();
    expect(screen.getAllByText('바닐라').length).toBeGreaterThan(0);
    expect(screen.getAllByText('꿀').length).toBeGreaterThan(0);
    const tagInput = screen.getByLabelText('글렌피딕 12년 테이스팅 태그');
    await user.type(tagInput, '바');
    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '바닐라 태그 선택' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '태그 검색어 지우기' }));
    await user.type(tagInput, '과');
    await user.click(await screen.findByRole('button', { name: '과일 태그 선택' }));
    expect(screen.getAllByText('과일').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: '바닐라 태그 삭제' }));
    await user.type(tagInput, '셰리');
    await user.click(await screen.findByRole('button', { name: '"셰리" 직접 추가' }));
    expect(screen.getByText('3/12')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('글렌피딕 12년 기대평'), {
      target: { value: '첫 잔으로 가볍게 시작하는 위스키' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 3,
      name: '6월 싱글몰트 시음회',
      imageUrls: [],
      payload: {
        eventDate: '2026-06-15',
        eventTime: '19:30',
        barAddress: '서울 강남구 테헤란로 123',
        detailAddress: '2층 도시남 바',
        isRecruiting: true,
        entryFee: 75000,
        capacity: 20,
        applicationLink: 'https://forms.example.com/tasting',
        guideText: '시작 10분 전 입장해 주세요.',
        alcohols: [
          {
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
              selectedTags: ['꿀', '과일', '셰리'],
            },
            comment: '첫 잔으로 가볍게 시작하는 위스키',
          },
        ],
      },
    });
    expect(screen.queryByText('BOTTLE_NOTE')).not.toBeInTheDocument();
  });

  it('광고 전용 시음회는 신청링크 없이 저장하고 payload에는 빈 문자열을 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess();
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 12,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('큐레이션명');

    fireEvent.change(screen.getByLabelText('큐레이션명'), {
      target: { value: '6월 싱글몰트 시음회' },
    });
    fireEvent.change(screen.getByLabelText('설명'), {
      target: { value: '소규모 위스키 시음회' },
    });
    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-01' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('시음회 날짜'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('시음회 시간'), { target: { value: '19:30' } });
    fireEvent.change(screen.getByLabelText('장소 및 바(bar) 주소'), {
      target: { value: '서울 강남구 테헤란로 123' },
    });
    fireEvent.change(screen.getByLabelText('상세 주소'), { target: { value: '2층 도시남 바' } });
    fireEvent.change(screen.getByLabelText('참가비(1인당)'), { target: { value: '75000' } });
    fireEvent.change(screen.getByLabelText('총 모집 인원수'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('신청링크'), {
      target: { value: 'https://forms.example.com/tasting' },
    });
    fireEvent.change(screen.getByLabelText('안내사항'), {
      target: { value: '시작 10분 전 입장해 주세요.' },
    });
    await user.click(screen.getByRole('radio', { name: '아니요, 광고만 하겠습니다.' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('신청링크')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));
    await user.click(screen.getByRole('button', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 한글명'), {
      target: { value: '오픈 몰트 12년' },
    });
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 영문명'), {
      target: { value: 'Open Malt 12' },
    });
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 이미지 URL'), {
      target: { value: 'images.example.com/open-malt-12.png' },
    });
    await user.type(screen.getByLabelText('오픈 몰트 12년 테이스팅 태그'), '버번{enter}');
    fireEvent.change(screen.getByLabelText('오픈 몰트 12년 기대평'), {
      target: { value: '직접 섭외한 한정 위스키' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 3,
      payload: {
        isRecruiting: false,
        applicationLink: '',
      },
    });
  });

  it('직접 입력 위스키를 MANUAL source와 alcoholId null payload로 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess();
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 11,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<CurationTastingEventCreatePage />);

    await screen.findByLabelText('큐레이션명');

    fireEvent.change(screen.getByLabelText('큐레이션명'), {
      target: { value: '6월 싱글몰트 시음회' },
    });
    fireEvent.change(screen.getByLabelText('설명'), {
      target: { value: '소규모 위스키 시음회' },
    });
    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-01' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('시음회 날짜'), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText('시음회 시간'), { target: { value: '19:30' } });
    fireEvent.change(screen.getByLabelText('장소 및 바(bar) 주소'), {
      target: { value: '서울 강남구 테헤란로 123' },
    });
    fireEvent.change(screen.getByLabelText('상세 주소'), { target: { value: '2층 도시남 바' } });
    fireEvent.change(screen.getByLabelText('참가비(1인당)'), { target: { value: '75000' } });
    fireEvent.change(screen.getByLabelText('총 모집 인원수'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('신청링크'), {
      target: { value: 'https://forms.example.com/tasting' },
    });
    fireEvent.change(screen.getByLabelText('안내사항'), {
      target: { value: '시작 10분 전 입장해 주세요.' },
    });

    await user.click(screen.getByRole('button', { name: '시음 위스키 추가' }));
    await user.click(screen.getByRole('button', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 한글명'), {
      target: { value: '오픈 몰트 12년' },
    });
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 영문명'), {
      target: { value: 'Open Malt 12' },
    });
    fireEvent.change(screen.getByLabelText('1번 수동 위스키 이미지 URL'), {
      target: { value: 'images.example.com/open-malt-12.png' },
    });
    expect(screen.getAllByRole('img', { name: '오픈 몰트 12년' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: 'https://images.example.com/open-malt-12.png',
        }),
      ])
    );
    expect(screen.queryByLabelText('1번 수동 위스키 도수')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 용량')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 캐스크')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 지역')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 카테고리')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('오픈 몰트 12년 테이스팅 태그'), '버번{enter}');
    fireEvent.change(screen.getByLabelText('오픈 몰트 12년 기대평'), {
      target: { value: '직접 섭외한 한정 위스키' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 3,
      payload: {
        alcohols: [
          {
            source: 'MANUAL',
            alcohol: {
              alcoholId: null,
              korName: '오픈 몰트 12년',
              engName: 'Open Malt 12',
              imageUrl: 'images.example.com/open-malt-12.png',
              selectedTags: ['버번'],
            },
            comment: '직접 섭외한 한정 위스키',
          },
        ],
      },
    });
    expect(screen.queryByText('MANUAL')).not.toBeInTheDocument();
  });
});

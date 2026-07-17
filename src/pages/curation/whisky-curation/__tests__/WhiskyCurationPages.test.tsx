import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useAuthStore } from '@/stores/auth';
import { wrapApiResponse } from '@/test/mocks/data';
import { server } from '@/test/mocks/server';
import { render } from '@/test/test-utils';
import type {
  CurationV2CreateRequest,
  CurationV2Detail,
  CurationV2Spec,
  CurationV2UpdateRequest,
} from '@/types/api';

import { WhiskyCurationCreatePage } from '../WhiskyCurationCreatePage';
import { WhiskyCurationEditPage } from '../WhiskyCurationEditPage';

function renderRecommendedCreatePage() {
  return render(
    <WhiskyCurationCreatePage specCode="RECOMMENDED_WHISKY" fallbackTitle="추천 위스키 작성" />
  );
}

function renderPairingCreatePage() {
  return render(
    <WhiskyCurationCreatePage specCode="WHISKY_PAIRING" fallbackTitle="위스키 페어링 작성" />
  );
}

const SPEC_BASE = '/admin/api/v2/curation-specs';
const CURATION_BASE = '/admin/api/v2/curations';
const S3_BASE = '/admin/api/v1/s3/presign-url';

const recommendedWhiskySpec: CurationV2Spec = {
  id: 1,
  code: 'RECOMMENDED_WHISKY',
  name: '추천 위스키',
  description: '추천 위스키 큐레이션',
  hydratorKey: 'alcohol',
  version: 1,
  isActive: true,
  requestSpec: {
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
        'x-display-name': '추천 위스키',
        properties: {
          alcoholId: { type: 'integer' },
          korName: { type: 'string', 'x-display-name': '위스키 한글명' },
          engName: { type: 'string' },
          imageUrl: { type: 'string' },
          abv: { type: 'string' },
          cask: { type: 'string' },
          volume: { type: 'string' },
          regionName: { type: 'string' },
          korCategory: { type: 'string' },
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
        'x-display-name': '추천 코멘트',
      },
    },
    'x-container': 'array',
    'x-form-style': 'alcohol-list',
    'x-field-style': 'alcohol-card',
  },
  responseSpec: {
    type: 'object',
  },
};

const whiskyPairingSpec: CurationV2Spec = {
  ...recommendedWhiskySpec,
  id: 2,
  code: 'WHISKY_PAIRING',
  name: '위스키 페어링',
  description: '위스키 페어링 큐레이션',
  requestSpec: {
    ...recommendedWhiskySpec.requestSpec,
    required: ['source', 'alcohol', 'pairings'],
    properties: {
      ...recommendedWhiskySpec.requestSpec.properties,
      alcohol: {
        ...recommendedWhiskySpec.requestSpec.properties!.alcohol!,
        'x-display-name': '페어링 위스키',
      },
      comment: {
        ...recommendedWhiskySpec.requestSpec.properties!.comment!,
        'x-display-name': '페어링 코멘트',
      },
      pairings: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        'x-field-style': 'pairing-food-list',
        'x-display-name': '위스키와 페어링할 음식',
        items: {
          type: 'object',
          required: ['itemName', 'pairingNote'],
          properties: {
            itemName: {
              type: 'string',
              maxLength: 100,
              'x-display-name': '음식명',
            },
            pairingNote: {
              type: 'string',
              maxLength: 500,
              'x-display-name': '페어링 설명',
            },
            itemImageUrl: {
              type: 'string',
              maxLength: 2048,
              'x-field-style': 'image-upload',
              'x-upload-path': 'admin/curation',
              'x-display-name': '음식 이미지',
            },
          },
        },
      },
    },
  },
};

function mockSpecSuccess(spec: CurationV2Spec) {
  server.use(
    http.get(SPEC_BASE, () => HttpResponse.json(wrapApiResponse([spec]))),
    http.get(`${SPEC_BASE}/:specId`, () => HttpResponse.json(wrapApiResponse(spec)))
  );
}

function mockPairingImageUpload(viewUrls = ['https://cdn.example.com/pairing/icecream.jpg']) {
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
                viewUrls[uploadIndex] ?? `https://cdn.example.com/pairing/${uploadIndex + 1}.jpg`,
              uploadUrl: `https://s3.amazonaws.com/test-bucket/pairing/${uploadIndex + 1}.jpg?presigned=true`,
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

function fillBasicInfo() {
  fireEvent.change(screen.getByLabelText('큐레이션명'), {
    target: { value: '이번 주 추천 위스키' },
  });
  fireEvent.change(screen.getByLabelText('설명'), {
    target: { value: '앱 홈에 노출할 추천 위스키' },
  });
  fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2026-06-01' } });
  fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2026-06-30' } });
}

async function typeTastingTagSearch(
  user: ReturnType<typeof userEvent.setup>,
  comboboxName: string,
  value: string
) {
  await user.click(screen.getByRole('combobox', { name: comboboxName }));
  const searchInput = await screen.findByLabelText(`${comboboxName} 검색어`);
  await user.type(searchInput, value);
  return searchInput;
}

describe('whisky curation pages', () => {
  beforeEach(() => {
    setCurrentUserRoles([]);
  });

  it('하단 추가 CTA를 누르면 직접 입력 폼을 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess(recommendedWhiskySpec);

    renderRecommendedCreatePage();

    await screen.findByLabelText('큐레이션명');
    expect(screen.getByLabelText('노출 시작일')).toBeInTheDocument();
    expect(screen.getByLabelText('노출 종료일')).toBeInTheDocument();
    expect(screen.queryByLabelText('광고노출 시작일')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('광고노출 종료일')).not.toBeInTheDocument();
    expect(screen.getByLabelText('앱 미리보기 프레임')).toBeInTheDocument();
    expect(screen.getByText('큐레이션 위스키')).toBeInTheDocument();

    const guideMessage = screen.getByText('추천 위스키를 추가해주세요.');
    const addCta = screen.getByRole('button', { name: '추천 위스키 추가' });

    expect(guideMessage).toBeInTheDocument();
    expect(screen.queryByLabelText('1번 수동 위스키 한글명')).not.toBeInTheDocument();
    expect(guideMessage.compareDocumentPosition(addCta)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await user.click(addCta);
    await user.click(screen.getByRole('button', { name: '직접 입력' }));

    expect(screen.getByLabelText('1번 수동 위스키 한글명')).toBeInTheDocument();
  });

  it('필수 입력 누락 시 화면상 첫 필드로 포커스한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess(recommendedWhiskySpec);

    renderRecommendedCreatePage();

    const nameInput = await screen.findByLabelText('큐레이션명');
    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => {
      expect(nameInput).toHaveFocus();
    });
  });

  it('추천 위스키는 노출 종료일이 시작일보다 빠르면 저장 전 validation을 표시한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess(recommendedWhiskySpec);
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(wrapApiResponse({ targetId: 99 }));
      })
    );

    renderRecommendedCreatePage();

    await screen.findByLabelText('큐레이션명');
    fireEvent.change(screen.getByLabelText('큐레이션명'), {
      target: { value: '이번 주 추천 위스키' },
    });
    fireEvent.change(screen.getByLabelText('설명'), {
      target: { value: '앱 홈에 노출할 추천 위스키' },
    });
    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2099-06-30' } });
    fireEvent.change(screen.getByLabelText('노출 종료일'), { target: { value: '2099-06-01' } });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    expect(
      await screen.findByText('노출 종료일은 노출 시작일보다 빠를 수 없습니다.')
    ).toBeInTheDocument();
    expect(capturedBody).toBeNull();
  });

  it('추천 위스키는 DB 태그를 기본값으로 넣고 수정한 태그와 코멘트를 생성 payload로 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess(recommendedWhiskySpec);
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 21,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    renderRecommendedCreatePage();

    expect(await screen.findByRole('heading', { name: '추천 위스키 작성' })).toBeInTheDocument();
    await screen.findByLabelText('큐레이션명');
    fillBasicInfo();

    await user.click(screen.getByRole('button', { name: '추천 위스키 추가' }));
    await user.type(screen.getByPlaceholderText('위스키 검색 ...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));

    expect(screen.getByText('이번 주 추천 위스키')).toBeInTheDocument();
    expect(screen.getAllByText('글렌피딕 12년').length).toBeGreaterThan(0);
    expect(screen.getAllByText('바닐라').length).toBeGreaterThan(0);
    expect(screen.getAllByText('꿀').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '바닐라 태그 삭제' }));
    await typeTastingTagSearch(user, '글렌피딕 12년 테이스팅 태그', '셰리{enter}');
    fireEvent.change(screen.getByLabelText('글렌피딕 12년 추천 코멘트'), {
      target: { value: '밸런스가 좋아 첫 추천으로 적합합니다.' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    const submittedBody = capturedBody as unknown as CurationV2CreateRequest;
    expect(submittedBody).toMatchObject({
      specId: 1,
      name: '이번 주 추천 위스키',
      description: '앱 홈에 노출할 추천 위스키',
      imageUrls: [],
      exposureStartDate: '2026-06-01',
      exposureEndDate: '2026-06-30',
      displayOrder: 0,
      isActive: true,
      payload: [
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
            selectedTags: ['꿀', '셰리'],
          },
          comment: '밸런스가 좋아 첫 추천으로 적합합니다.',
        },
      ],
    });
    expect(
      Array.isArray(submittedBody.payload) ? submittedBody.payload[0] : submittedBody.payload
    ).not.toHaveProperty('stats');
  });

  it('추천 위스키는 여러 위스키 카드를 payload 배열로 전송한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess(recommendedWhiskySpec);
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 23,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    renderRecommendedCreatePage();

    await screen.findByLabelText('큐레이션명');
    fillBasicInfo();

    await user.click(screen.getByRole('button', { name: '추천 위스키 추가' }));
    await user.type(screen.getByPlaceholderText('위스키 검색 ...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));
    await user.click(screen.getByRole('button', { name: '추천 위스키 추가' }));
    await user.click(screen.getByRole('button', { name: '직접 입력' }));
    fireEvent.change(screen.getByLabelText('2번 수동 위스키 한글명'), {
      target: { value: '수동 추가 위스키' },
    });
    await typeTastingTagSearch(user, '수동 추가 위스키 테이스팅 태그', '피트{enter}');
    fireEvent.change(screen.getByLabelText('수동 추가 위스키 추천 코멘트'), {
      target: { value: '두 번째 추천 코멘트' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    const submittedBody = capturedBody as unknown as CurationV2CreateRequest;
    expect(submittedBody.payload).toMatchObject([
      {
        source: 'BOTTLE_NOTE',
        alcohol: {
          alcoholId: 10,
          korName: '글렌피딕 12년',
        },
      },
      {
        source: 'MANUAL',
        alcohol: {
          alcoholId: null,
          korName: '수동 추가 위스키',
          selectedTags: ['피트'],
        },
        comment: '두 번째 추천 코멘트',
      },
    ]);
  });

  it('위스키 페어링은 페어링 음식 목록을 생성 payload에 포함한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess(whiskyPairingSpec);
    mockPairingImageUpload([
      'https://cdn.example.com/pairing/icecream.jpg',
      'https://cdn.example.com/pairing/chocolate.jpg',
    ]);
    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 22,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    renderPairingCreatePage();

    expect(await screen.findByRole('heading', { name: '위스키 페어링 작성' })).toBeInTheDocument();
    await screen.findByLabelText('큐레이션명');
    expect(screen.getByLabelText('앱 미리보기 프레임')).toBeInTheDocument();
    fillBasicInfo();

    await user.click(screen.getByRole('button', { name: '페어링 위스키 추가' }));
    await user.type(screen.getByPlaceholderText('위스키 검색 ...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));
    expect(screen.queryByLabelText('글렌피딕 12년 페어링 코멘트')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('1번 위스키 1번 페어링 음식명'), {
      target: { value: '바닐라 아이스크림' },
    });
    await user.upload(
      screen.getByLabelText('1번 위스키 1번 페어링 음식 이미지 파일 선택'),
      new File(['icecream'], 'icecream.jpg', { type: 'image/jpeg' })
    );
    await waitFor(() =>
      expect(screen.getByAltText('1번 위스키 1번 페어링 음식 이미지')).toHaveAttribute(
        'src',
        'https://cdn.example.com/pairing/icecream.jpg'
      )
    );
    fireEvent.change(screen.getByLabelText('1번 위스키 1번 페어링 설명'), {
      target: { value: '꿀과 바닐라 향을 더 부드럽게 이어줍니다.' },
    });

    await user.click(screen.getByRole('button', { name: '페어링 음식 추가' }));
    fireEvent.change(screen.getByLabelText('1번 위스키 2번 페어링 음식명'), {
      target: { value: '다크초콜릿' },
    });
    await user.upload(
      screen.getByLabelText('1번 위스키 2번 페어링 음식 이미지 파일 선택'),
      new File(['chocolate'], 'chocolate.webp', { type: 'image/webp' })
    );
    await waitFor(() =>
      expect(screen.getByAltText('1번 위스키 2번 페어링 음식 이미지')).toHaveAttribute(
        'src',
        'https://cdn.example.com/pairing/chocolate.jpg'
      )
    );
    fireEvent.change(screen.getByLabelText('1번 위스키 2번 페어링 설명'), {
      target: { value: '쌉싸름한 맛이 단맛을 잡아줍니다.' },
    });

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: () => undefined,
      getData: () => '1',
    };

    fireEvent.dragStart(screen.getByLabelText('위스키와 페어링할 음식 2 순서 변경'), {
      dataTransfer,
    });
    fireEvent.dragOver(screen.getByLabelText('1번 위스키 1번 페어링 음식 순서 변경'), {
      dataTransfer,
    });
    fireEvent.drop(screen.getByLabelText('1번 위스키 1번 페어링 음식 순서 변경'), {
      dataTransfer,
    });

    expect(screen.getAllByText('바닐라 아이스크림').length).toBeGreaterThan(0);
    expect(screen.getAllByText('꿀과 바닐라 향을 더 부드럽게 이어줍니다.').length).toBeGreaterThan(
      0
    );

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 2,
      payload: [
        {
          source: 'BOTTLE_NOTE',
          alcohol: {
            alcoholId: 10,
            selectedTags: ['바닐라', '꿀'],
          },
          pairings: [
            {
              itemName: '다크초콜릿',
              itemImageUrl: 'https://cdn.example.com/pairing/chocolate.jpg',
              pairingNote: '쌉싸름한 맛이 단맛을 잡아줍니다.',
            },
            {
              itemName: '바닐라 아이스크림',
              itemImageUrl: 'https://cdn.example.com/pairing/icecream.jpg',
              pairingNote: '꿀과 바닐라 향을 더 부드럽게 이어줍니다.',
            },
          ],
        },
      ],
    });
  });

  it('추천 위스키 상세 수정 화면은 기존 payload를 폼에 채우고 수정 API로 저장한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2UpdateRequest | null = null;
    const curation: CurationV2Detail = {
      id: 31,
      name: '기존 추천 위스키',
      description: null,
      coverImageUrl: null,
      imageUrls: [],
      exposureStartDate: null,
      exposureEndDate: null,
      displayOrder: 3,
      isActive: true,
      createdAt: '2026-05-15T00:00:00',
      modifiedAt: '2026-05-16T00:00:00',
      spec: recommendedWhiskySpec,
      payload: [
        {
          source: 'MANUAL',
          alcohol: {
            alcoholId: null,
            korName: '수동 추천 위스키',
            engName: 'Manual Whisky',
            selectedTags: ['스모키'],
          },
          comment: '기존 코멘트',
        },
      ],
    };
    server.use(
      http.put(`${CURATION_BASE}/:curationId`, async ({ params, request }) => {
        expect(params.curationId).toBe('31');
        capturedBody = (await request.json()) as CurationV2UpdateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_UPDATED',
            message: '큐레이션이 수정되었습니다.',
            targetId: 31,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<WhiskyCurationEditPage curation={curation} />);

    expect(await screen.findByRole('heading', { name: '추천 위스키 수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('큐레이션명')).toHaveValue('기존 추천 위스키');
    expect(screen.getByLabelText('노출 시작일')).not.toBeDisabled();
    expect(
      screen.getAllByText((_, element) => element?.textContent === '노출 시작일*').length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText('노출 종료일')).not.toBeDisabled();
    expect(
      screen.getAllByText((_, element) => element?.textContent === '노출 종료일*').length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('기존 노출 시작일이 없어 이번 수정에서만 입력할 수 있습니다.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('1번 수동 위스키 한글명')).toHaveValue('수동 추천 위스키');
    expect(screen.getAllByText('스모키').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('수동 추천 위스키 추천 코멘트')).toHaveValue('기존 코멘트');

    fireEvent.change(screen.getByLabelText('노출 시작일'), { target: { value: '2026-06-01' } });
    await user.clear(screen.getByLabelText('수동 추천 위스키 추천 코멘트'));
    await user.type(screen.getByLabelText('수동 추천 위스키 추천 코멘트'), '수정된 추천 코멘트');
    await user.click(screen.getByRole('button', { name: /수정/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 1,
      name: '기존 추천 위스키',
      description: null,
      imageUrls: [],
      exposureStartDate: '2026-06-01',
      exposureEndDate: null,
      displayOrder: 3,
      isActive: true,
      payload: [
        {
          source: 'MANUAL',
          alcohol: {
            alcoholId: null,
            korName: '수동 추천 위스키',
            engName: 'Manual Whisky',
            selectedTags: ['스모키'],
          },
          comment: '수정된 추천 코멘트',
        },
      ],
    });
  });

  it('추천 위스키는 스펙에 최대 개수 제한이 없으면 10개 초과 기존 payload도 수정 저장한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2UpdateRequest | null = null;
    const payload = Array.from({ length: 15 }, (_, index) => ({
      source: 'BOTTLE_NOTE',
      alcohol: {
        alcoholId: 200 + index,
        korName: `추천 위스키 ${index + 1}`,
        engName: `Recommended Whisky ${index + 1}`,
        selectedTags: ['셰리'],
      },
      comment: null,
    }));
    const curation: CurationV2Detail = {
      id: 16,
      name: '셰리 추천 큐레이션',
      description: null,
      coverImageUrl: null,
      imageUrls: [],
      exposureStartDate: null,
      exposureEndDate: null,
      displayOrder: 0,
      isActive: true,
      createdAt: '2026-05-15T00:00:00',
      modifiedAt: '2026-05-16T00:00:00',
      spec: recommendedWhiskySpec,
      payload,
    };
    server.use(
      http.put(`${CURATION_BASE}/:curationId`, async ({ params, request }) => {
        expect(params.curationId).toBe('16');
        capturedBody = (await request.json()) as CurationV2UpdateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_UPDATED',
            message: '큐레이션이 수정되었습니다.',
            targetId: 16,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<WhiskyCurationEditPage curation={curation} />);

    expect(await screen.findByRole('heading', { name: '추천 위스키 수정' })).toBeInTheDocument();
    expect(screen.getByText('1개 이상 등록할 수 있습니다.')).toBeInTheDocument();
    expect(screen.getAllByText('추천 위스키 15').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /수정/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    const submittedBody = capturedBody as unknown as CurationV2UpdateRequest;
    expect(Array.isArray(submittedBody.payload) ? submittedBody.payload : []).toHaveLength(15);
  });
});

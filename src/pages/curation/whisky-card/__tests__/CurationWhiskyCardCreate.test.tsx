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

import {
  CurationRecommendedWhiskyCreatePage,
  CurationWhiskyCardEditPage,
  CurationWhiskyPairingCreatePage,
} from '../CurationWhiskyCardCreate';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const CURATION_BASE = '/admin/api/v2/curations';

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
    required: ['source', 'alcohol', 'comment'],
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
    required: ['source', 'alcohol', 'comment', 'pairings'],
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
  fireEvent.change(screen.getByLabelText('광고노출 시작일'), { target: { value: '2026-06-01' } });
  fireEvent.change(screen.getByLabelText('광고노출 종료일'), { target: { value: '2026-06-30' } });
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

describe('CurationWhiskyCardCreatePage', () => {
  beforeEach(() => {
    setCurrentUserRoles([]);
  });

  it('하단 추가 CTA를 누르면 직접 입력 폼을 표시한다', async () => {
    const user = userEvent.setup();
    mockSpecSuccess(recommendedWhiskySpec);

    render(<CurationRecommendedWhiskyCreatePage />);

    await screen.findByLabelText('큐레이션명');

    const guideMessage = screen.getByText('위스키를 검색하거나 직접 입력을 눌러 추가해주세요.');
    const addCta = screen.getByRole('button', { name: '추천 위스키 추가' });

    expect(guideMessage).toBeInTheDocument();
    expect(screen.queryByLabelText('수동 위스키 한글명')).not.toBeInTheDocument();
    expect(guideMessage.compareDocumentPosition(addCta)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await user.click(addCta);

    expect(screen.getByLabelText('수동 위스키 한글명')).toBeInTheDocument();
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

    render(<CurationRecommendedWhiskyCreatePage />);

    expect(await screen.findByRole('heading', { name: '추천 위스키 작성' })).toBeInTheDocument();
    await screen.findByLabelText('큐레이션명');
    fillBasicInfo();

    await user.type(screen.getByPlaceholderText('위스키 검색하여 선택...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));

    expect(await screen.findByText('평균 별점')).toBeInTheDocument();
    expect(screen.getAllByText('4.2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('바닐라').length).toBeGreaterThan(0);
    expect(screen.getAllByText('꿀').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '바닐라 태그 삭제' }));
    await typeTastingTagSearch(user, '글렌피딕 12년 테이스팅 태그', '셰리{enter}');
    fireEvent.change(screen.getByLabelText('추천 코멘트'), {
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
      payload: {
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
    });
    expect(submittedBody.payload).not.toHaveProperty('stats');
  });

  it('위스키 페어링은 페어링 음식 목록을 생성 payload에 포함한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2CreateRequest | null = null;
    mockSpecSuccess(whiskyPairingSpec);
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

    render(<CurationWhiskyPairingCreatePage />);

    expect(await screen.findByRole('heading', { name: '위스키 페어링 작성' })).toBeInTheDocument();
    await screen.findByLabelText('큐레이션명');
    fillBasicInfo();

    await user.type(screen.getByPlaceholderText('위스키 검색하여 선택...'), '글렌');
    await user.click(await screen.findByText('글렌피딕 12년'));
    fireEvent.change(screen.getByLabelText('페어링 코멘트'), {
      target: { value: '부드러운 단맛을 살리는 페어링입니다.' },
    });
    fireEvent.change(screen.getByLabelText('1번 페어링 음식명'), {
      target: { value: '바닐라 아이스크림' },
    });
    fireEvent.change(screen.getByLabelText('1번 페어링 음식 이미지 URL'), {
      target: { value: 'https://example.com/icecream.jpg' },
    });
    fireEvent.change(screen.getByLabelText('1번 페어링 설명'), {
      target: { value: '꿀과 바닐라 향을 더 부드럽게 이어줍니다.' },
    });

    await user.click(screen.getByRole('button', { name: /저장/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 2,
      payload: {
        source: 'BOTTLE_NOTE',
        alcohol: {
          alcoholId: 10,
          selectedTags: ['바닐라', '꿀'],
        },
        comment: '부드러운 단맛을 살리는 페어링입니다.',
        pairings: [
          {
            itemName: '바닐라 아이스크림',
            itemImageUrl: 'https://example.com/icecream.jpg',
            pairingNote: '꿀과 바닐라 향을 더 부드럽게 이어줍니다.',
          },
        ],
      },
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
      payload: {
        source: 'MANUAL',
        alcohol: {
          alcoholId: null,
          korName: '수동 추천 위스키',
          engName: 'Manual Whisky',
          selectedTags: ['스모키'],
        },
        comment: '기존 코멘트',
      },
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

    render(<CurationWhiskyCardEditPage curation={curation} />);

    expect(await screen.findByRole('heading', { name: '추천 위스키 수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('큐레이션명')).toHaveValue('기존 추천 위스키');
    expect(screen.getByLabelText('광고노출 시작일')).toBeDisabled();
    expect(screen.getByLabelText('광고노출 종료일')).not.toBeDisabled();
    expect(screen.getByText('광고노출 시작일은 등록 후 변경할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByLabelText('수동 위스키 한글명')).toHaveValue('수동 추천 위스키');
    expect(screen.getAllByText('스모키').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('추천 코멘트')).toHaveValue('기존 코멘트');

    await user.clear(screen.getByLabelText('추천 코멘트'));
    await user.type(screen.getByLabelText('추천 코멘트'), '수정된 추천 코멘트');
    await user.click(screen.getByRole('button', { name: /수정/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 1,
      name: '기존 추천 위스키',
      description: null,
      imageUrls: [],
      exposureStartDate: null,
      exposureEndDate: null,
      displayOrder: 3,
      isActive: true,
      payload: {
        source: 'MANUAL',
        alcohol: {
          alcoholId: null,
          korName: '수동 추천 위스키',
          engName: 'Manual Whisky',
          selectedTags: ['스모키'],
        },
        comment: '수정된 추천 코멘트',
      },
    });
  });
});

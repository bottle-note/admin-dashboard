import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  cacheCurationSpecDetail,
  writeCurationSpecBrowserCache,
} from '@/lib/curation-spec-browser-cache';
import { useAuthStore } from '@/stores/auth';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { CurationV2Spec, CurationV2SpecListItem } from '@/types/api';

import { CurationCreatePage } from '../CurationCreate';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const ADMIN_ID = 7;
const routeState = vi.hoisted(() => ({ specCode: 'PROGRAM' }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ specCode: routeState.specCode }),
  };
});

vi.mock('../whisky-tasting-event/WhiskyTastingEventForm', () => ({
  WhiskyTastingEventForm: () => <div>시음회 전략 렌더러</div>,
}));

vi.mock('../whisky-tasting-event/whisky-tasting-event.form-model', () => ({
  createWhiskyTastingEventFormModel: () => ({ kind: 'tasting-event' }),
}));

vi.mock('../whisky-curation/WhiskyCurationForm', () => ({
  WhiskyCurationForm: () => <div>위스키 큐레이션 전략 렌더러</div>,
}));

vi.mock('../whisky-curation/whisky-curation.schema', () => ({
  createWhiskyCurationFormModel: () => ({ kind: 'whisky-curation' }),
}));

vi.mock('../schema-driven/SchemaDrivenCurationForm', () => ({
  SchemaDrivenCurationForm: () => <div>schema-driven 전략 렌더러</div>,
}));

vi.mock('../schema-driven/schema-driven-curation.form-model', () => ({
  createSchemaDrivenCurationFormModel: () => ({ kind: 'schema-driven' }),
}));

describe('CurationCreatePage', () => {
  beforeEach(() => {
    routeState.specCode = 'PROGRAM';
    window.localStorage.clear();
    act(() => {
      useAuthStore.setState({
        user: { adminId: ADMIN_ID, email: 'admin@example.com', roles: ['ROOT_ADMIN'] },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        isAuthenticated: true,
      });
    });
  });

  it.each([
    ['WHISKY_TASTING_EVENT', '시음회 전략 렌더러'],
    ['RECOMMENDED_WHISKY', '위스키 큐레이션 전략 렌더러'],
    ['WHISKY_PAIRING', '위스키 큐레이션 전략 렌더러'],
    ['PROGRAM', 'schema-driven 전략 렌더러'],
  ])('같은 페이지가 %s 스펙에 맞는 렌더러를 선택한다', async (specCode, expectedText) => {
    routeState.specCode = specCode;
    mockSpec(specCode);

    render(<CurationCreatePage />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it('URL의 spec code에 해당하는 활성 스펙이 없으면 missing 상태를 표시한다', async () => {
    routeState.specCode = 'INACTIVE';
    mockSpec('INACTIVE', false);

    render(<CurationCreatePage />);

    expect(await screen.findByText('큐레이션 스펙을 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('브라우저에 저장된 현재 version의 목록과 상세 스펙을 재사용한다', async () => {
    let listRequestCount = 0;
    let detailRequestCount = 0;
    const spec = createSpec('PROGRAM');
    const specListItem = toSpecListItem(spec);
    const cache = cacheCurationSpecDetail(
      {
        schemaVersion: 1,
        checkedAt: Date.now(),
        specs: [specListItem],
        details: {},
      },
      spec,
      Date.now()
    );
    writeCurationSpecBrowserCache(ADMIN_ID, cache);
    server.use(
      http.get(SPEC_BASE, () => {
        listRequestCount++;
        return HttpResponse.json(wrapApiResponse([specListItem]));
      }),
      http.get(`${SPEC_BASE}/:specId`, () => {
        detailRequestCount++;
        return HttpResponse.json(wrapApiResponse(spec));
      })
    );

    render(<CurationCreatePage />);

    expect(await screen.findByText('schema-driven 전략 렌더러')).toBeInTheDocument();
    expect(listRequestCount).toBe(0);
    expect(detailRequestCount).toBe(0);
  });
});

function mockSpec(code: string, isActive = true) {
  const spec = createSpec(code, isActive);

  server.use(
    http.get(SPEC_BASE, () => HttpResponse.json(wrapApiResponse([toSpecListItem(spec)]))),
    http.get(`${SPEC_BASE}/:specId`, () => HttpResponse.json(wrapApiResponse(spec)))
  );
}

function createSpec(code: string, isActive = true): CurationV2Spec {
  return {
    id: 10,
    code,
    name: code,
    description: null,
    hydratorKey: null,
    version: 1,
    isActive,
    requestSpec: { type: 'object', properties: {} },
    responseSpec: { type: 'object' },
  };
}

function toSpecListItem(spec: CurationV2Spec): CurationV2SpecListItem {
  return {
    id: spec.id,
    code: spec.code,
    name: spec.name,
    description: spec.description,
    version: spec.version,
    isActive: spec.isActive,
  };
}

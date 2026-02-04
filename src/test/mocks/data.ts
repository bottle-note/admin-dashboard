import type {
  TastingTagListItem,
  TastingTagDetail,
  TastingTagFormResponse,
  TastingTagDeleteResponse,
  TastingTagAlcoholConnectionResponse,
  TastingTagAlcohol,
} from '@/types/api';

export const mockTastingTagListItems: TastingTagListItem[] = [
  {
    id: 1,
    korName: '바닐라',
    engName: 'Vanilla',
    icon: 'data:image/png;base64,iVBORw0KGgo=',
    description: '바닐라 향',
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
  },
  {
    id: 2,
    korName: '과일',
    engName: 'Fruity',
    icon: null,
    description: null,
    createdAt: '2024-02-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
  },
];

export const mockAlcohols: TastingTagAlcohol[] = [
  {
    alcoholId: 10,
    korName: '글렌피딕 12년',
    engName: 'Glenfiddich 12',
    korCategoryName: '싱글몰트',
    engCategoryName: 'Single Malt',
    imageUrl: 'https://example.com/glenfiddich.jpg',
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
  },
  {
    alcoholId: 20,
    korName: '맥캘란 18년',
    engName: 'Macallan 18',
    korCategoryName: '싱글몰트',
    engCategoryName: 'Single Malt',
    imageUrl: null,
    createdAt: '2024-03-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
  },
];

export const mockTastingTagDetail: TastingTagDetail = {
  tag: {
    id: 1,
    korName: '바닐라',
    engName: 'Vanilla',
    icon: 'data:image/png;base64,iVBORw0KGgo=',
    description: '바닐라 향',
    parent: null,
    children: [
      {
        id: 3,
        korName: '바닐라 크림',
        engName: 'Vanilla Cream',
        icon: null,
        description: null,
        parent: null,
        children: [],
      },
    ],
  },
  alcohols: mockAlcohols,
};

export const mockFormResponse: TastingTagFormResponse = {
  code: 'TASTING_TAG_CREATED',
  message: '테이스팅 태그가 생성되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockDeleteResponse: TastingTagDeleteResponse = {
  code: 'TASTING_TAG_DELETED',
  message: '테이스팅 태그가 삭제되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockAlcoholConnectionResponse: TastingTagAlcoholConnectionResponse = {
  code: 'TASTING_TAG_ALCOHOL_ADDED',
  message: '위스키가 연결되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockAlcoholDisconnectionResponse: TastingTagAlcoholConnectionResponse = {
  code: 'TASTING_TAG_ALCOHOL_REMOVED',
  message: '위스키 연결이 해제되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export function wrapApiResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    code: 200,
    data,
    errors: [],
    meta: {
      serverVersion: '1.0.0',
      serverEncoding: 'UTF-8',
      serverResponseTime: '10ms',
      serverPathVersion: 'v1',
      ...meta,
    },
  };
}

export function wrapApiError(code: number, errorCode: string, message: string) {
  return {
    success: false,
    code,
    data: null,
    errors: [{ code: errorCode, message }],
    meta: {
      serverVersion: '1.0.0',
      serverEncoding: 'UTF-8',
      serverResponseTime: '10ms',
      serverPathVersion: 'v1',
    },
  };
}

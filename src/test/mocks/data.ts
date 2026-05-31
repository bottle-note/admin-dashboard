import type {
  TastingTagListItem,
  TastingTagDetail,
  TastingTagFormResponse,
  TastingTagDeleteResponse,
  TastingTagAlcoholConnectionResponse,
  TastingTagAlcohol,
  AlcoholListItem,
  AlcoholDeleteResponse,
  CategoryReferenceMap,
  BannerListItem,
  BannerDetail,
  BannerCreateResponse,
  BannerUpdateResponse,
  BannerDeleteResponse,
  BannerUpdateStatusResponse,
  BannerBulkReorderResponse,
  UserListItem,
  DistilleryListItem,
  DistilleryDetail,
  DistilleryFormResponse,
  DistilleryDeleteResponse,
  CurationListItem,
  CurationDetail,
  CurationBulkReorderResponse,
  RegionListItem,
  RegionDetail,
  RegionFormResponse,
  RegionDeleteResponse,
  RegionBulkReorderResponse,
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

// ============================================
// Alcohol Mock Data
// ============================================

export const mockAlcoholListItems: AlcoholListItem[] = [
  {
    alcoholId: 10,
    korName: '글렌피딕 12년',
    engName: 'Glenfiddich 12',
    korCategoryName: '싱글몰트',
    engCategoryName: 'Single Malt',
    imageUrl: 'https://example.com/glenfiddich.jpg',
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
    deletedAt: null,
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
    deletedAt: null,
  },
  {
    alcoholId: 30,
    korName: '삭제된 위스키',
    engName: 'Deleted Whisky',
    korCategoryName: '블렌디드',
    engCategoryName: 'Blend',
    imageUrl: null,
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-05-01T00:00:00',
    deletedAt: '2024-07-01T00:00:00',
  },
];

export const mockAlcoholDeleteResponse: AlcoholDeleteResponse = {
  code: 'ALCOHOL_DELETED',
  message: '위스키가 삭제되었습니다.',
  targetId: 10,
  responseAt: '2024-06-01T00:00:00',
};

// ============================================
// Category Reference Mock Data
// ============================================

/** 실제 API 응답 형태: Record<AlcoholCategory, CategoryReference[]> */
export const mockCategoryReferences: CategoryReferenceMap = {
  SINGLE_MALT: [
    { korCategory: '싱글 몰트', engCategory: 'Single Malt' },
    { korCategory: '싱글몰트 알코올', engCategory: 'Single Malts' },
  ],
  BLEND: [{ korCategory: '블렌디드', engCategory: 'Blend' }],
  BLENDED_MALT: [{ korCategory: '블렌디드 몰트', engCategory: 'Blended Malt' }],
  BOURBON: [{ korCategory: '버번', engCategory: 'Bourbon' }],
  RYE: [{ korCategory: '라이', engCategory: 'Rye' }],
  OTHER: [
    { korCategory: '스피릿', engCategory: 'Spirit' },
    { korCategory: '싱글 그레인', engCategory: 'Single Grain' },
    { korCategory: '싱글 팟 스틸', engCategory: 'Single Pot Still' },
    { korCategory: '위트', engCategory: 'Wheat' },
    { korCategory: '콘', engCategory: 'Corn' },
    { korCategory: '테네시', engCategory: 'Tennessee' },
  ],
};

// ============================================
// Banner Mock Data
// ============================================

export const mockBannerListItems: BannerListItem[] = [
  {
    id: 1,
    name: '신년 큐레이션 배너',
    bannerType: 'CURATION',
    imageUrl: 'https://example.com/banner1.jpg',
    sortOrder: 0,
    startDate: '2024-01-01T00:00:00',
    endDate: '2024-01-31T23:59:59',
    isActive: true,
    mediaType: 'IMAGE',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  },
  {
    id: 2,
    name: '설문조사 배너',
    bannerType: 'SURVEY',
    imageUrl: 'https://example.com/banner2.jpg',
    sortOrder: 1,
    startDate: null,
    endDate: null,
    isActive: false,
    mediaType: 'IMAGE',
    createdAt: '2024-02-01T00:00:00',
    updatedAt: '2024-02-01T00:00:00',
  },
];

export const mockBannerDetail: BannerDetail = {
  id: 1,
  name: '신년 큐레이션 배너',
  nameFontColor: '#ffffff',
  descriptionA: '새해 첫 위스키',
  descriptionB: '추천 리스트',
  descriptionFontColor: '#ffffff',
  imageUrl: 'https://example.com/banner1.jpg',
  textPosition: 'RT',
  targetUrl: '/curations/1',
  isExternalUrl: false,
  bannerType: 'CURATION',
  sortOrder: 0,
  startDate: '2024-01-01T00:00:00',
  endDate: '2024-01-31T23:59:59',
  isActive: true,
  mediaType: 'IMAGE',
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
};

export const mockBannerCreateResponse: BannerCreateResponse = {
  code: 'BANNER_CREATED',
  message: '배너가 등록되었습니다.',
  targetId: 99,
  responseAt: '2024-06-01T00:00:00',
};

export const mockBannerUpdateResponse: BannerUpdateResponse = {
  code: 'BANNER_UPDATED',
  message: '배너가 수정되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockBannerDeleteResponse: BannerDeleteResponse = {
  code: 'BANNER_DELETED',
  message: '배너가 삭제되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockBannerUpdateStatusResponse: BannerUpdateStatusResponse = {
  code: 'BANNER_STATUS_UPDATED',
  message: '배너 상태가 변경되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockBannerBulkReorderResponse: BannerBulkReorderResponse = {
  code: 'BANNER_REORDERED',
  message: '배너 순서가 변경되었습니다.',
  targetId: 0,
  responseAt: '2024-06-01T00:00:00',
};

// ============================================
// User Mock Data
// ============================================

export const mockUserListItems: UserListItem[] = [
  {
    userId: 1,
    email: 'whisky@example.com',
    nickName: '위스키러버',
    imageUrl: 'https://example.com/user1.jpg',
    role: 'ROLE_USER',
    status: 'ACTIVE',
    socialType: ['KAKAO'],
    reviewCount: 15,
    ratingCount: 42,
    picksCount: 8,
    createAt: '2024-01-15T10:00:00',
    lastLoginAt: '2024-06-01T18:30:00',
  },
  {
    userId: 2,
    email: 'admin@bottlenote.com',
    nickName: '관리자',
    imageUrl: null,
    role: 'ROLE_ADMIN',
    status: 'ACTIVE',
    socialType: ['GOOGLE', 'APPLE'],
    reviewCount: 0,
    ratingCount: 5,
    picksCount: 2,
    createAt: '2023-12-01T09:00:00',
    lastLoginAt: '2024-06-10T08:00:00',
  },
  {
    userId: 3,
    email: 'deleted@example.com',
    nickName: '탈퇴유저',
    imageUrl: null,
    role: 'ROLE_USER',
    status: 'DELETED',
    socialType: ['NAVER'],
    reviewCount: 3,
    ratingCount: 10,
    picksCount: 1,
    createAt: '2024-02-01T12:00:00',
    lastLoginAt: null,
  },
];

// ============================================
// Distillery Mock Data
// ============================================

export const mockDistilleryListItems: DistilleryListItem[] = [
  {
    id: 1,
    korName: '맥캘란',
    engName: 'Macallan',
    imageUrl: 'https://example.com/macallan.jpg',
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
    sortOrder: 1,
  },
  {
    id: 2,
    korName: '글렌피딕',
    engName: 'Glenfiddich',
    imageUrl: null,
    createdAt: '2024-02-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
    sortOrder: 9999,
  },
];

export const mockDistilleryDetail: DistilleryDetail = {
  id: 1,
  korName: '맥캘란',
  engName: 'Macallan',
  imageUrl: 'https://example.com/macallan.jpg',
  createdAt: '2024-01-01T00:00:00',
  modifiedAt: '2024-06-01T00:00:00',
  sortOrder: 1,
};

export const mockDistilleryFormResponse: DistilleryFormResponse = {
  code: 'DISTILLERY_CREATED',
  message: '증류소가 생성되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockDistilleryDeleteResponse: DistilleryDeleteResponse = {
  code: 'DISTILLERY_DELETED',
  message: '증류소가 삭제되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

// ============================================
// Curation Mock Data
// ============================================

export const mockCurationListItems: CurationListItem[] = [
  {
    id: 1,
    name: '신년 특집 큐레이션',
    description: '새해를 맞이하는 특별한 위스키 모음',
    coverImageUrl: 'https://example.com/curation1.jpg',
    displayOrder: 0,
    alcoholCount: 5,
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  },
  {
    id: 2,
    name: '입문자 추천 큐레이션',
    description: null,
    coverImageUrl: null,
    displayOrder: 1,
    alcoholCount: 3,
    isActive: false,
    createdAt: '2024-02-01T00:00:00',
    updatedAt: '2024-02-01T00:00:00',
  },
];

export const mockCurationDetail: CurationDetail = {
  id: 1,
  name: '신년 특집 큐레이션',
  description: '새해를 맞이하는 특별한 위스키 모음',
  coverImageUrl: 'https://example.com/curation1.jpg',
  displayOrder: 0,
  isActive: true,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
  alcoholCount: 2,
  alcohols: [
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
  ],
};

export const mockCurationBulkReorderResponse: CurationBulkReorderResponse = {
  code: 'CURATION_REORDERED',
  message: '큐레이션 순서가 변경되었습니다.',
  targetId: 0,
  responseAt: '2024-06-01T00:00:00',
};

// ============================================
// Region Mock Data
// ============================================

export const mockRegionListItems: RegionListItem[] = [
  {
    id: 1,
    korName: '스코틀랜드',
    engName: 'Scotland',
    continent: '유럽',
    description: '스카치 위스키의 대표 생산 지역입니다.',
    createdAt: '2024-01-01T00:00:00',
    modifiedAt: '2024-06-01T00:00:00',
    parentId: null,
    sortOrder: 0,
  },
  {
    id: 2,
    korName: '스페이사이드',
    engName: 'Speyside',
    continent: '유럽',
    description: '스코틀랜드 북동부의 주요 위스키 생산지입니다.',
    createdAt: '2024-01-02T00:00:00',
    modifiedAt: '2024-06-02T00:00:00',
    parentId: 1,
    sortOrder: 1,
  },
  {
    id: 3,
    korName: '미국',
    engName: 'United States',
    continent: '북아메리카',
    description: null,
    createdAt: '2024-01-03T00:00:00',
    modifiedAt: '2024-06-03T00:00:00',
    parentId: null,
    sortOrder: 2,
  },
];

export const mockRegionDetail: RegionDetail = {
  id: 1,
  korName: '스코틀랜드',
  engName: 'Scotland',
  continent: '유럽',
  description: '스카치 위스키의 대표 생산 지역입니다.',
  sortOrder: 0,
  parentId: null,
  parentKorName: null,
  hasChildren: true,
  alcoholCount: 42,
  createAt: '2024-01-01T00:00:00',
  lastModifyAt: '2024-06-01T00:00:00',
};

export const mockRegionFormResponse: RegionFormResponse = {
  code: 'REGION_CREATED',
  message: '지역이 생성되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockRegionDeleteResponse: RegionDeleteResponse = {
  code: 'REGION_DELETED',
  message: '지역이 삭제되었습니다.',
  targetId: 1,
  responseAt: '2024-06-01T00:00:00',
};

export const mockRegionBulkReorderResponse: RegionBulkReorderResponse = {
  code: 'REGION_REORDERED',
  message: '지역 순서가 변경되었습니다.',
  targetId: 0,
  responseAt: '2024-06-01T00:00:00',
};

// ============================================
// Utility Functions
// ============================================

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

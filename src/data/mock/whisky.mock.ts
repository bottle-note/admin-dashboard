/**
 * 위스키 Mock 데이터
 */

import type { WhiskyCategory } from '@/types/api';

export interface Region {
  id: number;
  korName: string;
  engName: string;
}

export interface WhiskyFormData {
  korName: string;
  engName: string;
  category: WhiskyCategory;
  regionId: number;
  abv: number;
  description?: string;
  distillery?: string;
  cask?: string;
  imageUrl?: string;
}

export interface WhiskyDetailMock {
  alcoholId: number;
  alcoholUrlImg: string | null;
  korName: string;
  engName: string;
  korCategory: string;
  engCategory: string;
  category: WhiskyCategory;
  korRegion: string;
  engRegion: string;
  regionId: number;
  cask: string | null;
  abv: string;
  korDistillery: string | null;
  engDistillery: string | null;
  description: string;
  rating: number;
  totalRatingsCount: number;
  alcoholsTastingTags: string[];
}

/** 지역 목록 */
export const MOCK_REGIONS: Region[] = [
  { id: 1, korName: '스페이사이드', engName: 'Speyside' },
  { id: 2, korName: '하이랜드', engName: 'Highland' },
  { id: 3, korName: '아일라', engName: 'Islay' },
  { id: 4, korName: '캠벨타운', engName: 'Campbeltown' },
  { id: 5, korName: '로우랜드', engName: 'Lowland' },
  { id: 6, korName: '켄터키', engName: 'Kentucky' },
  { id: 7, korName: '테네시', engName: 'Tennessee' },
  { id: 8, korName: '아일랜드', engName: 'Ireland' },
  { id: 9, korName: '일본', engName: 'Japan' },
  { id: 10, korName: '스코틀랜드', engName: 'Scotland' },
];

/** 카테고리 옵션 */
export const WHISKY_CATEGORY_OPTIONS: { value: WhiskyCategory; label: string }[] = [
  { value: 'SINGLE_MALT', label: '싱글몰트' },
  { value: 'BLEND', label: '블렌디드' },
  { value: 'BLENDED_MALT', label: '블렌디드 몰트' },
  { value: 'BOURBON', label: '버번' },
  { value: 'RYE', label: '라이' },
  { value: 'OTHER', label: '기타' },
];

/** 카테고리 라벨 맵 */
export const WHISKY_CATEGORY_LABEL: Record<WhiskyCategory, string> = {
  SINGLE_MALT: '싱글몰트',
  BLEND: '블렌디드',
  BLENDED_MALT: '블렌디드 몰트',
  BOURBON: '버번',
  RYE: '라이',
  OTHER: '기타',
};

/** 위스키 상세 Mock 데이터 */
export const MOCK_WHISKY_DETAIL: Record<string, WhiskyDetailMock> = {
  '1': {
    alcoholId: 1,
    alcoholUrlImg: 'https://via.placeholder.com/300x400?text=Glenfiddich+12',
    korName: '글렌피딕 12년',
    engName: 'Glenfiddich 12 Years',
    korCategory: '싱글몰트',
    engCategory: 'Single Malt',
    category: 'SINGLE_MALT',
    korRegion: '스페이사이드',
    engRegion: 'Speyside',
    regionId: 1,
    cask: '아메리칸 오크 & 스패니시 셰리',
    abv: '40',
    korDistillery: '글렌피딕 증류소',
    engDistillery: 'Glenfiddich Distillery',
    description: '세계에서 가장 많이 팔리는 싱글몰트 위스키. 부드럽고 과일향이 풍부하며 바닐라와 오크의 균형이 좋습니다.',
    rating: 4.2,
    totalRatingsCount: 1250,
    alcoholsTastingTags: ['과일향', '바닐라', '오크', '부드러운'],
  },
  '2': {
    alcoholId: 2,
    alcoholUrlImg: 'https://via.placeholder.com/300x400?text=Macallan+12',
    korName: '맥캘란 12년 더블 캐스크',
    engName: 'The Macallan 12 Years Double Cask',
    korCategory: '싱글몰트',
    engCategory: 'Single Malt',
    category: 'SINGLE_MALT',
    korRegion: '스페이사이드',
    engRegion: 'Speyside',
    regionId: 1,
    cask: '아메리칸 오크 & 유러피안 셰리',
    abv: '40',
    korDistillery: '맥캘란 증류소',
    engDistillery: 'The Macallan Distillery',
    description: '아메리칸 오크와 유러피안 셰리 캐스크에서 숙성된 균형 잡힌 싱글몰트.',
    rating: 4.5,
    totalRatingsCount: 2340,
    alcoholsTastingTags: ['셰리', '꿀', '바닐라', '스파이시'],
  },
  '3': {
    alcoholId: 3,
    alcoholUrlImg: 'https://via.placeholder.com/300x400?text=Lagavulin+16',
    korName: '라가불린 16년',
    engName: 'Lagavulin 16 Years',
    korCategory: '싱글몰트',
    engCategory: 'Single Malt',
    category: 'SINGLE_MALT',
    korRegion: '아일라',
    engRegion: 'Islay',
    regionId: 3,
    cask: '아메리칸 오크 & 유러피안 오크',
    abv: '43',
    korDistillery: '라가불린 증류소',
    engDistillery: 'Lagavulin Distillery',
    description: '강렬한 피트와 스모키함이 특징인 아일라 대표 싱글몰트.',
    rating: 4.7,
    totalRatingsCount: 1890,
    alcoholsTastingTags: ['피트', '스모키', '바다향', '요오드'],
  },
  '4': {
    alcoholId: 4,
    alcoholUrlImg: 'https://via.placeholder.com/300x400?text=Buffalo+Trace',
    korName: '버팔로 트레이스',
    engName: 'Buffalo Trace',
    korCategory: '버번',
    engCategory: 'Bourbon',
    category: 'BOURBON',
    korRegion: '켄터키',
    engRegion: 'Kentucky',
    regionId: 6,
    cask: '아메리칸 화이트 오크',
    abv: '45',
    korDistillery: '버팔로 트레이스 증류소',
    engDistillery: 'Buffalo Trace Distillery',
    description: '부드럽고 달콤한 버번의 정석. 캐러멜과 바닐라 향이 특징.',
    rating: 4.3,
    totalRatingsCount: 980,
    alcoholsTastingTags: ['캐러멜', '바닐라', '토피', '오크'],
  },
  '7094': {
    alcoholId: 7094,
    alcoholUrlImg:
      'https://d1e2y5wc27crnp.cloudfront.net/media/smartorder_reservation/product/thumbnail/81098283-fbd4-4e11-9934-2f38c37c2bb6.webp',
    korName: '100 파이퍼스',
    engName: '100 Pipers',
    korCategory: '블렌디드',
    engCategory: 'Blend',
    category: 'BLEND',
    korRegion: '스코틀랜드',
    engRegion: 'Scotland',
    regionId: 10,
    cask: null,
    abv: '40',
    korDistillery: null,
    engDistillery: null,
    description: '부드럽고 가벼운 스코틀랜드 블렌디드 위스키.',
    rating: 3.8,
    totalRatingsCount: 120,
    alcoholsTastingTags: ['부드러운', '바닐라', '꿀'],
  },
};

/** 신규 등록용 기본값 */
export const DEFAULT_WHISKY_FORM: WhiskyFormData = {
  korName: '',
  engName: '',
  category: 'SINGLE_MALT',
  regionId: 1,
  abv: 40,
  description: '',
  distillery: '',
  cask: '',
  imageUrl: '',
};

/**
 * User API 타입 정의
 * 어드민 사용자 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const UserApi = {
  /** 사용자 목록 조회 */
  list: {
    endpoint: '/admin/api/v1/users',
    method: 'GET',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 사용자 상태 */
export type UserStatus = 'ACTIVE' | 'DELETED';

/** 사용자 역할 */
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

/** 소셜 로그인 타입 */
export type UserSocialType = 'KAKAO' | 'NAVER' | 'GOOGLE' | 'APPLE';

/** 사용자 목록 정렬 기준 */
export type UserSortType = 'CREATED_AT' | 'NICK_NAME' | 'EMAIL' | 'RATING_COUNT' | 'REVIEW_COUNT';

/** 정렬 방향 */
export type UserSortOrder = 'ASC' | 'DESC';

// ============================================
// API 타입 정의
// ============================================

export interface UserApiTypes {
  /** 사용자 목록 조회 */
  list: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 (닉네임/이메일 검색) */
      keyword?: string;
      /** 사용자 상태 필터 */
      status?: UserStatus;
      /** 정렬 기준 */
      sortType?: UserSortType;
      /** 정렬 방향 (기본값: DESC) */
      sortOrder?: UserSortOrder;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 사용자 ID */
      userId: number;
      /** 이메일 */
      email: string;
      /** 닉네임 */
      nickName: string;
      /** 프로필 이미지 URL */
      imageUrl: string | null;
      /** 역할 */
      role: UserRole;
      /** 상태 */
      status: UserStatus;
      /** 소셜 로그인 타입 목록 */
      socialType: UserSocialType[];
      /** 리뷰 수 */
      reviewCount: number;
      /** 평점 수 */
      ratingCount: number;
      /** 픽 수 */
      picksCount: number;
      /** 가입일시 */
      createAt: string;
      /** 최근 로그인 일시 */
      lastLoginAt: string | null;
    };
    /** 페이지네이션 메타 정보 */
    meta: {
      /** 현재 페이지 */
      page: number;
      /** 페이지 크기 */
      size: number;
      /** 전체 요소 수 */
      totalElements: number;
      /** 전체 페이지 수 */
      totalPages: number;
      /** 다음 페이지 존재 여부 */
      hasNext: boolean;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 사용자 목록 조회 파라미터 */
export type UserSearchParams = UserApiTypes['list']['params'];

/** 사용자 목록 아이템 */
export type UserListItem = UserApiTypes['list']['response'];

/** 사용자 목록 페이지네이션 메타 */
export type UserPageMeta = UserApiTypes['list']['meta'];

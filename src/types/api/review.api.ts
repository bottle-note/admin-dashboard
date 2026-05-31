/**
 * Review API 타입 정의
 * 어드민 리뷰 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const ReviewApi = {
  /** 리뷰 목록 조회 */
  list: {
    endpoint: '/admin/api/v1/reviews',
    method: 'GET',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 리뷰 활성 상태 */
export type ReviewActiveStatus = 'ACTIVE' | 'DELETED' | 'DISABLED';

/** 리뷰 노출 상태 */
export type ReviewDisplayStatus = 'PUBLIC' | 'PRIVATE';

/** 리뷰 목록 정렬 기준 */
export type ReviewSortType = 'CREATED_AT' | 'REPLY_COUNT' | 'UPDATED_AT';

/** 정렬 방향 */
export type ReviewSortOrder = 'ASC' | 'DESC';

// ============================================
// API 타입 정의
// ============================================

export interface ReviewApiTypes {
  /** 리뷰 목록 조회 */
  list: {
    /** 요청 파라미터 */
    params: {
      /** 술 ID 필터 */
      alcoholId?: number;
      /** 작성자 유저 ID 필터 */
      userId?: number;
      /** 활성 상태 필터 */
      activeStatus?: ReviewActiveStatus;
      /** 노출 상태 필터 */
      displayStatus?: ReviewDisplayStatus;
      /** 검색어 (리뷰 본문/닉네임/이메일/술명) */
      keyword?: string;
      /** 작성일시 시작 범위 (ISO-8601) */
      createdFrom?: string;
      /** 작성일시 종료 범위 (ISO-8601) */
      createdTo?: string;
      /** 정렬 기준 */
      sortType?: ReviewSortType;
      /** 정렬 방향 (기본값: DESC) */
      sortOrder?: ReviewSortOrder;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 리뷰 ID */
      reviewId: number;
      /** 술 ID */
      alcoholId: number;
      /** 술 이름 */
      alcoholName: string;
      /** 작성자 유저 ID */
      userId: number;
      /** 작성자 닉네임 */
      userNickname: string;
      /** 리뷰 본문 */
      content: string;
      /** 리뷰 평점 */
      reviewRating: number;
      /** 활성 상태 */
      activeStatus: ReviewActiveStatus;
      /** 노출 상태 */
      displayStatus: ReviewDisplayStatus;
      /** 댓글 수 */
      replyCount: number;
      /** 작성일시 */
      createAt: string;
      /** 최종 수정일시 */
      lastModifyAt: string | null;
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

/** 리뷰 목록 조회 파라미터 */
export type ReviewSearchParams = ReviewApiTypes['list']['params'];

/** 리뷰 목록 아이템 */
export type ReviewListItem = ReviewApiTypes['list']['response'];

/** 리뷰 목록 페이지네이션 메타 */
export type ReviewPageMeta = ReviewApiTypes['list']['meta'];

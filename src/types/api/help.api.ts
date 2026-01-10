/**
 * Help API 타입 정의
 * 문의 관리 관련 API 스펙
 */

// ============================================
// 공통 타입
// ============================================

/** 문의 상태 */
export type HelpStatus =
  | 'CREATING'
  | 'WAITING'
  | 'SUCCESS'
  | 'REJECT'
  | 'DELETED';

/** 문의 유형 */
export type HelpType = 'WHISKEY' | 'REVIEW' | 'USER' | 'ETC';

/** 답변 상태 (답변 등록 시 사용) */
export type HelpAnswerStatus = 'SUCCESS' | 'REJECT';

// ============================================
// API 엔드포인트 정의
// ============================================

export const HelpApi = {
  /** 문의 목록 조회 */
  list: {
    endpoint: '/admin/api/v1/helps',
    method: 'GET',
  },
  /** 문의 상세 조회 */
  detail: {
    endpoint: (helpId: number) => `/admin/api/v1/helps/${helpId}`,
    method: 'GET',
  },
  /** 문의 답변 등록 */
  answer: {
    endpoint: (helpId: number) => `/admin/api/v1/helps/${helpId}/answer`,
    method: 'POST',
  },
} as const;

// ============================================
// API 타입 정의
// ============================================

export interface HelpApiTypes {
  /** 문의 목록 조회 */
  list: {
    /** 요청 파라미터 */
    params: {
      /** 상태 필터 */
      status?: HelpStatus;
      /** 유형 필터 */
      type?: HelpType;
      /** 커서 (페이지네이션) */
      cursor?: number;
      /** 페이지 크기 (기본값: 20) */
      pageSize?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 문의 ID */
      helpId: number;
      /** 사용자 ID */
      userId: number;
      /** 사용자 닉네임 */
      userNickname: string;
      /** 문의 제목 */
      title: string;
      /** 문의 유형 */
      type: HelpType;
      /** 문의 상태 */
      status: HelpStatus;
      /** 생성일시 */
      createdAt: string;
    };
    /** 커서 기반 페이지네이션 메타 */
    meta: {
      /** 현재 커서 */
      currentCursor: number;
      /** 다음 커서 */
      cursor: number;
      /** 페이지 크기 */
      pageSize: number;
      /** 다음 페이지 존재 여부 */
      hasNext: boolean;
    };
  };

  /** 문의 상세 조회 */
  detail: {
    /** 경로 파라미터 */
    params: {
      helpId: number;
    };
    /** 응답 */
    response: {
      /** 문의 ID */
      helpId: number;
      /** 사용자 ID */
      userId: number;
      /** 사용자 닉네임 */
      userNickname: string;
      /** 문의 제목 */
      title: string;
      /** 문의 내용 */
      content: string;
      /** 문의 유형 */
      type: HelpType;
      /** 첨부 이미지 목록 */
      imageUrlList: {
        /** 이미지 순서 */
        order: number;
        /** 이미지 URL */
        viewUrl: string;
      }[];
      /** 문의 상태 */
      status: HelpStatus;
      /** 답변한 관리자 ID */
      adminId: number | null;
      /** 답변 내용 */
      responseContent: string | null;
      /** 생성일시 */
      createAt: string;
      /** 최종 수정일시 */
      lastModifyAt: string;
    };
  };

  /** 문의 답변 등록 */
  answer: {
    /** 경로 파라미터 */
    params: {
      helpId: number;
    };
    /** 요청 본문 */
    body: {
      /** 답변 내용 */
      responseContent: string;
      /** 처리 상태 (SUCCESS: 처리 완료, REJECT: 반려) */
      status: HelpAnswerStatus;
    };
    /** 응답 */
    response: {
      /** 문의 ID */
      helpId: number;
      /** 처리 상태 */
      status: string;
      /** 결과 메시지 */
      message: string;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 문의 목록 조회 파라미터 */
export type HelpListParams = HelpApiTypes['list']['params'];

/** 문의 목록 아이템 */
export type HelpListItem = HelpApiTypes['list']['response'];

/** 문의 목록 페이지네이션 메타 */
export type HelpListMeta = HelpApiTypes['list']['meta'];

/** 문의 상세 정보 */
export type HelpDetail = HelpApiTypes['detail']['response'];

/** 문의 답변 요청 */
export type HelpAnswerRequest = HelpApiTypes['answer']['body'];

/** 문의 답변 응답 */
export type HelpAnswerResponse = HelpApiTypes['answer']['response'];

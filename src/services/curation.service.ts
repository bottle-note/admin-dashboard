/**
 * 큐레이션 서비스
 * TODO: 실제 API 연동 시 httpClient 사용으로 변경
 */

import { MOCK_CURATIONS, type CurationListItem } from '@/data/mock/curations.mock';

/**
 * 큐레이션 목록 조회
 * @returns 큐레이션 목록
 */
export async function getCurations(): Promise<CurationListItem[]> {
  // Mock: 실제 API 호출 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_CURATIONS;
}

/**
 * 큐레이션 ID로 단일 큐레이션 조회
 * @param id - 큐레이션 ID
 * @returns 큐레이션 정보 또는 undefined
 */
export async function getCurationById(id: number): Promise<CurationListItem | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_CURATIONS.find((c) => c.id === id);
}

/**
 * 큐레이션 URL 생성
 * @param curationId - 큐레이션 ID
 * @returns 앱 내부 URL
 */
export function generateCurationUrl(curationId: number): string {
  return `/alcohols/search?curationId=${curationId}`;
}

export const curationService = {
  getCurations,
  getCurationById,
  generateCurationUrl,
};

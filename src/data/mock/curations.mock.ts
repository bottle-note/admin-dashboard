/**
 * 큐레이션 Mock 데이터
 * TODO: 실제 API 연동 시 제거
 */

export interface CurationListItem {
  id: number;
  name: string;
  description?: string;
}

/**
 * 큐레이션 목록 Mock 데이터
 */
export const MOCK_CURATIONS: CurationListItem[] = [
  { id: 1, name: '봄 추천 위스키', description: '봄에 어울리는 상쾌한 위스키' },
  { id: 2, name: '입문자 추천', description: '위스키 입문자를 위한 선택' },
  { id: 3, name: '선물용 추천', description: '선물하기 좋은 위스키' },
  { id: 4, name: '가성비 위스키', description: '가격 대비 품질 좋은 위스키' },
  { id: 5, name: '프리미엄 컬렉션', description: '특별한 날을 위한 프리미엄' },
  { id: 6, name: '하이볼 추천', description: '하이볼에 어울리는 위스키' },
  { id: 7, name: '피트 위스키', description: '스모키한 피트향 위스키' },
  { id: 8, name: '셰리캐스크 위스키', description: '셰리캐스크 숙성 위스키' },
  { id: 9, name: '여름 추천', description: '시원하게 즐기는 여름 위스키' },
  { id: 10, name: '겨울 추천', description: '따뜻하게 즐기는 겨울 위스키' },
];

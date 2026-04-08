/**
 * 카테고리 그룹 매핑 훅
 * GROUPED_CATEGORY_REFERENCES(단일 소스)에서 카테고리 ↔ 그룹 매핑을 파생.
 * TODO: #221 API 반영 시 내부 데이터 소스를 React Query로 교체
 */

import {
  GROUPED_CATEGORY_REFERENCES,
  type AlcoholCategory,
  type CategoryReference,
} from '@/types/api';

const categoryToGroupMap = new Map<string, AlcoholCategory>(
  Object.entries(GROUPED_CATEGORY_REFERENCES).flatMap(([group, refs]) =>
    refs.map((ref) => [ref.korCategory, group as AlcoholCategory] as const)
  )
);

export function useCategoryGroupMap() {
  // TODO: #221 반영 시 useGroupedCategoryReferences() React Query 데이터로 교체
  const categoryReferencesByGroup = GROUPED_CATEGORY_REFERENCES;

  const getCategoryGroup = (korCategory: string): AlcoholCategory =>
    categoryToGroupMap.get(korCategory) ?? 'OTHER';

  const getGroupDefaultCategory = (
    group: Exclude<AlcoholCategory, 'OTHER'>
  ): CategoryReference => {
    const ref = categoryReferencesByGroup[group][0];
    if (!ref) {
      throw new Error(`No category reference found for group: ${group}`);
    }
    return ref;
  };

  return { getCategoryGroup, getGroupDefaultCategory, categoryReferencesByGroup };
}

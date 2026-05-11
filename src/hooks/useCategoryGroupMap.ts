/**
 * 카테고리 그룹 매핑 훅
 * useCategoryReferences API 응답(Record<AlcoholCategory, CategoryReference[]>)을
 * 단일 소스로 사용한다.
 */

import { useMemo } from 'react';

import { useCategoryReferences } from './useAdminAlcohols';
import {
  EMPTY_CATEGORY_REFERENCE_MAP,
  type AlcoholCategory,
  type CategoryReference,
  type CategoryReferenceMap,
} from '@/types/api';

export interface UseCategoryGroupMapReturn {
  /** 그룹별 카테고리 레퍼런스 (로딩 전에는 빈 맵) */
  categoryReferencesByGroup: CategoryReferenceMap;
  /** 카테고리(한글명)로 소속 그룹을 찾는다. 미매칭 시 'OTHER' */
  getCategoryGroup: (korCategory: string) => AlcoholCategory;
  /** 그룹의 대표 카테고리(첫 번째 항목) 반환. 빈 그룹이면 throw */
  getGroupDefaultCategory: (group: Exclude<AlcoholCategory, 'OTHER'>) => CategoryReference;
  /** 데이터 로딩 여부 */
  isLoading: boolean;
}

export function useCategoryGroupMap(): UseCategoryGroupMapReturn {
  const { data, isLoading } = useCategoryReferences();
  const categoryReferencesByGroup = data ?? EMPTY_CATEGORY_REFERENCE_MAP;

  const categoryToGroupMap = useMemo(() => {
    const map = new Map<string, AlcoholCategory>();
    (Object.entries(categoryReferencesByGroup) as Array<[AlcoholCategory, CategoryReference[]]>)
      .forEach(([group, refs]) => {
        refs.forEach((ref) => {
          // 우선 등록된 그룹을 유지 (OTHER가 중복 포함하더라도 메인 그룹 우선)
          if (!map.has(ref.korCategory) || group !== 'OTHER') {
            map.set(ref.korCategory, group);
          }
        });
      });
    return map;
  }, [categoryReferencesByGroup]);

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

  return {
    categoryReferencesByGroup,
    getCategoryGroup,
    getGroupDefaultCategory,
    isLoading,
  };
}

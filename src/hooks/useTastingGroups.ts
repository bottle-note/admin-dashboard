import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api-error';
/**
 * 태그 그룹(맛 그룹) API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import { tastingGroupService, tastingGroupKeys } from '@/services/tasting-group.service';
import type {
  TastingGroupListResponse,
  TastingGroupCreateRequest,
  TastingGroupUpdateRequest,
  TastingGroupTagsRequest,
  TastingGroupTagRoleRequest,
  TastingGroupResultResponse,
  UngroupedTastingTag,
} from '@/types/api';

type MutationOptions<TVariables> = Omit<
  UseApiMutationOptions<TastingGroupResultResponse, TVariables>,
  'successMessage' | 'invalidateKeys'
>;

/** 그룹 변경은 목록·미소속 태그에 모두 영향을 주므로 namespace 전체를 무효화한다 */
function useGroupMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<TastingGroupResultResponse>,
  successMessage: string,
  options?: MutationOptions<TVariables>
) {
  return useApiMutation<TastingGroupResultResponse, TVariables>(mutationFn, {
    ...options,
    successMessage,
    invalidateKeys: [tastingGroupKeys.all],
  });
}

/** 태그 그룹 전체 목록 조회 */
export function useTastingGroupList() {
  return useApiQuery<TastingGroupListResponse>(
    tastingGroupKeys.list(),
    () => tastingGroupService.list(),
    { staleTime: 1000 * 60 * 5 }
  );
}

/** 미소속 테이스팅 태그 조회 */
export function useUngroupedTastingTags(keyword: string, enabled = true) {
  return useApiQuery<UngroupedTastingTag[]>(
    tastingGroupKeys.ungrouped(keyword),
    () => tastingGroupService.ungroupedTags({ keyword: keyword || undefined }),
    {
      enabled,
      staleTime: 1000 * 60,
      // 검색어가 바뀌는 동안 이전 결과를 유지해 목록이 깜빡이지 않게 한다
      placeholderData: (previous) => previous,
    }
  );
}

export function useTastingGroupCreate(options?: MutationOptions<TastingGroupCreateRequest>) {
  return useGroupMutation(tastingGroupService.create, '태그 그룹이 등록되었습니다.', options);
}

export interface TastingGroupUpdateVariables {
  code: string;
  data: TastingGroupUpdateRequest;
}

export function useTastingGroupUpdate(options?: MutationOptions<TastingGroupUpdateVariables>) {
  return useGroupMutation(
    ({ code, data }: TastingGroupUpdateVariables) => tastingGroupService.update(code, data),
    '태그 그룹이 수정되었습니다.',
    options
  );
}

export function useTastingGroupDelete(options?: MutationOptions<string>) {
  return useGroupMutation(tastingGroupService.delete, '태그 그룹이 삭제되었습니다.', options);
}

export interface TastingGroupAddTagsVariables {
  code: string;
  /** 역할이 섞여 있으면 역할별 요청 배열로 넘긴다. 순서대로 보내고 성공 토스트와 무효화는 한 번만 한다 */
  data: TastingGroupTagsRequest | TastingGroupTagsRequest[];
}

export class PartialTagConnectionError extends Error {
  constructor(
    public readonly savedTagIds: number[],
    cause: unknown
  ) {
    super(
      `${savedTagIds.length}개는 저장됐습니다. 나머지 태그만 다시 시도하세요. ${getErrorMessage(cause)}`
    );
    this.name = 'PartialTagConnectionError';
  }
}

export function useTastingGroupAddTags(options?: MutationOptions<TastingGroupAddTagsVariables>) {
  const queryClient = useQueryClient();
  return useGroupMutation(
    async ({ code, data }: TastingGroupAddTagsVariables) => {
      const requests = Array.isArray(data) ? data : [data];
      const savedTagIds: number[] = [];
      let last: TastingGroupResultResponse | undefined;
      try {
        for (const request of requests) {
          if (request.tastingTagIds.length === 0) continue;
          last = await tastingGroupService.addTags(code, request);
          savedTagIds.push(...request.tastingTagIds);
        }
      } catch (error) {
        if (!savedTagIds.length) throw error;
        // 이전 요청의 저장은 되돌릴 수 없으므로 캐시와 재시도 대상을 일치시킨다.
        await queryClient.invalidateQueries({ queryKey: tastingGroupKeys.all });
        throw new PartialTagConnectionError(savedTagIds, error);
      }
      if (!last) throw new Error('연결할 태그가 없습니다.');
      return last;
    },
    '태그가 연결되었습니다.',
    { ...options, retry: false }
  );
}

export interface TastingGroupTagRoleVariables {
  code: string;
  tagId: number;
  data: TastingGroupTagRoleRequest;
}

export function useTastingGroupChangeTagRole(
  options?: MutationOptions<TastingGroupTagRoleVariables>
) {
  return useGroupMutation(
    ({ code, tagId, data }: TastingGroupTagRoleVariables) =>
      tastingGroupService.changeTagRole(code, tagId, data),
    '태그 역할이 변경되었습니다.',
    options
  );
}

export interface TastingGroupRemoveTagVariables {
  code: string;
  tagId: number;
}

export function useTastingGroupRemoveTag(
  options?: MutationOptions<TastingGroupRemoveTagVariables>
) {
  return useGroupMutation(
    ({ code, tagId }: TastingGroupRemoveTagVariables) => tastingGroupService.removeTag(code, tagId),
    '태그가 제거되었습니다.',
    options
  );
}

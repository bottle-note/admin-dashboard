import type { InfiniteData } from '@tanstack/react-query';

import {
  flattenInfiniteData,
  useInfiniteApiQuery,
  type InfiniteApiResponse,
} from './useInfiniteApiQuery';
import { useApiQuery } from './useApiQuery';
import { mfdsImporterKeys, mfdsImporterService } from '@/services/mfds-importer.service';
import type { MfdsImporterItem, MfdsImporterSearchParams } from '@/types/api';

export function useMfdsImporterLookupInfinite(
  params?: Omit<MfdsImporterSearchParams, 'cursor'>,
  options: { enabled?: boolean } = {}
) {
  return useInfiniteApiQuery(
    mfdsImporterKeys.list(params ? { ...params, lookup: true } : { lookup: true }),
    async (cursor) => {
      const response = await mfdsImporterService.list({ ...params, cursor });
      return {
        items: response.items,
        pageable: {
          currentCursor: cursor ?? 0,
          cursor: response.meta.nextCursor ?? 0,
          pageSize: params?.pageSize ?? 20,
          hasNext: response.meta.hasNext,
        },
      };
    },
    { enabled: options.enabled ?? true }
  );
}

export function flattenMfdsImporterPages(
  data: InfiniteData<InfiniteApiResponse<MfdsImporterItem>> | undefined
) {
  return flattenInfiniteData(data);
}

export function useMfdsImporterDetail(importerId: number | undefined) {
  const validImporterId = importerId !== undefined && importerId > 0 ? importerId : 0;

  return useApiQuery(
    mfdsImporterKeys.detail(validImporterId),
    () => mfdsImporterService.detail(validImporterId),
    { enabled: validImporterId > 0 }
  );
}

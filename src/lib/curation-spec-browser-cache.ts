import type { CurationV2Spec, CurationV2SpecListItem } from '@/types/api';

export const CURATION_SPEC_REVALIDATE_AFTER_MS = 1000 * 60 * 60;
export const CURATION_SPEC_QUERY_GC_MS = 1000 * 60 * 60;
export const CURATION_SPEC_CACHE_RETENTION_MS = 1000 * 60 * 60 * 24 * 30;

const CURATION_SPEC_CACHE_SCHEMA_VERSION = 1;

export interface CachedCurationSpecDetail {
  version: number;
  cachedAt: number;
  data: CurationV2Spec;
}

export interface CurationSpecBrowserCache {
  schemaVersion: typeof CURATION_SPEC_CACHE_SCHEMA_VERSION;
  checkedAt: number;
  specs: CurationV2SpecListItem[];
  details: Record<string, CachedCurationSpecDetail>;
}

export function getCurationSpecBrowserCacheKey(adminId: number) {
  return `bottlenote:curation-spec-cache:v${CURATION_SPEC_CACHE_SCHEMA_VERSION}:${adminId}`;
}

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function removeLocalStorageItem(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Browser storage privacy mode failures must not block curation forms.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurationSpecBrowserCache(value: unknown): value is CurationSpecBrowserCache {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === CURATION_SPEC_CACHE_SCHEMA_VERSION &&
    typeof value.checkedAt === 'number' &&
    Array.isArray(value.specs) &&
    isRecord(value.details)
  );
}

function createEmptyCurationSpecBrowserCache(checkedAt = Date.now()): CurationSpecBrowserCache {
  return {
    schemaVersion: CURATION_SPEC_CACHE_SCHEMA_VERSION,
    checkedAt,
    specs: [],
    details: {},
  };
}

export function readCurationSpecBrowserCache(adminId: number): CurationSpecBrowserCache | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const key = getCurationSpecBrowserCacheKey(adminId);

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const cache: unknown = JSON.parse(raw);
    if (
      !isCurationSpecBrowserCache(cache) ||
      Date.now() - cache.checkedAt > CURATION_SPEC_CACHE_RETENTION_MS
    ) {
      removeLocalStorageItem(storage, key);
      return null;
    }

    return cache;
  } catch {
    removeLocalStorageItem(storage, key);
    return null;
  }
}

export function writeCurationSpecBrowserCache(adminId: number, cache: CurationSpecBrowserCache) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(getCurationSpecBrowserCacheKey(adminId), JSON.stringify(cache));
  } catch {
    // Browser storage quota/privacy mode failures must not block curation forms.
  }
}

export function reconcileCurationSpecManifest(
  cache: CurationSpecBrowserCache | null,
  remoteSpecs: CurationV2SpecListItem[],
  checkedAt: number
): CurationSpecBrowserCache {
  const currentCache = cache ?? createEmptyCurationSpecBrowserCache(checkedAt);
  const remoteSpecById = new Map(remoteSpecs.map((spec) => [spec.id, spec]));

  const details = Object.fromEntries(
    Object.entries(currentCache.details).flatMap(([specId, detail]) => {
      const remoteSpec = remoteSpecById.get(Number(specId));
      if (!remoteSpec || !remoteSpec.isActive || remoteSpec.version !== detail.version) {
        return [];
      }

      return [[specId, { ...detail, cachedAt: checkedAt }]];
    })
  );

  return {
    schemaVersion: CURATION_SPEC_CACHE_SCHEMA_VERSION,
    checkedAt,
    specs: remoteSpecs,
    details,
  };
}

export function getCachedCurationSpecDetail(
  cache: CurationSpecBrowserCache | null,
  specId: number,
  version: number
): CachedCurationSpecDetail | null {
  const detail = cache?.details[String(specId)];
  return detail?.version === version ? detail : null;
}

export function cacheCurationSpecDetail(
  cache: CurationSpecBrowserCache | null,
  spec: CurationV2Spec,
  cachedAt: number
): CurationSpecBrowserCache {
  const currentCache = cache ?? createEmptyCurationSpecBrowserCache(cachedAt);

  return {
    ...currentCache,
    details: {
      ...currentCache.details,
      [spec.id]: {
        version: spec.version,
        cachedAt,
        data: spec,
      },
    },
  };
}

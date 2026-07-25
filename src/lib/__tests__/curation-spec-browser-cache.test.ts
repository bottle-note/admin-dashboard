import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cacheCurationSpecDetail,
  CURATION_SPEC_CACHE_RETENTION_MS,
  getCachedCurationSpecDetail,
  getCurationSpecBrowserCacheKey,
  readCurationSpecBrowserCache,
  reconcileCurationSpecManifest,
  writeCurationSpecBrowserCache,
} from '../curation-spec-browser-cache';
import type { CurationV2Spec, CurationV2SpecListItem } from '@/types/api';

const ADMIN_ID = 7;
const NOW = new Date('2026-07-24T08:00:00.000Z').getTime();

const tastingEventListItem: CurationV2SpecListItem = {
  id: 3,
  code: 'WHISKY_TASTING_EVENT',
  name: '위스키 시음회',
  description: '시음회',
  version: 2,
  isActive: true,
};

const pairingListItem: CurationV2SpecListItem = {
  id: 2,
  code: 'WHISKY_PAIRING',
  name: '위스키 페어링',
  description: '페어링',
  version: 2,
  isActive: true,
};

const tastingEventSpec: CurationV2Spec = {
  ...tastingEventListItem,
  hydratorKey: 'alcohol',
  requestSpec: { type: 'object', properties: { eventDate: { type: 'string' } } },
  responseSpec: { type: 'object' },
};

const pairingSpec: CurationV2Spec = {
  ...pairingListItem,
  hydratorKey: 'alcohol',
  requestSpec: { type: 'object', properties: { foodName: { type: 'string' } } },
  responseSpec: { type: 'object' },
};

describe('curation spec browser cache', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('손상되었거나 보존 기간이 지난 cache는 무시한다', () => {
    localStorage.setItem(getCurationSpecBrowserCacheKey(ADMIN_ID), '{broken json');
    expect(readCurationSpecBrowserCache(ADMIN_ID)).toBeNull();

    writeCurationSpecBrowserCache(ADMIN_ID, {
      schemaVersion: 1,
      checkedAt: NOW - CURATION_SPEC_CACHE_RETENTION_MS - 1,
      specs: [tastingEventListItem],
      details: {},
    });

    expect(readCurationSpecBrowserCache(ADMIN_ID)).toBeNull();
    expect(localStorage.getItem(getCurationSpecBrowserCacheKey(ADMIN_ID))).toBeNull();
  });

  it('manifest version 변경 또는 inactive 상태의 detail만 제거한다', () => {
    const cached = cacheCurationSpecDetail(
      cacheCurationSpecDetail(
        {
          schemaVersion: 1,
          checkedAt: NOW,
          specs: [tastingEventListItem, pairingListItem],
          details: {},
        },
        tastingEventSpec,
        NOW
      ),
      pairingSpec,
      NOW
    );

    const reconciled = reconcileCurationSpecManifest(
      cached,
      [
        tastingEventListItem,
        {
          ...pairingListItem,
          isActive: false,
        },
      ],
      NOW + 1000
    );

    expect(getCachedCurationSpecDetail(reconciled, 3, 2)?.data).toEqual(tastingEventSpec);
    expect(getCachedCurationSpecDetail(reconciled, 2, 2)).toBeNull();
    expect(reconciled.checkedAt).toBe(NOW + 1000);
  });

  it('현재 manifest version과 일치하는 detail만 반환한다', () => {
    const cache = cacheCurationSpecDetail(
      {
        schemaVersion: 1,
        checkedAt: NOW,
        specs: [tastingEventListItem],
        details: {},
      },
      tastingEventSpec,
      NOW
    );

    expect(getCachedCurationSpecDetail(cache, 3, 2)?.data).toEqual(tastingEventSpec);
    expect(getCachedCurationSpecDetail(cache, 3, 3)).toBeNull();
  });
});

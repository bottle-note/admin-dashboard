import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const APPLY_FLAG = '--apply';
const PAGE_SIZE = 100;
const DEVELOPMENT_API_HOST = 'admin-api.development.bottle-note.com';
const LEGACY_CURATION_PATHS = new Set(['/search', '/alcohols/search']);

const isApplyMode = process.argv.includes(APPLY_FLAG);

function parseEnvFile(content) {
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
        return [key, value];
      })
      .filter(([key]) => key)
  );
}

async function loadMigrationEnvironment() {
  const envFile = await readFile(resolve('.env.dev'), 'utf8');
  const fileEnv = parseEnvFile(envFile);
  const env = {
    ...fileEnv,
    ...process.env,
  };
  const requiredKeys = ['VITE_API_BASE_URL', 'VITE_E2E_TEST_ID', 'VITE_E2E_TEST_PW'];
  const missingKeys = requiredKeys.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  return {
    apiBaseUrl: env.VITE_API_BASE_URL.replace(/\/$/, ''),
    email: env.VITE_E2E_TEST_ID,
    password: env.VITE_E2E_TEST_PW,
  };
}

function getCurationIdFromLegacyTargetUrl(targetUrl) {
  if (typeof targetUrl !== 'string' || !targetUrl.startsWith('/')) return null;

  const url = new URL(targetUrl, 'https://bottlenote.local');
  if (!LEGACY_CURATION_PATHS.has(url.pathname)) return null;

  const curationIds = url.searchParams.getAll('curationId');
  if (curationIds.length !== 1 || !/^\d+$/.test(curationIds[0])) return null;

  const curationId = Number(curationIds[0]);
  return Number.isSafeInteger(curationId) && curationId > 0 ? curationId : null;
}

function toV2TargetUrl(curationId) {
  return `/curation/${curationId}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    const message = body?.errors?.[0]?.message ?? body?.message ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body;
}

async function login(apiBaseUrl, email, password) {
  const response = await requestJson(`${apiBaseUrl}/admin/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.data?.accessToken) {
    throw new Error('Login response did not include an access token');
  }

  return response.data.accessToken;
}

async function fetchAllCurationBannerIds(apiBaseUrl, accessToken) {
  const bannerIds = [];
  let page = 0;

  while (true) {
    const url = new URL(`${apiBaseUrl}/admin/api/v1/banners`);
    url.searchParams.set('bannerType', 'CURATION');
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(PAGE_SIZE));

    const response = await requestJson(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const items = Array.isArray(response.data) ? response.data : [];
    bannerIds.push(...items.map((banner) => banner.id).filter(Number.isSafeInteger));

    const totalPages = Number(response.meta?.totalPages ?? 0);
    if (totalPages === 0 || page + 1 >= totalPages) break;
    page += 1;
  }

  return [...new Set(bannerIds)];
}

function buildUpdatePayload(banner, targetUrl) {
  return {
    name: banner.name,
    nameFontColor: banner.nameFontColor,
    descriptionA: banner.descriptionA,
    descriptionB: banner.descriptionB,
    descriptionFontColor: banner.descriptionFontColor,
    imageUrl: banner.imageUrl,
    textPosition: banner.textPosition,
    targetUrl,
    isExternalUrl: false,
    bannerType: banner.bannerType,
    sortOrder: banner.sortOrder,
    startDate: banner.startDate,
    endDate: banner.endDate,
    isActive: banner.isActive,
    mediaType: banner.mediaType,
  };
}

async function migrate() {
  const { apiBaseUrl, email, password } = await loadMigrationEnvironment();
  const apiUrl = new URL(apiBaseUrl);

  if (isApplyMode && apiUrl.hostname !== DEVELOPMENT_API_HOST) {
    throw new Error('Refusing to apply migration outside the development admin API host');
  }

  const accessToken = await login(apiBaseUrl, email, password);
  const bannerIds = await fetchAllCurationBannerIds(apiBaseUrl, accessToken);
  const results = {
    mode: isApplyMode ? 'apply' : 'dry-run',
    apiBaseUrl,
    scannedBannerIds: bannerIds,
    updated: [],
    skipped: [],
    failed: [],
  };

  for (const bannerId of bannerIds) {
    try {
      const detailResponse = await requestJson(`${apiBaseUrl}/admin/api/v1/banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const banner = detailResponse.data;

      if (banner.bannerType !== 'CURATION' || banner.isExternalUrl) {
        results.skipped.push({ bannerId, reason: 'not-an-internal-curation-banner' });
        continue;
      }

      const curationId = getCurationIdFromLegacyTargetUrl(banner.targetUrl);
      if (!curationId) {
        const reason = /^\/curation\/\d+$/.test(banner.targetUrl ?? '')
          ? 'already-v2-link'
          : 'unsupported-or-malformed-link';
        results.skipped.push({ bannerId, reason, targetUrl: banner.targetUrl ?? null });
        continue;
      }

      const targetUrl = toV2TargetUrl(curationId);
      if (isApplyMode) {
        await requestJson(`${apiBaseUrl}/admin/api/v1/banners/${bannerId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(buildUpdatePayload(banner, targetUrl)),
        });
      }

      results.updated.push({
        bannerId,
        from: banner.targetUrl,
        to: targetUrl,
        applied: isApplyMode,
      });
    } catch (error) {
      results.failed.push({
        bannerId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  if (results.failed.length > 0) process.exitCode = 1;
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Migration failed');
  process.exitCode = 1;
});

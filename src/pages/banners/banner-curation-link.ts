const LEGACY_CURATION_PATHS = new Set(['/search', '/alcohols/search']);

export function createCurationTargetUrl(curationId: number): string {
  return `/curation/${curationId}`;
}

export function extractCurationIdFromTargetUrl(
  targetUrl: string | null | undefined
): number | null {
  if (!targetUrl?.startsWith('/')) return null;

  const url = new URL(targetUrl, 'https://bottlenote.local');
  const v2Match = url.pathname.match(/^\/curation\/(\d+)$/);

  if (v2Match?.[1]) {
    return toPositiveInteger(v2Match[1]);
  }

  if (!LEGACY_CURATION_PATHS.has(url.pathname)) return null;

  const curationIds = url.searchParams.getAll('curationId');
  return curationIds.length === 1 ? toPositiveInteger(curationIds[0] ?? null) : null;
}

function toPositiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

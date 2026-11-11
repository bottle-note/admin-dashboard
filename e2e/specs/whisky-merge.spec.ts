import { test, expect, type Page } from '@playwright/test';
import { loadEnv } from 'vite';

test.use({
  storageState: { cookies: [], origins: [] },
  hasTouch: true,
  trace: 'off',
  video: 'off',
  screenshot: 'off',
});

const blockedMutations = new WeakMap<Page, string[]>();
const MERGES = '/admin/api/v1/alcohols/merges';

test.beforeEach(async ({ page }) => {
  const blocked: string[] = [];
  blockedMutations.set(page, blocked);
  // E2E 오류가 있어도 실제 데이터의 미리보기·병합 요청은 서버에 보내지 않는다.
  await page.route('**/admin/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const isAuth = path === '/admin/api/v1/auth/login' || path === '/admin/api/v1/auth/refresh';
    if (!['GET', 'OPTIONS'].includes(request.method()) && !isAuth) {
      blocked.push(`${request.method()} ${path}`);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  const env = loadEnv('dev', process.cwd(), 'VITE_E2E_');
  const email = process.env.VITE_E2E_TEST_ID ?? env.VITE_E2E_TEST_ID;
  const password = process.env.VITE_E2E_TEST_PW ?? env.VITE_E2E_TEST_PW;
  if (!email || !password) throw new Error('개발 E2E 계정 환경변수가 필요합니다.');
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/whisky/merge');
});

test.afterEach(async ({ page }) => {
  expect(blockedMutations.get(page), '읽기 E2E에서 변경 요청을 시도하지 않아야 한다.').toEqual([]);
});

test('실제 이력 조회와 위스키 검색·선택을 확인하고 병합 승인 전에는 실행을 막는다', async ({
  page,
}) => {
  await expect(page.getByRole('heading', { name: '위스키 병합', exact: true })).toBeVisible();
  const logsResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === MERGES && response.request().method() === 'GET'
  );
  const mergeTab = page.getByRole('tab', { name: '병합하기', exact: true });
  const historyTab = page.getByRole('tab', { name: '병합 이력', exact: true });
  await mergeTab.focus();
  await mergeTab.press('ArrowRight');
  const logs = await logsResponse;
  expect(logs.status()).toBe(200);
  await expect(historyTab).toBeFocused();
  await expect(historyTab).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/tab=history/);
  const logPayload = await logs.json();
  expect(logPayload.success).toBe(true);
  if (logPayload.data.length === 0) {
    await expect(page.getByText('병합 이력이 없습니다.', { exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('table').first().locator(':scope > tbody > tr')).toHaveCount(
      logPayload.data.length
    );
  }

  await page.getByLabel('기준 위스키 ID').fill('0');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page.getByText('1 이상의 정수 ID를 입력하세요.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('기준 위스키 ID')).toBeFocused();
  await historyTab.focus();
  await historyTab.press('ArrowLeft');
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  await expect(mergeTab).toBeFocused();

  const baseRegion = page.getByRole('region', { name: '남길 위스키', exact: true });
  const duplicateRegion = page.getByRole('region', { name: '합칠 중복 위스키', exact: true });
  const lookupResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === '/admin/api/v1/alcohols/lookup' &&
      url.searchParams.get('keyword') === '글렌피딕'
    );
  });
  await baseRegion.getByRole('combobox').fill('글렌피딕');
  const lookup = await lookupResponse;
  expect(lookup.status()).toBe(200);
  const candidates: { alcoholId: number; korName: string }[] = (await lookup.json()).data;
  const base = candidates[0];
  const duplicate = candidates.find((item) => item.alcoholId !== base?.alcoholId);
  expect(base, '검색 검증에 사용할 기준 위스키가 있어야 한다.').toBeDefined();
  expect(duplicate, '검색 검증에 사용할 서로 다른 위스키가 있어야 한다.').toBeDefined();
  await page
    .getByRole('option', { name: `${base!.korName} 위스키 선택`, exact: true })
    .first()
    .click();
  await expect(baseRegion.getByText(`#${base!.alcoholId}`, { exact: true })).toBeVisible();
  await duplicateRegion.getByRole('combobox').fill('글렌피딕');
  await page
    .getByRole('option', { name: `${duplicate!.korName} 위스키 선택`, exact: true })
    .first()
    .click();
  await expect(
    duplicateRegion.getByText(`#${duplicate!.alcoholId}`, { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '미리보기 확인', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '중복 위스키 1개 병합', exact: true })).toHaveCount(
    0
  );
});

test('좁은 화면에서 선택 영역을 세로로 배치하고 모바일 메뉴로 병합 페이지에 진입한다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const base = await page.getByRole('region', { name: '남길 위스키', exact: true }).boundingBox();
  const duplicates = await page
    .getByRole('region', { name: '합칠 중복 위스키', exact: true })
    .boundingBox();
  expect(base).not.toBeNull();
  expect(duplicates).not.toBeNull();
  expect(base!.y + base!.height).toBeLessThan(duplicates!.y);
  expect(Math.abs(base!.x - duplicates!.x)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const logsResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === MERGES && response.request().method() === 'GET'
  );
  await page.getByRole('tab', { name: '병합 이력', exact: true }).tap();
  expect((await logsResponse).status()).toBe(200);
  await expect(page.getByLabel('기준 위스키 ID')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).tap();
  const parent = page.getByRole('button', { name: '위스키/테이스팅 태그', exact: true });
  if ((await parent.getAttribute('aria-expanded')) !== 'true') await parent.tap();
  const group = page.getByRole('button', { name: '위스키 정보 관리', exact: true });
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.tap();
  await page.getByRole('button', { name: '위스키 병합', exact: true }).tap();
  await expect(page).toHaveURL(/\/whisky\/merge$/);
  await expect(page.getByRole('tab', { name: '병합하기', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('로컬 응답으로 중복 10개의 미리보기 높이와 좁은 화면의 개별 조회를 검증한다', async ({
  page,
}) => {
  const base = {
    alcoholId: 901000,
    korName: `레이아웃 검증 기준 ${'UnbrokenName'.repeat(24)}`.slice(0, 255),
    engName: 'UnbrokenEnglishName'.repeat(16).slice(0, 255),
    imageUrl: null,
  };
  const duplicates = Array.from({ length: 10 }, (_, index) => ({
    ...base,
    alcoholId: 901001 + index,
    korName: `레이아웃 검증 중복 ${index + 1} ${'LongName'.repeat(32)}`.slice(0, 255),
  }));
  const categories = [
    'reviews',
    'ratings',
    'picks',
    'userHistories',
    'viewHistories',
    'tastingTags',
    'attributes',
    'curationKeywords',
    'mfdsDeclarations',
  ];
  // 최대 개수의 preview는 로컬 응답으로만 만들며 실서버로 전달하지 않는다.
  await page.route('**/admin/api/v1/alcohols/lookup?*', async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get('keyword') ?? '';
    const data = [base, ...duplicates].filter((item) => item.korName.includes(keyword));
    await route.fulfill({
      json: {
        success: true,
        data,
        meta: { page: 0, size: 20, totalElements: data.length, totalPages: 1, hasNext: false },
      },
    });
  });
  let simulatedPreviews = 0;
  await page.route(`**${MERGES}/preview`, async (route) => {
    simulatedPreviews++;
    const request = route.request().postDataJSON() as {
      baseAlcoholId: number;
      duplicateAlcoholIds: number[];
    };
    expect(request.baseAlcoholId).toBe(base.alcoholId);
    expect(request.duplicateAlcoholIds).toEqual(
      duplicates.slice(0, simulatedPreviews === 1 ? 1 : 10).map((item) => item.alcoholId)
    );
    await route.fulfill({
      json: {
        success: true,
        data: {
          base,
          duplicates: request.duplicateAlcoholIds.map((id) => ({
            alcohol: duplicates.find((item) => item.alcoholId === id)!,
            counts: categories.map((name) => ({ name, moved: 1, deleted: 2 })),
          })),
        },
        meta: {},
      },
    });
  });
  const baseRegion = page.getByRole('region', { name: '남길 위스키', exact: true });
  const duplicateRegion = page.getByRole('region', { name: '합칠 중복 위스키', exact: true });
  const preview = page.getByRole('region', { name: '병합 미리보기', exact: true });
  let oneHeight = 0;
  await baseRegion.getByRole('combobox').fill(base.korName);
  await page.getByRole('option', { name: `${base.korName} 위스키 선택`, exact: true }).click();
  for (const [index, duplicate] of duplicates.entries()) {
    await duplicateRegion.getByRole('combobox').fill('레이아웃 검증 중복');
    await page
      .getByRole('option', { name: `${duplicate.korName} 위스키 선택`, exact: true })
      .click();
    if (index === 0) {
      await page.getByRole('button', { name: '미리보기 확인', exact: true }).click();
      await expect(preview.getByRole('table', { name: '전체 병합 기록 합계' })).toBeVisible();
      oneHeight = (await preview.boundingBox())!.height;
      await page.getByRole('button', { name: '대상 다시 선택', exact: true }).click();
    }
  }
  // 첫 미리보기의 9개 행과 같은 높이를 비교한다.
  await expect(
    page.getByRole('button', { name: '중복 위스키 10개 병합', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: '미리보기 확인', exact: true }).click();
  await expect(preview.getByRole('table')).toHaveCount(1);
  await expect(preview.getByRole('row', { name: '리뷰 10건 20건' })).toBeVisible();
  const tenHeight = (await preview.boundingBox())!.height;
  expect(tenHeight).toBeLessThan(650);
  expect(Math.abs(tenHeight - oneHeight)).toBeLessThan(2);
  expect(simulatedPreviews).toBe(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await preview.getByRole('combobox', { name: '미리보기 범위' }).click();
  const last = duplicates.at(-1)!;
  const lastOption = page.getByRole('option', {
    name: `${last.korName} (#${last.alcoholId})`,
    exact: true,
  });
  await expect(lastOption).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await lastOption.click();
  await expect(preview.getByRole('row', { name: '리뷰 1건 2건' })).toBeVisible();
  await expect(preview.getByText('중복 10개 전체', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '중복 위스키 10개 병합', exact: true })
  ).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // 선택된 열 개의 전체 이름은 검토 목록에 보존하고 최종 확인은 짧게 유지한다.
  const targets = page.getByRole('region', { name: '검토할 병합 대상' });
  await expect(targets.getByText(last.korName, { exact: true })).toHaveCount(1);
  const trigger = page.getByRole('button', { name: '중복 위스키 10개 병합', exact: true });
  for (const size of [
    { width: 320, height: 640 },
    { width: 390, height: 320 },
  ]) {
    await page.setViewportSize(size);
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('중복 위스키 10개를 아래 위스키로 합칩니다.', { exact: true })
    ).toBeVisible();
    const bounds = await dialog.boundingBox();
    const confirm = await dialog
      .getByRole('button', { name: '병합 실행', exact: true })
      .boundingBox();
    const cancel = await dialog.getByRole('button', { name: '취소', exact: true }).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height);
    for (const action of [confirm!, cancel!]) {
      expect(action.y).toBeGreaterThanOrEqual(0);
      expect(action.y + action.height).toBeLessThanOrEqual(size.height);
    }
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true
    );
    await dialog.getByRole('button', { name: '취소', exact: true }).press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }

  // 글자만 두 배로 키웠을 때도 검토 내용과 두 동작에 스크롤로 접근한다.
  await page.setViewportSize({ width: 390, height: 320 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  const descriptionId = await dialog.getAttribute('aria-describedby');
  const body = page.locator(`[id="${descriptionId}"]`);
  expect(await body.evaluate((element) => element.clientHeight)).toBeGreaterThan(0);
  await expect(body).toBeFocused();
  await body.focus();
  await body.press('End');
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  for (const name of ['취소', '병합 실행']) {
    const action = dialog.getByRole('button', { name, exact: true });
    await action.focus();
    await expect(action).toBeInViewport({ ratio: 1 });
  }
  await dialog.getByRole('button', { name: '취소', exact: true }).press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
});

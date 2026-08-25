import { expect, test } from '@playwright/test';

const LIST_URL = '/mfds/declarations';

test.describe('식약처 수입 신고 조회', () => {
  test('목록에서 상세로 이동해 정제와 매칭 정보를 확인할 수 있다', async ({ page }) => {
    const listResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/mfds/declarations') &&
        !response.url().includes('/matching/candidates') &&
        response.request().method() === 'GET'
    );

    await page.goto(LIST_URL);
    expect((await listResponse).ok()).toBe(true);

    await expect(page.getByRole('heading', { name: '수입 신고 목록' })).toBeVisible();
    await expect(page.getByText('수입 신고를 불러오는 중입니다.')).toBeHidden();
    const firstDataRow = page
      .locator('tbody tr')
      .filter({ has: page.locator('td') })
      .first();
    await expect(firstDataRow).not.toContainText('불러오는 중');
    await expect(firstDataRow).not.toContainText('수집된 수입 신고가 없습니다');

    await firstDataRow.click();

    await expect(page).toHaveURL(/\/mfds\/declarations\/\d+$/);
    await expect(page.getByText('신고 기본 정보', { exact: true })).toBeVisible();
    await expect(page.getByText('정제 및 검토 상태', { exact: true })).toBeVisible();
    await expect(page.getByText('RCNO 연결 근거', { exact: true })).toBeVisible();
    await expect(page.getByText('보틀노트 매칭', { exact: true })).toBeVisible();
  });

  test('정규화 필터를 URL에 유지한다', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('heading', { name: '수입 신고 목록' })).toBeVisible();

    await page.getByLabel('정규화 상태').click();
    const filteredResponse = page.waitForResponse((response) =>
      response.url().includes('normalizationStatus=REVIEW_REQUIRED')
    );
    await page.getByRole('option', { name: '검토 필요' }).click();

    expect((await filteredResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/normalizationStatus=REVIEW_REQUIRED/);
    await expect(page.locator('tbody')).toContainText('검토 필요');
  });

  test('수입사 이름을 검색해 선택한 수입사로 신고를 필터링한다', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('heading', { name: '수입 신고 목록' })).toBeVisible();

    const importerInput = page.getByLabel('수입사 이름 검색');
    const initialImporterResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());

      return url.pathname.endsWith('/v1/mfds/importers') && !url.searchParams.has('keyword');
    });
    await importerInput.focus();
    expect((await initialImporterResponse).ok()).toBe(true);
    await expect(page.getByRole('button', { name: /수입사 선택/ }).first()).toBeVisible();

    const importerResponse = page.waitForResponse((response) =>
      response.url().includes('/v1/mfds/importers?keyword=')
    );
    await importerInput.fill('빔산토리');
    expect((await importerResponse).ok()).toBe(true);

    const importerOption = page.getByRole('button', { name: /빔산토리.*수입사 선택/ }).first();
    const declarationResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/mfds/declarations?') && response.url().includes('importerId=')
    );
    await importerOption.click();
    expect((await declarationResponse).ok()).toBe(true);

    await expect(page).toHaveURL(/importerId=\d+/);
    await expect(importerInput).toHaveValue('빔산토리코리아 유한회사');

    await page.getByRole('button', { name: '선택한 수입사 지우기' }).click();
    await expect(page).not.toHaveURL(/importerId=/);
  });
});

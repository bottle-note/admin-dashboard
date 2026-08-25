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
});

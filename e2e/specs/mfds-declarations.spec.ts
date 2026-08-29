import { expect, test } from '@playwright/test';

const LIST_URL = '/mfds/declarations';

test.describe('식약처 수입 신고 데이터 검토', () => {
  test('목록에서 상세로 이동해 정규화와 연결 정보를 확인할 수 있다', async ({ page }) => {
    const listResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/mfds/declarations') &&
        !response.url().includes('/matching/candidates') &&
        response.request().method() === 'GET'
    );

    await page.goto(`${LIST_URL}?normalizationStatus=NORMALIZED`);
    expect((await listResponse).ok()).toBe(true);

    await expect(page.getByRole('heading', { name: '수입 신고 데이터 검토' })).toBeVisible();
    await expect(page.getByText('수입 신고 데이터를 불러오는 중입니다.')).toBeHidden();
    const firstDataRow = page
      .locator('tbody tr')
      .filter({ has: page.locator('td') })
      .first();
    await expect(firstDataRow).not.toContainText('불러오는 중');
    await expect(firstDataRow).not.toContainText('수집된 신고 데이터가 없습니다');

    await firstDataRow.click();

    await expect(page).toHaveURL(/\/mfds\/declarations\/\d+$/);
    const processingRecord = page.getByText('데이터 처리 기록', { exact: true });
    const normalizationHeading = page.getByRole('heading', { name: '정규화 결과' });
    await expect(processingRecord).toBeVisible();
    await expect(normalizationHeading).toBeVisible();
    expect((await processingRecord.boundingBox())?.y).toBeLessThan(
      (await normalizationHeading.boundingBox())?.y ?? 0
    );
    await expect(page.getByRole('columnheader', { name: '분류' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '정규화 결과' })).toBeVisible();
    await expect(page.getByText('규격 정규화 결과', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('정규화 상태')).toHaveText('정규화 완료');
    await expect(page.getByLabel('데이터 처리 상태')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '수입사 연결' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '연관 데이터 연결' })).toBeVisible();
    await expect(page.getByText('수입사 매핑 근거', { exact: true })).toHaveCount(0);
    await expect(page.getByText('보틀노트 데이터 연결', { exact: true })).toHaveCount(0);
    const importerSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: '수입사 연결' }),
    });
    await expect(importerSection.locator('a[href^="/mfds/importers/"]')).toBeVisible();
    await expect(importerSection.getByRole('button', { name: '보기' })).toHaveCount(0);

    const matchingSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: '연관 데이터 연결' }),
    });
    await matchingSection.getByRole('button', { name: '연결 관리' }).click();
    await expect(page.getByRole('heading', { name: /보틀노트 위스키 연결/ })).toBeVisible();
    await expect(page.getByText(/RCNO/)).toBeVisible();
    await expect(page.getByRole('button', { name: '후보 다시 계산' })).toBeVisible();
    const lookupResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/alcohols/lookup') && response.request().method() === 'GET'
    );
    await page.getByRole('button', { name: '위스키 직접 찾기' }).click();
    expect((await lookupResponse).ok()).toBe(true);
    const whiskyLookupDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: '연결할 보틀노트 위스키 찾기' }),
    });
    await expect(whiskyLookupDialog).toBeVisible();
    await expect(whiskyLookupDialog.getByRole('textbox', { name: '위스키 검색' })).toBeVisible();
    await expect(whiskyLookupDialog.getByText('위스키 목록', { exact: true })).toBeVisible();
  });

  test('정규화 필터를 URL에 유지한다', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('heading', { name: '수입 신고 데이터 검토' })).toBeVisible();

    await page.getByLabel('정규화 상태').click();
    const filteredResponse = page.waitForResponse((response) =>
      response.url().includes('normalizationStatus=REVIEW_REQUIRED')
    );
    await page.getByRole('option', { name: '검토 필요' }).click();

    expect((await filteredResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/normalizationStatus=REVIEW_REQUIRED/);
    await expect(page.locator('tbody')).toContainText('검토 필요');

    await page
      .locator('tbody tr')
      .filter({ has: page.locator('td') })
      .first()
      .click();

    const statusPanel = page.getByLabel('데이터 처리 상태');
    const processingRecord = page.getByText('데이터 처리 기록', { exact: true });
    await expect(page.getByLabel('정규화 상태')).toHaveText('검토 필요');
    await expect(processingRecord).toBeVisible();
    await expect(statusPanel).toContainText('검토 대기');
    expect((await processingRecord.boundingBox())?.y).toBeLessThan(
      (await statusPanel.boundingBox())?.y ?? 0
    );
    await expect(statusPanel.getByText('정규화 처리 코드', { exact: true })).toBeVisible();
    await expect(statusPanel.locator('li code').first()).toBeVisible();
  });

  test('수입사 이름을 검색해 선택한 수입사로 신고를 필터링한다', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('heading', { name: '수입 신고 데이터 검토' })).toBeVisible();

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

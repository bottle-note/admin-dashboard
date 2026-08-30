import { expect, test } from '@playwright/test';

test.describe('위스키 Excel 벌크 등록', () => {
  test('양식을 내려받아 업로드 검증 결과를 확인할 수 있다', async ({ page }) => {
    await page.goto('/whisky/excel-bulk');

    await expect(page.getByRole('heading', { name: '위스키 Excel 벌크 등록' })).toBeVisible();
    await expect(page.getByRole('button', { name: '검증하기' })).toBeDisabled();

    const templateResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/alcohols/excel/template') &&
        response.request().method() === 'GET'
    );
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '양식 다운로드' }).click();

    expect((await templateResponse).ok()).toBe(true);
    const template = await downloadPromise;
    const templatePath = await template.path();
    expect(templatePath).not.toBeNull();

    await page.getByLabel('검증할 Excel 파일 선택').setInputFiles(templatePath!);
    await expect(page.getByText(template.suggestedFilename())).toBeVisible();
    await expect(page.getByRole('button', { name: '검증하기' })).toBeEnabled();

    const validationResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/alcohols/excel/validate') &&
        response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: '검증하기' }).click();

    expect((await validationResponse).ok()).toBe(true);
    await expect(page.getByText('검증 결과')).toBeVisible();
    await expect(page.getByText('입력된 데이터 행이 없습니다.')).toBeVisible();
  });
});

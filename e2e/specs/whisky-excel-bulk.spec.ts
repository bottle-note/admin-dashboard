import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const normalizedRow = {
  clientRowId: '3',
  korName: '벌크 테스트 위스키',
  engName: 'Bulk Test Whisky',
  abv: '40%',
  type: 'WHISKY',
  korCategory: '싱글 몰트',
  engCategory: 'Single Malt',
  categoryGroup: 'SINGLE_MALT',
  regionId: 1,
  distilleryId: 1,
  age: null,
  cask: null,
  description: null,
  volume: '700ml',
  tastingTagIds: [],
  imageUrl: null,
};

const excelValidationResult = {
  totalRows: 1,
  validRows: 1,
  invalidRows: 0,
  warningRows: 0,
  rows: [
    {
      rowNumber: 3,
      clientRowId: '3',
      korName: normalizedRow.korName,
      engName: normalizedRow.engName,
      valid: true,
      errors: [],
      warnings: [],
      candidateAlcoholIds: [],
      normalized: normalizedRow,
    },
  ],
};

async function selectAndValidateFile(page: import('@playwright/test').Page) {
  await page.route('**/admin/api/v1/alcohols/excel/validate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 200,
        data: excelValidationResult,
        errors: [],
        meta: {},
      }),
    });
  });

  await page.getByLabel('검증할 Excel 파일 선택').setInputFiles({
    name: 'bulk-test.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('bulk-test'),
  });
  await page.getByRole('button', { name: '검증하기' }).click();
  await expect(page.getByRole('button', { name: '업로드하기' })).toBeEnabled();
}

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

    await page.getByLabel('검증할 Excel 파일 선택').setInputFiles({
      name: template.suggestedFilename(),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: await readFile(templatePath!),
    });
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
    await expect(page.getByText('오류 없는 행')).toHaveCount(0);
    await expect(page.getByText('입력된 데이터 행이 없습니다.')).toBeVisible();
  });

  test('검증을 통과한 행을 확인 후 한 번에 등록할 수 있다', async ({ page }) => {
    let uploadedRows: unknown;
    await page.route('**/admin/api/v1/alcohols/bulk', async (route) => {
      uploadedRows = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 200,
          data: {
            createdRows: 1,
            rows: [{ clientRowId: '3', alcoholId: 101 }],
            validation: excelValidationResult,
          },
          errors: [],
          meta: {},
        }),
      });
    });

    await page.goto('/whisky/excel-bulk');
    await selectAndValidateFile(page);
    await page.getByRole('button', { name: '업로드하기' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('위스키 1건을 등록할까요?');
    await page.getByRole('alertdialog').getByRole('button', { name: '업로드' }).click();

    await expect(page.getByText('위스키 1건을 등록했습니다.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '업로드하기' })).toBeDisabled();
    expect(uploadedRows).toEqual({ rows: [normalizedRow] });
  });

  test('등록 직전 재검증 실패를 기존 검증 결과 표에 표시한다', async ({ page }) => {
    await page.route('**/admin/api/v1/alcohols/bulk', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 400,
          data: [],
          errors: {
            totalRows: 1,
            validRows: 0,
            invalidRows: 1,
            warningRows: 0,
            rows: [
              {
                clientRowId: '3',
                valid: false,
                normalized: null,
                errors: [
                  {
                    code: 'INVALID_REFERENCE',
                    field: 'regionId',
                    message: '존재하는 참조 ID를 입력해 주세요.',
                  },
                ],
                warnings: [],
                candidateAlcoholIds: [],
              },
            ],
          },
          meta: {},
        }),
      });
    });

    await page.goto('/whisky/excel-bulk');
    await selectAndValidateFile(page);
    await page.getByRole('button', { name: '업로드하기' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '업로드' }).click();

    await expect(page.getByText('존재하는 참조 ID를 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('벌크 테스트 위스키 / Bulk Test Whisky')).toBeVisible();
    await expect(page.getByRole('button', { name: '업로드하기' })).toBeDisabled();
  });
});

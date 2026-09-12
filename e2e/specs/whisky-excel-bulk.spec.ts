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
  await expect(page.getByRole('button', { name: '최종 전송', exact: true })).toBeEnabled();
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
    await expect(page.getByText('3. 검증 및 이미지 추가', { exact: true })).toBeVisible();
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
    await page.getByRole('button', { name: '최종 전송', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toContainText('위스키 1건을 등록할까요?');
    await page.getByRole('alertdialog').getByRole('button', { name: '등록', exact: true }).click();

    await expect(page.getByText('위스키 1건을 등록했습니다.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '최종 전송', exact: true })).toBeDisabled();
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
    await page.getByRole('button', { name: '최종 전송', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '등록', exact: true }).click();

    await expect(
      page.getByRole('row').getByText('존재하는 참조 ID를 입력해 주세요.')
    ).toBeVisible();
    await expect(
      page.getByRole('cell', { name: '벌크 테스트 위스키 / Bulk Test Whisky', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '최종 전송', exact: true })).toBeDisabled();
  });
});

// 실제 양식·검증·S3 업로드를 사용한다. 최종 등록만 가로채 테스트 데이터 생성을 막는다.
test('행별 이미지 교체와 파일명 매칭 결과를 최종 전송에 반영한다', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const { default: ExcelJS } = await import('exceljs');
  await page.goto('/whisky/excel-bulk');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '양식 다운로드' }).click();
  const templatePath = await (await download).path();
  expect(templatePath).not.toBeNull();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath!);
  const sheet = workbook.getWorksheet('알코올 데이터')!;
  const categoryId = workbook.getWorksheet('카테고리')!.getCell('A2').text;
  const regionId = workbook.getWorksheet('지역')!.getCell('A2').text;
  const distilleryId = workbook.getWorksheet('증류소')!.getCell('A2').text;
  expect(categoryId).not.toBe('');
  expect(regionId).not.toBe('');
  expect(distilleryId).not.toBe('');
  for (let index = 0; index < 2; index++) {
    sheet.getRow(index + 3).values = [
      `이미지 검증 ${index + 1}`,
      `Image Verification ${index + 1}`,
      '40',
      'WHISKY',
      categoryId,
      '',
      regionId,
      distilleryId,
      '',
      '',
      '',
      '700',
      '',
    ];
  }
  await page.getByLabel('검증할 Excel 파일 선택').setInputFiles({
    name: 'image-validation.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  await page.getByRole('button', { name: '검증하기' }).click();
  await expect(page.getByRole('button', { name: '최종 전송', exact: true })).toBeEnabled();
  const firstRow = page.getByRole('row').filter({ hasText: '이미지 검증 1' });
  const secondRow = page.getByRole('row').filter({ hasText: '이미지 검증 2' });
  await expect(firstRow).toBeVisible();
  await expect(secondRow).toBeVisible();

  // 개별 업로드는 기존 크롭과 실제 presign → PUT → viewUrl 경로를 사용한다.
  const imageBytes = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#f2eadf';
      context.fillRect(0, 0, 320, 480);
      context.fillStyle = '#8b5e34';
      context.fillRect(100, 80, 120, 320);
      return canvas.toDataURL('image/png').split(',')[1]!;
    }),
    'base64'
  );
  await firstRow.getByLabel('이미지 검증 1 이미지 파일 선택').setInputFiles({
    name: 'crop-test.png',
    mimeType: 'image/png',
    buffer: imageBytes,
  });
  await page.getByRole('button', { name: '이미지 저장' }).click();
  const firstImage = firstRow.getByRole('img', { name: '3행 이미지 검증 1 이미지', exact: true });
  await expect(firstImage).toHaveAttribute('src', /^https:\/\//);
  const initialUrl = await firstImage.getAttribute('src');
  await firstRow
    .getByRole('button', { name: '3행 이미지 검증 1 이미지 수정', exact: true })
    .click();
  const cropDialog = page.getByRole('dialog', { name: '이미지 크롭 및 변환' });
  await expect(cropDialog.getByRole('img', { name: '크롭할 원본 이미지' })).toBeVisible();
  await cropDialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(firstImage).toHaveAttribute('src', initialUrl!);
  await firstRow
    .getByRole('button', { name: '3행 이미지 검증 1 이미지 수정', exact: true })
    .click();
  await cropDialog.getByLabel('크롭 비율').selectOption('1');
  await cropDialog.getByText('상세 설정 · 크롭 좌표', { exact: true }).click();
  await cropDialog.getByLabel('X (px)', { exact: true }).fill('300');
  await cropDialog.getByRole('button', { name: '좌표 적용', exact: true }).click();
  await expect(cropDialog.getByRole('alert')).toContainText('원본 이미지 범위');
  await cropDialog.getByLabel('X (px)', { exact: true }).fill('80');
  await cropDialog.getByLabel('Y (px)', { exact: true }).fill('120');
  await cropDialog.getByLabel('너비 (px)', { exact: true }).fill('160');
  await cropDialog.getByLabel('높이 (px)', { exact: true }).fill('160');
  await cropDialog.getByRole('button', { name: '좌표 적용', exact: true }).click();
  await expect(cropDialog.getByLabel('원본 기준 크롭 160 × 160px')).toBeVisible();
  await cropDialog.getByRole('button', { name: '가운데 정렬', exact: true }).click();
  await expect(cropDialog.getByLabel('X (px)', { exact: true })).toHaveValue('80');
  await expect(cropDialog.getByLabel('Y (px)', { exact: true })).toHaveValue('160');
  await expect(cropDialog).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('crop-editor.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 480, height: 900 });
  await cropDialog.getByRole('button', { name: '이미지 저장' }).scrollIntoViewIfNeeded();
  expect(await cropDialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true
  );
  await page.screenshot({
    path: testInfo.outputPath('crop-editor-narrow.png'),
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await cropDialog.getByRole('button', { name: '이미지 저장' }).click();
  await expect(firstImage).not.toHaveAttribute('src', initialUrl!);
  await expect
    .poll(() =>
      firstImage.evaluate(
        (image: HTMLImageElement) =>
          image.complete && image.naturalWidth === 160 && image.naturalHeight === 160
      )
    )
    .toBe(true);
  const originalUrl = await firstImage.getAttribute('src');
  await page.getByRole('button', { name: '이미지 미첨부 (1)' }).click();
  await expect(firstRow).toHaveCount(0);
  await expect(secondRow).toBeVisible();
  await page.getByRole('button', { name: '전체 (2)', exact: true }).click();

  await page.getByRole('button', { name: '여러 이미지 추가', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('003_이미지_검증_1', { exact: true })).toBeVisible();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const firstCopy = dialog.getByRole('button', {
    name: '3행 이미지 검증 1 파일명 복사',
    exact: true,
  });
  const secondCopy = dialog.getByRole('button', {
    name: '4행 이미지 검증 2 파일명 복사',
    exact: true,
  });
  await firstCopy.click();
  await expect(firstCopy).toHaveText('완료');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('003_이미지_검증_1');
  await secondCopy.click();
  await expect(secondCopy).toHaveText('완료');
  await expect(firstCopy).toHaveText('복사');
  await expect(page.getByText('파일명을 복사했습니다.', { exact: true })).toHaveCount(0);
  const mappingDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '파일명 목록 다운로드' }).click();
  const mappingFile = await mappingDownload;
  expect(mappingFile.suggestedFilename()).toBe('whisky-image-filenames.csv');
  const { readFile } = await import('node:fs/promises');
  expect(await readFile((await mappingFile.path())!, 'utf8')).toContain(
    '"3","이미지 검증 1","003_이미지_검증_1"'
  );
  await page.screenshot({
    path: testInfo.outputPath('image-matching.png'),
    animations: 'disabled',
  });
  await dialog.getByLabel('매칭할 이미지 파일 선택').setInputFiles([
    { name: '003_이미지_검증_1.png', mimeType: 'image/png', buffer: imageBytes },
    { name: '004_이미지_검증_2.png', mimeType: 'image/png', buffer: imageBytes },
    { name: '004_이미지_검증_2.jpg', mimeType: 'image/jpeg', buffer: imageBytes },
    { name: 'unmatched.png', mimeType: 'image/png', buffer: imageBytes },
  ]);
  await expect(dialog.getByText(/파일 중복/)).toHaveCount(2);
  await expect(dialog.getByText(/연결 대상 없음 · 대상 없음/)).toBeVisible();
  await dialog.getByLabel('004_이미지_검증_2.jpg 목록에서 제외').click();
  await expect(dialog.getByRole('button', { name: '매칭된 이미지 1개 업로드' })).toBeEnabled();
  await dialog.getByRole('checkbox', { name: '기존 이미지 교체' }).check();
  await page.setViewportSize({ width: 480, height: 900 });
  await dialog.getByRole('button', { name: '매칭된 이미지 2개 업로드' }).scrollIntoViewIfNeeded();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(
    await dialog.evaluate(
      (element) =>
        Array.from(element.querySelectorAll('*')).filter((child) => {
          const overflow = getComputedStyle(child).overflowY;
          return ['auto', 'scroll'].includes(overflow) && child.scrollHeight > child.clientHeight;
        }).length
    )
  ).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath('image-matching-narrow.png'),
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  // 재현하기 어려운 부분 실패만 한 번 주입하고, 재시도는 실제 API를 사용한다.
  await page.route(
    '**/admin/api/v1/s3/presign-url?**',
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, code: 500, data: [], errors: [], meta: {} }),
      }),
    { times: 1 }
  );
  await dialog.getByRole('button', { name: '매칭된 이미지 2개 업로드' }).click();
  await expect(dialog.getByText(/· 업로드 완료/)).toHaveCount(1);
  await expect(dialog.getByText(/· 업로드 실패/)).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: '최종 전송', exact: true, includeHidden: true })
  ).toBeDisabled();
  await dialog.getByRole('button', { name: '매칭된 이미지 1개 업로드' }).click();
  await expect(dialog.getByText(/· 업로드 완료/)).toHaveCount(2);
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(firstImage).not.toHaveAttribute('src', originalUrl!);
  const secondImage = secondRow.getByRole('img', { name: '4행 이미지 검증 2 이미지', exact: true });
  await expect(secondImage).toHaveAttribute('src', /^https:\/\//);
  await page
    .getByRole('table')
    .screenshot({ path: testInfo.outputPath('bulk-image-table.png'), animations: 'disabled' });
  // 다중 업로드로 붙인 이미지도 파일 선택 없이 다시 크롭한다.
  await secondRow
    .getByRole('button', { name: '4행 이미지 검증 2 이미지 수정', exact: true })
    .click();
  await expect(cropDialog.getByRole('img', { name: '크롭할 원본 이미지' })).toBeVisible();
  await cropDialog.getByRole('button', { name: '취소', exact: true }).click();

  await page.getByText('작업 정보', { exact: true }).click();
  const stateField = page.getByLabel('현재 벌크 등록 작업 정보 JSON');
  const state = JSON.parse(await stateField.inputValue());
  expect(state.canSubmit).toBe(true);
  expect(state.rows.map((row: { imageStatus: string }) => row.imageStatus)).toEqual([
    'READY',
    'READY',
  ]);
  expect(state.rows[0].clientRowId).toBe(await firstRow.getAttribute('data-client-row-id'));
  await page.getByRole('button', { name: '이미지 미첨부 (0)' }).click();
  expect(JSON.parse(await stateField.inputValue()).rows).toHaveLength(2);
  await page.getByRole('button', { name: '전체 (2)', exact: true }).click();
  await stateField.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('bulk-work-state.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const guide = await page.request.get('/agent-guides/whisky-excel-bulk.md');
  expect(await guide.text()).toContain('원본 픽셀');
  const guidePage = await page.context().newPage();
  await guidePage.goto('/agent-guides/whisky-excel-bulk.md');
  expect(await guidePage.evaluate(() => document.characterSet)).toBe('UTF-8');
  await expect(guidePage.locator('body')).toContainText('003_글렌피딕_12년.jpg');
  await guidePage.screenshot({ path: testInfo.outputPath('guide-utf8.png') });
  await guidePage.close();
  expect(await (await page.request.get('/llms.txt')).text()).toContain(
    '/agent-guides/whisky-excel-bulk.md'
  );

  let transmitted: { rows: { clientRowId: string; imageUrl: string }[] } | undefined;
  await page.route('**/admin/api/v1/alcohols/bulk', async (route) => {
    transmitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 200,
        data: { createdRows: 2, rows: [], validation: {} },
        errors: [],
        meta: {},
      }),
    });
  });
  const urls = [await firstImage.getAttribute('src'), await secondImage.getAttribute('src')];
  await page.getByRole('button', { name: '최종 전송', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: '등록', exact: true }).click();
  await expect(page.getByText('위스키 2건을 등록했습니다.').first()).toBeVisible();
  expect(transmitted?.rows.map((row) => row.imageUrl)).toEqual(urls);
  expect(JSON.parse(await stateField.inputValue())).toMatchObject({
    canSubmit: false,
    createdRows: 2,
  });
  await expect(page.getByRole('button', { name: '최종 전송', exact: true })).toBeDisabled();
});

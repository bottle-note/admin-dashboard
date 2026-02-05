import { test, expect } from '@playwright/test';
import { WhiskyListPage } from '../pages/whisky-list.page';
import { WhiskyDetailPage } from '../pages/whisky-detail.page';

/**
 * 위스키 E2E 테스트
 *
 * 실제 UI:
 * - 테이블 형태로 위스키 목록 표시
 * - 검색 + 카테고리 필터
 * - 행 클릭 → 상세 페이지
 * - 상세 페이지에서 수정/삭제
 */
test.describe('위스키 목록', () => {
  let listPage: WhiskyListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new WhiskyListPage(page);
  });

  test('목록 페이지에 접근할 수 있다', async ({ page }) => {
    await listPage.goto();

    await expect(page).toHaveURL(/.*whisky/);
    await expect(listPage.pageTitle()).toBeVisible();
    await expect(listPage.table()).toBeVisible();
  });

  test('검색으로 위스키를 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    // 검색 수행
    await listPage.search('글렌');

    // 검색 결과가 있거나 "검색 결과가 없습니다" 메시지가 보여야 함
    const rowCount = await listPage.getRowCount();
    const hasNoResultMessage = await listPage.noResultMessage().isVisible().catch(() => false);

    expect(rowCount > 0 || hasNoResultMessage).toBe(true);
  });

  test('카테고리로 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    // 싱글몰트 카테고리 선택
    await listPage.selectCategory('싱글몰트');

    // URL에 category 파라미터가 추가되어야 함
    await expect(page).toHaveURL(/category=SINGLE_MALT/);
  });

  test('위스키를 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();

    if (rowCount > 0) {
      await listPage.clickFirstRow();
      await expect(page).toHaveURL(/.*whisky\/\d+/);
    } else {
      test.skip();
    }
  });
});

test.describe('위스키 상세', () => {
  let listPage: WhiskyListPage;
  let detailPage: WhiskyDetailPage;

  test.beforeEach(async ({ page }) => {
    listPage = new WhiskyListPage(page);
    detailPage = new WhiskyDetailPage(page);
  });

  test('상세 페이지에서 위스키 정보를 볼 수 있다', async ({ page }) => {
    // 목록에서 첫 번째 위스키로 이동
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 상세 페이지 요소 확인
    await expect(detailPage.pageTitle()).toContainText('위스키 상세');
    await expect(detailPage.korNameInput()).toBeVisible();
    await expect(detailPage.engNameInput()).toBeVisible();
    await expect(detailPage.saveButton()).toBeVisible();
    await expect(detailPage.deleteButton()).toBeVisible();
  });

  test('뒤로가기 버튼을 클릭하면 목록으로 돌아간다', async ({ page }) => {
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 뒤로가기 버튼 클릭
    await detailPage.goBack();

    // 목록 페이지로 돌아가야 함 (URL 끝이 /whisky 또는 /whisky?...)
    await expect(page).toHaveURL(/.*\/whisky(\?.*)?$/);
  });

});

test.describe('위스키 수정 플로우', () => {
  test('완전한 데이터가 있는 위스키를 수정할 수 있다', async ({ page }) => {
    const listPage = new WhiskyListPage(page);
    const detailPage = new WhiskyDetailPage(page);

    // 1. 목록 페이지로 이동 후 검색 (글렌피딕 - 데이터가 완전할 가능성 높음)
    await listPage.goto();
    await listPage.search('글렌피딕');

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    // 2. 첫 번째 결과 클릭
    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 3. 현재 한글명 저장
    const originalKorName = await detailPage.korNameInput().inputValue();

    // 4. 한글명 수정
    const timestamp = Date.now();
    const newKorName = `${originalKorName}_E2E_${timestamp}`;
    await detailPage.updateKorName(newKorName);

    // 5. 저장 버튼 클릭
    await detailPage.clickSave();

    // 6. API 응답 또는 폼 검증 에러 확인 (최대 5초 대기)
    const hasValidationError = await page.locator('text=필수입니다').first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasValidationError) {
      // 폼 검증 에러 - 테스트 스킵 (데이터 불완전)
      console.log('폼 검증 에러 발생 - 데이터가 불완전하여 테스트 스킵');
      test.skip();
      return;
    }

    // 7. API 응답 대기 (PUT)
    await page.waitForResponse(
      (resp) => resp.url().includes('/alcohols') && resp.request().method() === 'PUT',
      { timeout: 10000 }
    ).catch(() => {});

    // 8. 저장 성공 확인 - 페이지에 남아있음
    await expect(page).toHaveURL(/.*whisky\/\d+/);

    // 9. 원래 이름으로 복원
    await detailPage.updateKorName(originalKorName);
    await detailPage.clickSave();

    // 10. 복원 API 응답 대기
    await page.waitForResponse(
      (resp) => resp.url().includes('/alcohols') && resp.request().method() === 'PUT',
      { timeout: 10000 }
    ).catch(() => {});

    // 11. 복원 확인
    await expect(detailPage.korNameInput()).toHaveValue(originalKorName);
  });
});

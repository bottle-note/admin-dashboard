import { test, expect } from '@playwright/test';
import { BannerListPage } from '../pages/banner-list.page';
import { BannerDetailPage } from '../pages/banner-detail.page';

/**
 * 배너 E2E 테스트
 *
 * 실제 UI:
 * - 테이블 형태로 배너 목록 표시
 * - 검색 + 배너 타입 필터
 * - 행 클릭 → 상세 페이지
 * - 순서 변경 모드에서 드래그 앤 드롭
 */

test.describe('배너 목록', () => {
  let listPage: BannerListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new BannerListPage(page);
  });

  test('목록 페이지에 접근할 수 있다', async ({ page }) => {
    await listPage.goto();

    await expect(page).toHaveURL(/.*banners/);
    await expect(listPage.pageTitle()).toBeVisible();
    await expect(listPage.table()).toBeVisible();
  });

  test('검색으로 배너를 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    await listPage.search('테스트');

    const rowCount = await listPage.getRowCount();
    const hasNoResultMessage = await listPage.noResultMessage().isVisible().catch(() => false);

    expect(rowCount > 0 || hasNoResultMessage).toBe(true);
  });

  test('배너 타입으로 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    // 광고 타입 필터 선택
    await listPage.selectTypeFilter('광고');
    await expect(page).toHaveURL(/bannerType=AD/);

    // 큐레이션 타입 필터 선택
    await listPage.selectTypeFilter('큐레이션');
    await expect(page).toHaveURL(/bannerType=CURATION/);

    // 전체로 다시 선택
    await listPage.selectTypeFilter('전체');
    await expect(page).not.toHaveURL(/bannerType=/);
  });

  test('배너를 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();

    if (rowCount > 0) {
      await listPage.clickFirstRow();
      await expect(page).toHaveURL(/.*banners\/\d+/);
    } else {
      test.skip();
    }
  });

  test('배너 등록 버튼을 클릭하면 등록 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    await listPage.clickCreate();

    await expect(page).toHaveURL(/.*banners\/new/);
  });
});

test.describe('배너 상세', () => {
  let listPage: BannerListPage;
  let detailPage: BannerDetailPage;

  test.beforeEach(async ({ page }) => {
    listPage = new BannerListPage(page);
    detailPage = new BannerDetailPage(page);
  });

  test('상세 페이지에서 배너 정보를 볼 수 있다', async ({ page }) => {
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 상세 페이지 요소 확인
    await expect(detailPage.pageTitle()).toContainText('배너 수정');
    await expect(detailPage.nameInput()).toBeVisible();
    await expect(detailPage.bannerTypeSelect()).toBeVisible();
    await expect(detailPage.isActiveSwitch()).toBeVisible();
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

    await detailPage.goBack();

    await expect(page).toHaveURL(/.*\/banners(\?.*)?$/);
  });
});

test.describe('배너 폼 리셋', () => {
  test('상세 페이지에서 등록 페이지로 이동하면 폼이 초기화된다', async ({ page }) => {
    const listPage = new BannerListPage(page);
    const detailPage = new BannerDetailPage(page);

    // 1. 목록에서 배너 선택
    await listPage.goto();
    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 2. 현재 폼 값 저장
    const originalName = await detailPage.nameInput().inputValue();
    expect(originalName).not.toBe('');

    // 3. 배너 등록 페이지로 직접 이동
    await page.goto('/banners/new');
    await detailPage.waitForLoadingComplete();

    // 4. URL 확인
    await expect(page).toHaveURL(/.*banners\/new/);

    // 5. 폼이 비어있어야 함
    await expect(detailPage.nameInput()).toHaveValue('', { timeout: 5000 });
  });
});

test.describe('배너 CRUD 플로우', () => {
  const testBannerName = `테스트배너_${Date.now()}`;
  const updatedBannerName = `${testBannerName}_수정됨`;

  test('배너 생성 → 수정 → 삭제 전체 플로우', async ({ page }) => {
    const listPage = new BannerListPage(page);
    const detailPage = new BannerDetailPage(page);

    // 1. 목록 페이지 이동
    await page.goto('/banners');
    await listPage.waitForLoadingComplete();

    // 2. 배너 등록 버튼 클릭
    await listPage.clickCreate();
    await expect(page).toHaveURL(/.*banners\/new/);

    // 3. 폼 입력 (필수 필드)
    await detailPage.fillBasicInfo({
      name: testBannerName,
      bannerType: '설문조사',
    });

    // 3-1. 이미지 업로드 (필수)
    await detailPage.uploadTestImage();

    // 3-2. 상시 노출 체크 (날짜 필수이므로)
    await detailPage.checkAlwaysVisible();

    // 3-3. 외부 URL 설정
    await detailPage.setTargetUrl('https://example.com', true);

    // 4. 등록 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/banners') && resp.request().method() === 'POST',
        { timeout: 10000 }
      ),
      detailPage.clickSave(),
    ]);

    // 5. 저장 성공 확인 (생성 후에는 상세 페이지로 리다이렉트)
    await expect(page).toHaveURL(/.*banners\/\d+/, { timeout: 10000 });
    await detailPage.waitForLoadingComplete();

    // 6. 폼 수정
    await detailPage.updateName(updatedBannerName);

    // 7. 저장 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/banners/') && resp.request().method() === 'PUT',
        { timeout: 10000 }
      ),
      detailPage.clickSave(),
    ]);

    // 8. 삭제 버튼 클릭
    await detailPage.clickDelete();

    // 9. AlertDialog가 열릴 때까지 대기
    await detailPage.deleteDialog().waitFor({ state: 'visible', timeout: 5000 });

    // 10. 삭제 확인 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/banners/') && resp.request().method() === 'DELETE',
        { timeout: 10000 }
      ),
      detailPage.confirmDelete(),
    ]);

    // 11. 목록으로 리다이렉트 확인
    await expect(page).toHaveURL(/.*banners$/, { timeout: 10000 });
  });
});

test.describe('배너 순서 변경', () => {
  let listPage: BannerListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new BannerListPage(page);
  });

  test('순서 변경 버튼을 클릭하면 순서 변경 모드로 진입한다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.enterReorderMode();

    await expect(listPage.reorderModeBanner()).toBeVisible();
    await expect(listPage.reorderButton()).toContainText('순서 변경 완료');

    const handleCount = await listPage.getDragHandleCount();
    expect(handleCount).toBeGreaterThan(0);
  });

  test('순서 변경 모드에서는 행 클릭으로 상세 페이지 이동이 안 된다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.enterReorderMode();

    await listPage.tableRows().first().click();

    // URL이 변경되지 않아야 함
    await expect(page).toHaveURL(/.*banners$/);
  });

  test('순서 변경 완료 버튼을 클릭하면 일반 모드로 돌아간다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.enterReorderMode();
    await expect(listPage.reorderModeBanner()).toBeVisible();

    await listPage.exitReorderMode();

    await expect(listPage.reorderModeBanner()).not.toBeVisible();
    await expect(listPage.reorderButton()).toContainText('순서 변경');
    await expect(listPage.reorderButton()).not.toContainText('완료');
  });

  test('순서 변경 모드에서 드래그하면 sort-order API가 호출된다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount < 2) {
      test.skip();
      return;
    }

    await listPage.enterReorderMode();

    const firstRow = listPage.tableRows().first();
    const secondRow = listPage.tableRows().nth(1);

    const sortOrderPromise = page.waitForResponse(
      (resp) => resp.url().includes('/sort-order') && resp.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    await firstRow.dragTo(secondRow);

    const response = await sortOrderPromise;
    expect(response.ok()).toBe(true);
  });
});

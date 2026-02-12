import { test, expect } from '@playwright/test';
import { CurationListPage } from '../pages/curation-list.page';
import { CurationDetailPage } from '../pages/curation-detail.page';

/**
 * 큐레이션 E2E 테스트
 *
 * 실제 UI:
 * - 테이블 형태로 큐레이션 목록 표시
 * - 검색 + 상태 필터
 * - 행 클릭 → 상세 페이지
 * - 인라인 Switch로 상태 토글
 */

test.describe('큐레이션 목록', () => {
  let listPage: CurationListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new CurationListPage(page);
  });

  test('목록 페이지에 접근할 수 있다', async ({ page }) => {
    await listPage.goto();

    await expect(page).toHaveURL(/.*curations/);
    await expect(listPage.pageTitle()).toBeVisible();
    await expect(listPage.table()).toBeVisible();
  });

  test('검색으로 큐레이션을 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    // 검색 수행
    await listPage.search('추천');

    // 검색 결과가 있거나 "검색 결과가 없습니다" 메시지가 보여야 함
    const rowCount = await listPage.getRowCount();
    const hasNoResultMessage = await listPage.noResultMessage().isVisible().catch(() => false);

    expect(rowCount > 0 || hasNoResultMessage).toBe(true);
  });

  test('상태로 필터링할 수 있다 (활성/비활성)', async ({ page }) => {
    await listPage.goto();

    // 활성 상태 필터 선택
    await listPage.selectStatusFilter('활성');

    // URL에 isActive 파라미터가 추가되어야 함
    await expect(page).toHaveURL(/isActive=true/);

    // 비활성 상태 필터 선택
    await listPage.selectStatusFilter('비활성');
    await expect(page).toHaveURL(/isActive=false/);

    // 전체로 다시 선택
    await listPage.selectStatusFilter('전체');
    // 전체는 isActive 파라미터 없음
    await expect(page).not.toHaveURL(/isActive=/);
  });

  test('큐레이션을 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();

    if (rowCount > 0) {
      await listPage.clickFirstRow();
      await expect(page).toHaveURL(/.*curations\/\d+/);
    } else {
      test.skip();
    }
  });

  test('큐레이션 등록 버튼을 클릭하면 등록 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    await listPage.clickCreate();

    await expect(page).toHaveURL(/.*curations\/new/);
  });

  test('인라인 스위치로 상태를 토글할 수 있다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // 첫 번째 행의 스위치 찾기
    const firstRow = listPage.clickableRows().first();
    const statusSwitch = listPage.statusSwitch(firstRow);

    // 현재 스위치 상태 확인
    const isCurrentlyChecked = await statusSwitch.getAttribute('data-state') === 'checked';
    const expectedNewState = isCurrentlyChecked ? 'unchecked' : 'checked';

    // 스위치 클릭
    await statusSwitch.click();

    // 스위치 상태가 변경될 때까지 대기 (polling)
    await expect(statusSwitch).toHaveAttribute('data-state', expectedNewState, { timeout: 10000 });
  });
});

test.describe('큐레이션 상세', () => {
  let listPage: CurationListPage;
  let detailPage: CurationDetailPage;

  test.beforeEach(async ({ page }) => {
    listPage = new CurationListPage(page);
    detailPage = new CurationDetailPage(page);
  });

  test('상세 페이지에서 큐레이션 정보를 볼 수 있다', async ({ page }) => {
    // 목록에서 첫 번째 큐레이션으로 이동
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 상세 페이지 요소 확인
    await expect(detailPage.pageTitle()).toContainText('큐레이션 수정');
    await expect(detailPage.nameInput()).toBeVisible();
    await expect(detailPage.descriptionTextarea()).toBeVisible();
    await expect(detailPage.displayOrderInput()).toBeVisible();
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

    // 뒤로가기 버튼 클릭
    await detailPage.goBack();

    // 목록 페이지로 돌아가야 함
    await expect(page).toHaveURL(/.*\/curations(\?.*)?$/);
  });
});

test.describe('큐레이션 폼 리셋', () => {
  test('상세 페이지에서 추가 페이지로 이동하면 폼이 초기화된다', async ({ page }) => {
    const listPage = new CurationListPage(page);
    const detailPage = new CurationDetailPage(page);

    // 1. 목록에서 큐레이션 선택
    await listPage.goto();
    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 2. 폼 데이터 로딩 대기 (auto-retrying assertion)
    await expect(detailPage.nameInput()).not.toHaveValue('', { timeout: 10000 });

    // 3. 사이드바에서 "큐레이션 추가" 메뉴 클릭
    // 사이드바 메뉴 구조: 큐레이션 관리 > 큐레이션 추가
    await page.getByRole('button', { name: '큐레이션 관리' }).click();
    await page.getByRole('button', { name: '큐레이션 추가' }).click();

    // 4. URL 확인
    await expect(page).toHaveURL(/.*curations\/new/);
    await detailPage.waitForLoadingComplete();

    // 5. 폼이 비어있어야 함
    await expect(detailPage.nameInput()).toHaveValue('', { timeout: 5000 });
  });
});

test.describe('큐레이션 CRUD 플로우', () => {
  const testCurationName = `테스트큐레이션_${Date.now()}`;
  const updatedCurationName = `${testCurationName}_수정됨`;

  test('큐레이션 생성 → 수정 → 삭제 전체 플로우', async ({ page }) => {
    const listPage = new CurationListPage(page);
    const detailPage = new CurationDetailPage(page);

    // 1. 목록 페이지 이동
    await page.goto('/curations');
    await listPage.waitForLoadingComplete();

    // 2. 큐레이션 등록 버튼 클릭
    await listPage.clickCreate();
    await expect(page).toHaveURL(/.*curations\/new/);

    // 3. 폼 입력 (필수 필드 모두 채우기)
    await detailPage.fillBasicInfo({
      name: testCurationName,
      description: 'E2E 테스트용 큐레이션입니다.',
      displayOrder: 999,
    });

    // 3-1. 위스키 추가 (필수 - 최소 1개, skip 판단을 위해 이미지 업로드보다 먼저)
    const added = await detailPage.addFirstWhiskyBySearch('글렌');
    if (!added) {
      test.skip();
      return;
    }

    // 3-2. 커버 이미지 업로드 (필수)
    await detailPage.uploadTestImage();

    // 4. 등록 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/curations') && resp.request().method() === 'POST',
        { timeout: 10000 }
      ),
      detailPage.clickSave(),
    ]);

    // 5. 저장 성공 확인 (생성 후에는 상세 페이지로 리다이렉트)
    await expect(page).toHaveURL(/.*curations\/\d+/, { timeout: 10000 });
    await detailPage.waitForLoadingComplete();

    // 6. 폼 수정
    await detailPage.updateName(updatedCurationName);

    // 7. 저장 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/curations/') && resp.request().method() === 'PUT',
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
        (resp) => resp.url().includes('/curations/') && resp.request().method() === 'DELETE',
        { timeout: 10000 }
      ),
      detailPage.confirmDelete(),
    ]);

    // 11. 목록으로 리다이렉트 확인
    await expect(page).toHaveURL(/.*curations$/, { timeout: 10000 });
  });
});

test.describe('큐레이션 순서 변경', () => {
  let listPage: CurationListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new CurationListPage(page);
  });

  test('순서 변경 버튼을 클릭하면 순서 변경 모드로 진입한다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    // 순서 변경 모드 진입
    await listPage.enterReorderMode();

    // 순서 변경 모드 안내 배너가 표시됨
    await expect(listPage.reorderModeBanner()).toBeVisible();

    // 버튼 텍스트가 "순서 변경 완료"로 변경됨
    await expect(listPage.reorderButton()).toContainText('순서 변경 완료');

    // 드래그 핸들이 표시됨
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

    // 순서 변경 모드 진입
    await listPage.enterReorderMode();

    // 첫 번째 행 클릭
    await listPage.tableRows().first().click();

    // URL이 변경되지 않아야 함 (상세 페이지로 이동하지 않음)
    await expect(page).toHaveURL(/.*curations$/);
  });

  test('순서 변경 완료 버튼을 클릭하면 일반 모드로 돌아간다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount === 0) {
      test.skip();
      return;
    }

    // 순서 변경 모드 진입
    await listPage.enterReorderMode();
    await expect(listPage.reorderModeBanner()).toBeVisible();

    // 순서 변경 모드 종료
    await listPage.exitReorderMode();

    // 안내 배너가 사라짐
    await expect(listPage.reorderModeBanner()).not.toBeVisible();

    // 버튼 텍스트가 "순서 변경"으로 변경됨
    await expect(listPage.reorderButton()).toContainText('순서 변경');
    await expect(listPage.reorderButton()).not.toContainText('완료');
  });

  test('순서 변경 모드에서 드래그하면 displayOrder API가 호출된다', async ({ page }) => {
    await listPage.goto();

    const rowCount = await listPage.getRowCount();
    if (rowCount < 2) {
      test.skip();
      return;
    }

    // 순서 변경 모드 진입
    await listPage.enterReorderMode();

    // 첫 번째와 두 번째 행 가져오기
    const firstRow = listPage.tableRows().first();
    const secondRow = listPage.tableRows().nth(1);

    // displayOrder API 호출 대기 준비 (PATCH /curations/:id/display-order)
    const displayOrderPromise = page.waitForResponse(
      (resp) => resp.url().includes('/display-order') && resp.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    // 첫 번째 행을 두 번째 행 위치로 드래그
    await firstRow.dragTo(secondRow);

    // API 호출 확인
    const response = await displayOrderPromise;
    expect(response.ok()).toBe(true);
  });
});

test.describe('큐레이션 위스키 관리', () => {
  let listPage: CurationListPage;
  let detailPage: CurationDetailPage;

  test.beforeEach(async ({ page }) => {
    listPage = new CurationListPage(page);
    detailPage = new CurationDetailPage(page);
  });

  test('큐레이션에 위스키를 추가하고 저장할 수 있다', async ({ page }) => {
    // 기존 큐레이션 상세로 이동
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 커버 이미지 없으면 업로드 (필수 필드)
    await detailPage.ensureCoverImage();

    // 현재 위스키 개수 확인
    const initialCount = await detailPage.getWhiskyCount();

    // 위스키 검색
    await detailPage.searchWhisky('글렌');

    // 드롭다운 아이템 대기
    const dropdownList = page.locator('ul.max-h-64');
    const firstOption = dropdownList.locator('li button').first();

    await expect(dropdownList).toBeVisible({ timeout: 10000 });
    const hasOptions = await firstOption.isVisible().catch(() => false);

    if (!hasOptions) {
      test.skip();
      return;
    }

    // 위스키 선택 (로컬 상태에 추가)
    await firstOption.click();

    // 위스키가 로컬 상태에 추가되었는지 확인
    const afterAddCount = await detailPage.getWhiskyCount();
    expect(afterAddCount).toBeGreaterThan(initialCount);

    // 저장 버튼 클릭 (PUT 요청 대기)
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/curations/') && resp.request().method() === 'PUT',
        { timeout: 10000 }
      ),
      detailPage.clickSave(),
    ]);

    // 저장 성공 후 페이지 새로고침하여 서버 상태 확인
    await page.reload();
    await detailPage.waitForLoadingComplete();

    // 서버에 저장된 위스키 개수 확인
    const savedCount = await detailPage.getWhiskyCount();
    expect(savedCount).toBeGreaterThan(initialCount);
  });

  test('큐레이션에서 위스키를 제거하고 저장할 수 있다', async ({ page }) => {
    // 기존 큐레이션 상세로 이동
    await listPage.goto();
    const rowCount = await listPage.getRowCount();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await listPage.clickFirstRow();
    await detailPage.waitForLoadingComplete();

    // 커버 이미지 없으면 업로드 (필수 필드)
    await detailPage.ensureCoverImage();

    // 현재 위스키 개수 확인
    let currentCount = await detailPage.getWhiskyCount();

    // 위스키가 없으면 먼저 추가
    if (currentCount === 0) {
      await detailPage.searchWhisky('글렌');

      const dropdownList = page.locator('ul.max-h-64');
      const firstOption = dropdownList.locator('li button').first();

      await expect(dropdownList).toBeVisible({ timeout: 10000 });
      const hasOptions = await firstOption.isVisible().catch(() => false);

      if (!hasOptions) {
        test.skip();
        return;
      }

      // 위스키 선택 및 저장
      await firstOption.click();
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/curations/') && resp.request().method() === 'PUT',
          { timeout: 10000 }
        ),
        detailPage.clickSave(),
      ]);

      currentCount = await detailPage.getWhiskyCount();
    }

    // 첫 번째 위스키의 제거 버튼 클릭
    const firstWhiskyItem = detailPage.whiskyList().first();
    const removeButton = firstWhiskyItem.getByRole('button');
    await removeButton.click();

    // 로컬 상태에서 제거되었는지 확인
    const afterRemoveCount = await detailPage.getWhiskyCount();
    expect(afterRemoveCount).toBeLessThan(currentCount);

    // 저장 버튼 클릭 (PUT 요청 대기)
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/curations/') && resp.request().method() === 'PUT',
        { timeout: 10000 }
      ),
      detailPage.clickSave(),
    ]);

    // 저장 성공 후 페이지 새로고침하여 서버 상태 확인
    await page.reload();
    await detailPage.waitForLoadingComplete();

    // 서버에 저장된 위스키 개수 확인
    const savedCount = await detailPage.getWhiskyCount();
    expect(savedCount).toBeLessThan(currentCount);
  });
});

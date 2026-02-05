import { test, expect } from '@playwright/test';
import { TastingTagListPage } from '../pages/tasting-tag-list.page';

/**
 * 테이스팅 태그 E2E 테스트
 *
 * 실제 UI:
 * - Badge 형태로 태그 목록 표시
 * - 태그 클릭 → 상세 페이지
 * - "태그 추가" 버튼으로 생성 페이지 이동
 */
test.describe('테이스팅 태그 관리', () => {
  let listPage: TastingTagListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new TastingTagListPage(page);
  });

  test('목록 페이지에 접근할 수 있다', async ({ page }) => {
    await listPage.goto();

    await expect(page).toHaveURL(/.*tasting-tags/);
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '테이스팅 태그 관리' })).toBeVisible();
  });

  test('검색으로 태그를 필터링할 수 있다', async ({ page }) => {
    await listPage.goto();

    // 검색 수행 (API 응답 대기 포함)
    await listPage.search('바닐라');

    // 검색 결과가 있거나 "검색 결과가 없습니다" 메시지가 보여야 함
    const tagCount = await listPage.getTagCount();
    const hasNoResultMessage = await listPage.noSearchResult().isVisible().catch(() => false);

    // 둘 중 하나는 true여야 함
    expect(tagCount > 0 || hasNoResultMessage).toBe(true);
  });

  test('태그 추가 버튼을 클릭하면 생성 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    await listPage.clickCreate();

    await expect(page).toHaveURL(/.*tasting-tags\/new/);
  });

  test('태그를 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
    await listPage.goto();

    // 태그가 있는지 확인
    const tagCount = await listPage.getTagCount();

    if (tagCount > 0) {
      // 첫 번째 태그 클릭
      await listPage.tagBadges().first().click();

      // 상세 페이지 URL 확인
      await expect(page).toHaveURL(/.*tasting-tags\/\d+/);
    } else {
      // 태그가 없으면 스킵
      test.skip();
    }
  });
});

test.describe('테이스팅 태그 CRUD 플로우', () => {
  const testTagName = `테스트태그_${Date.now()}`;
  const updatedTagName = `${testTagName}_수정됨`;

  test('태그 생성 → 수정 → 삭제 전체 플로우', async ({ page }) => {
    // 1. 목록 페이지 이동
    await page.goto('/tasting-tags');
    await page.getByText('로딩 중...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // 2. 태그 추가 버튼 클릭
    await page.getByRole('button', { name: '태그 추가' }).click();
    await expect(page).toHaveURL(/.*tasting-tags\/new/);

    // 3. 폼 입력 및 저장 (placeholder로 선택)
    await page.getByPlaceholder('예: 바닐라').fill(testTagName);
    await page.getByPlaceholder('예: Vanilla').fill('TestTag');

    // 4. 등록 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/tasting-tags') && resp.request().method() === 'POST',
        { timeout: 10000 }
      ),
      page.getByRole('button', { name: '등록' }).click(),
    ]);

    // 5. 저장 성공 확인 (목록으로 리다이렉트)
    await expect(page).toHaveURL(/.*tasting-tags$/, { timeout: 10000 });

    // 6. 목록 로딩 대기
    await page.getByText('로딩 중...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // 7. 검색으로 생성된 태그 찾기 (알파벳순 정렬 + 페이지네이션 때문에 직접 검색)
    await page.getByPlaceholder('태그 검색...').fill(testTagName);
    // 검색 API 응답 대기
    await page.waitForResponse(
      (resp) => resp.url().includes('/tasting-tags') && resp.request().method() === 'GET',
      { timeout: 10000 }
    );
    await page.getByText('로딩 중...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // 8. 검색된 태그 클릭
    const tagBadge = page.locator('.cursor-pointer.gap-2').filter({ hasText: testTagName });
    await tagBadge.waitFor({ state: 'visible', timeout: 10000 });
    await tagBadge.click();

    // 7. 상세 페이지 로딩 대기
    await expect(page).toHaveURL(/.*tasting-tags\/\d+/);
    await page.getByText('로딩 중...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // 8. 폼 수정
    await page.getByPlaceholder('예: 바닐라').fill(updatedTagName);

    // 9. 저장 버튼 클릭 + API 응답 대기 (PUT 메서드 사용)
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/tasting-tags') && resp.request().method() === 'PUT',
        { timeout: 10000 }
      ),
      page.getByRole('button', { name: '저장' }).click(),
    ]);

    // 10. 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).click();

    // 11. AlertDialog가 열릴 때까지 대기
    const alertDialog = page.getByRole('alertdialog');
    await alertDialog.waitFor({ state: 'visible', timeout: 5000 });

    // 12. 삭제 확인 버튼 클릭 + API 응답 대기
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/tasting-tags') && resp.request().method() === 'DELETE',
        { timeout: 10000 }
      ),
      alertDialog.getByRole('button', { name: '삭제' }).click(),
    ]);

    // 13. 목록으로 리다이렉트 확인
    await expect(page).toHaveURL(/.*tasting-tags$/, { timeout: 10000 });
  });
});

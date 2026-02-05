import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 위스키 목록 페이지 Page Object
 *
 * 실제 UI 구조:
 * - 테이블 형태로 위스키 목록 표시
 * - 검색 입력 + 카테고리 필터 + 검색 버튼
 * - 페이지네이션
 * - 행 클릭 시 상세 페이지로 이동
 */
export class WhiskyListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* ============================================
   * Locators
   * ============================================ */

  /** 페이지 제목 */
  readonly pageTitle = () => this.page.getByRole('heading', { name: '위스키 목록' });

  /** 검색 입력 필드 */
  readonly searchInput = () => this.page.getByPlaceholder('위스키 이름으로 검색...');

  /** 카테고리 필터 드롭다운 트리거 (페이지네이션 드롭다운과 구별) */
  readonly categoryTrigger = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /전체|싱글몰트|블렌디드|버번|라이|기타/ });

  /** 검색 버튼 */
  readonly searchButton = () => this.page.getByRole('button', { name: '검색' });

  /** 테이블 */
  readonly table = () => this.page.locator('table');

  /** 테이블 행들 (헤더 제외) */
  readonly tableRows = () => this.page.locator('tbody tr');

  /** 클릭 가능한 테이블 행 (cursor-pointer) */
  readonly clickableRows = () => this.page.locator('tbody tr.cursor-pointer');

  /** 로딩 상태 */
  readonly loadingState = () => this.page.getByText('로딩 중...');

  /** 검색 결과 없음 메시지 */
  readonly noResultMessage = () => this.page.getByText('검색 결과가 없습니다.');

  /** 특정 위스키 이름을 포함한 행 */
  readonly rowWithName = (name: string) =>
    this.page.locator('tbody tr').filter({ hasText: name });

  /** 페이지네이션 영역 */
  readonly pagination = () => this.page.locator('[class*="pagination"]');

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 페이지로 이동
   */
  async goto() {
    await this.page.goto('/whisky');
    await this.waitForLoadingComplete();
  }

  /**
   * 로딩 완료 대기
   */
  async waitForLoadingComplete() {
    await this.loadingState().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  /**
   * 검색 수행 (Enter 키)
   */
  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.searchInput().press('Enter');
    // API 응답 대기
    await this.page.waitForResponse(
      (response) => response.url().includes('/alcohols') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    await this.waitForLoadingComplete();
  }

  /**
   * 검색 버튼 클릭으로 검색 수행
   */
  async searchWithButton(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.searchButton().click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/alcohols') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    await this.waitForLoadingComplete();
  }

  /**
   * 카테고리 필터 선택
   */
  async selectCategory(category: string) {
    await this.categoryTrigger().click();
    await this.page.getByRole('option', { name: category }).click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/alcohols') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    await this.waitForLoadingComplete();
  }

  /**
   * 첫 번째 행 클릭
   */
  async clickFirstRow() {
    await this.clickableRows().first().click();
  }

  /**
   * 특정 위스키 이름 행 클릭
   */
  async clickRowByName(name: string) {
    await this.rowWithName(name).click();
  }

  /**
   * 테이블 행 개수 반환
   */
  async getRowCount() {
    return await this.clickableRows().count();
  }
}

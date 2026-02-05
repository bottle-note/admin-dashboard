import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 큐레이션 목록 페이지 Page Object
 *
 * 실제 UI 구조:
 * - 테이블 형태로 큐레이션 목록 표시
 * - 검색 + 상태 필터 (전체/활성/비활성)
 * - 행 클릭 시 상세 페이지로 이동
 * - 인라인 Switch로 활성화 상태 토글
 */
export class CurationListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* ============================================
   * Locators
   * ============================================ */

  /** 페이지 제목 */
  readonly pageTitle = () => this.page.getByRole('heading', { name: '큐레이션 관리' });

  /** 검색 입력 필드 */
  readonly searchInput = () => this.page.getByPlaceholder('큐레이션명으로 검색...');

  /** 검색 버튼 */
  readonly searchButton = () => this.page.getByRole('button', { name: '검색' });

  /** 큐레이션 등록 버튼 */
  readonly createButton = () => this.page.getByRole('button', { name: '큐레이션 등록' });

  /** 상태 필터 드롭다운 트리거 */
  readonly statusFilterTrigger = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /전체|활성|비활성/ });

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

  /** 특정 큐레이션명을 포함한 행 */
  readonly rowWithName = (name: string) =>
    this.page.locator('tbody tr').filter({ hasText: name });

  /**
   * 특정 행의 상태 토글 스위치
   * @param rowLocator - tableRows() 또는 rowWithName()으로 얻은 행 Locator
   */
  readonly statusSwitch = (rowLocator: ReturnType<typeof this.rowWithName>) =>
    rowLocator.locator('button[role="switch"]');

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 페이지로 이동
   */
  async goto() {
    await this.page.goto('/curations');
    await this.waitForLoadingComplete();
  }

  /**
   * 로딩 완료 대기
   */
  async waitForLoadingComplete() {
    await this.loadingState().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * 검색 수행 (Enter 키)
   */
  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.searchInput().press('Enter');
    // Mock API delay 대기
    await this.page.waitForTimeout(500);
    await this.waitForLoadingComplete();
  }

  /**
   * 검색 버튼 클릭으로 검색 수행
   */
  async searchWithButton(keyword: string) {
    await this.searchInput().fill(keyword);
    await this.searchButton().click();
    // Mock API delay 대기
    await this.page.waitForTimeout(500);
    await this.waitForLoadingComplete();
  }

  /**
   * 상태 필터 선택
   * @param status - 전체|활성|비활성
   */
  async selectStatusFilter(status: '전체' | '활성' | '비활성') {
    await this.statusFilterTrigger().click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
    // Mock API delay 대기
    await this.page.waitForTimeout(500);
    await this.waitForLoadingComplete();
  }

  /**
   * 큐레이션 등록 버튼 클릭
   */
  async clickCreate() {
    await this.createButton().click();
  }

  /**
   * 첫 번째 행 클릭
   */
  async clickFirstRow() {
    await this.clickableRows().first().click();
  }

  /**
   * 특정 큐레이션명 행 클릭
   */
  async clickRowByName(name: string) {
    await this.rowWithName(name).click();
  }

  /**
   * 테이블 행 개수 반환
   */
  async getRowCount() {
    const noResult = await this.noResultMessage().isVisible().catch(() => false);
    if (noResult) return 0;
    return await this.clickableRows().count();
  }

  /**
   * 특정 행의 상태 토글
   */
  async toggleStatus(rowLocator: ReturnType<typeof this.rowWithName>) {
    const switchBtn = this.statusSwitch(rowLocator);
    await switchBtn.click();
  }

  /**
   * 특정 큐레이션이 목록에 있는지 확인
   */
  async expectCurationExists(name: string) {
    await this.rowWithName(name).waitFor({ state: 'visible' });
  }

  /**
   * 특정 큐레이션이 목록에 없는지 확인
   */
  async expectCurationNotExists(name: string) {
    await this.rowWithName(name).waitFor({ state: 'hidden' });
  }
}

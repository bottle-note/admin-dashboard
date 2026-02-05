import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 테이스팅 태그 목록 페이지 Page Object
 *
 * 실제 UI 구조:
 * - Badge 형태로 태그 목록 표시 (flex 컨테이너 내 cursor-pointer 요소들)
 * - 각 Badge 클릭 시 상세 페이지로 이동
 */
export class TastingTagListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* ============================================
   * Locators
   * ============================================ */

  /** 검색 입력 필드 */
  readonly searchInput = () => this.page.getByPlaceholder('태그 검색...');

  /** 태그 추가 버튼 */
  readonly createButton = () => this.page.getByRole('button', { name: '태그 추가' });

  /** 태그 Badge들 (cursor-pointer 클래스로 식별) */
  readonly tagBadges = () => this.page.locator('.cursor-pointer.gap-2');

  /** 특정 이름의 태그 Badge */
  readonly tagBadge = (tagName: string) =>
    this.page.locator('.cursor-pointer.gap-2').filter({ hasText: tagName });

  /** 빈 상태 메시지 */
  readonly emptyState = () => this.page.getByText('등록된 태그가 없습니다.');

  /** 검색 결과 없음 메시지 */
  readonly noSearchResult = () => this.page.getByText('검색 결과가 없습니다.');

  /** 로딩 상태 */
  readonly loadingState = () => this.page.getByText('로딩 중...');

  /** 태그 목록 컨테이너 */
  readonly tagContainer = () => this.page.locator('.flex.flex-wrap.gap-2');

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 페이지로 이동
   */
  async goto() {
    await this.page.goto('/tasting-tags');
    await this.waitForLoadingComplete();
  }

  /**
   * 로딩 완료 대기 (로딩 텍스트 사라질 때까지)
   */
  async waitForLoadingComplete() {
    await this.loadingState().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * 검색 수행
   */
  async search(keyword: string) {
    await this.searchInput().fill(keyword);
    // API 응답 대기
    await this.page.waitForResponse(
      (response) => response.url().includes('/tasting-tags') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    await this.waitForLoadingComplete();
  }

  /**
   * 태그 추가 버튼 클릭
   */
  async clickCreate() {
    await this.createButton().click();
  }

  /**
   * 특정 태그 클릭 (상세 페이지 이동)
   */
  async clickTag(tagName: string) {
    await this.tagBadge(tagName).click();
  }

  /**
   * 특정 태그가 목록에 있는지 확인
   */
  async expectTagExists(tagName: string) {
    await this.tagBadge(tagName).waitFor({ state: 'visible' });
  }

  /**
   * 특정 태그가 목록에 없는지 확인
   */
  async expectTagNotExists(tagName: string) {
    await this.tagBadge(tagName).waitFor({ state: 'hidden' });
  }

  /**
   * 태그 개수 확인
   */
  async getTagCount() {
    return await this.tagBadges().count();
  }
}

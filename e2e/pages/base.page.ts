import { type Page, type Locator } from '@playwright/test';

/**
 * 모든 Page Object의 기본 클래스
 * 공통 locator와 액션 정의
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /* ============================================
   * 공통 Locators
   * ============================================ */

  /** 사이드바 */
  readonly sidebar = () => this.page.getByRole('navigation');

  /** 헤더 */
  readonly header = () => this.page.getByRole('banner');

  /** 메인 콘텐츠 영역 */
  readonly main = () => this.page.getByRole('main');

  /** 토스트 메시지 */
  readonly toast = () => this.page.getByRole('status');

  /** 로딩 스피너 */
  readonly loading = () => this.page.getByRole('progressbar');

  /* ============================================
   * 공통 Actions
   * ============================================ */

  /**
   * 사이드바 메뉴 클릭
   */
  async clickSidebarMenu(menuName: string) {
    await this.sidebar().getByRole('link', { name: menuName }).click();
  }

  /**
   * 로딩 완료 대기
   */
  async waitForLoadingComplete() {
    await this.loading().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * 토스트 메시지 확인
   */
  async expectToast(message: string) {
    await this.toast().filter({ hasText: message }).waitFor({ state: 'visible' });
  }

  /**
   * 페이지 제목 확인
   */
  async expectPageTitle(title: string) {
    await this.page.getByRole('heading', { name: title, level: 1 }).waitFor();
  }
}

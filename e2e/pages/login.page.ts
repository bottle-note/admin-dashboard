import { type Page } from '@playwright/test';

/**
 * 로그인 페이지 Page Object
 */
export class LoginPage {
  constructor(private page: Page) {}

  /* ============================================
   * Locators
   * ============================================ */

  /** 이메일 입력 필드 */
  readonly emailInput = () => this.page.getByLabel('이메일');

  /** 비밀번호 입력 필드 */
  readonly passwordInput = () => this.page.getByLabel('비밀번호');

  /** 로그인 버튼 */
  readonly loginButton = () => this.page.getByRole('button', { name: '로그인' });

  /** 에러 메시지 */
  readonly errorMessage = () => this.page.getByRole('alert');

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 로그인 페이지로 이동
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * 로그인 수행
   */
  async login(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
  }

  /**
   * 로그인 성공 후 대시보드 대기 (Dashboard는 루트 경로 '/')
   */
  async expectLoginSuccess() {
    await this.page.waitForURL(/.*\/$/, { timeout: 10000 });
  }

  /**
   * 로그인 실패 메시지 확인
   */
  async expectLoginError(message?: string) {
    if (message) {
      await this.errorMessage().filter({ hasText: message }).waitFor();
    } else {
      await this.errorMessage().waitFor();
    }
  }
}

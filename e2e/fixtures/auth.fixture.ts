import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/**
 * 인증 관련 fixture
 * 로그인 페이지 객체와 인증 헬퍼 제공
 */
export const test = base.extend<{
  loginPage: LoginPage;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect };

/**
 * 인증 상태 저장 경로
 */
export const AUTH_FILE = 'e2e/.auth/user.json';

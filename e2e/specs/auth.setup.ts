import { test as setup, expect } from '@playwright/test';
import { loadEnv } from 'vite';
import { AUTH_FILE } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';

// .env에서 테스트 계정 정보 로드 (ensure-env.sh가 생성한 .env 파일)
const env = loadEnv('', process.cwd(), '');

/**
 * 인증 Setup
 * 로그인 후 인증 상태를 파일로 저장하여 다른 테스트에서 재사용
 *
 * 필요한 환경변수:
 * - VITE_E2E_TEST_ID: 테스트 계정 이메일
 * - VITE_E2E_TEST_PW: 테스트 계정 비밀번호
 */
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 환경 변수에서 테스트 계정 정보 가져오기
  const email = env.VITE_E2E_TEST_ID;
  const password = env.VITE_E2E_TEST_PW;

  if (!email || !password) {
    throw new Error(
      'E2E 테스트 계정 정보가 없습니다. ' +
      '.env 파일에 VITE_E2E_TEST_ID, VITE_E2E_TEST_PW를 설정하세요.'
    );
  }

  await loginPage.goto();
  await loginPage.login(email, password);

  // 로그인 성공 확인 (Dashboard는 루트 경로 '/')
  await expect(page).toHaveURL(/.*\/$/);

  // 인증 상태 저장
  await page.context().storageState({ path: AUTH_FILE });
});

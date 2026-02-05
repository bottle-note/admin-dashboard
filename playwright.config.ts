import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */

// .env 파일에서 환경변수 로드 (ensure-env.sh가 생성한 .env 파일)
const env = loadEnv('', process.cwd(), '');

export default defineConfig({
  testDir: './e2e/specs',

  /* 병렬 실행 */
  fullyParallel: true,

  /* CI에서 retry */
  retries: process.env.CI ? 2 : 0,

  /* CI에서 worker 수 제한 */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter 설정 */
  reporter: [
    ['html', { outputFolder: 'e2e/reports' }],
    ['list'],
  ],

  /* 공통 설정 */
  use: {
    /* 개발 서버 URL */
    baseURL: 'http://localhost:5173',

    /* 실패 시 trace 수집 */
    trace: 'on-first-retry',

    /* 실패 시 스크린샷 */
    screenshot: 'only-on-failure',

    /* 비디오 (CI에서만) */
    video: process.env.CI ? 'on-first-retry' : 'off',
  },

  /* 프로젝트 (브라우저) 설정 */
  projects: [
    /* 인증 setup */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* Chromium 테스트 */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* 인증 상태 사용 */
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* 개발 서버 자동 시작 */
  webServer: {
    command: 'pnpm dev:local',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...env,
    },
  },
});

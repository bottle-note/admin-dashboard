import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MERGE_E2E_BASE_URL ?? 'http://localhost:5174';
const url = new URL(baseURL);
if (
  url.protocol !== 'http:' ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  url.username ||
  url.password
) {
  throw new Error('병합 읽기 E2E는 실행 중인 로컬 HTTP 서버 주소가 필요합니다.');
}

// 기존 서버를 사용하고 로그인 상태를 파일로 저장하는 공용 setup은 실행하지 않는다.
export default defineConfig({
  testDir: './e2e/specs',
  testMatch: 'whisky-merge.spec.ts',
  outputDir: 'e2e/test-results/whisky-merge',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    storageState: { cookies: [], origins: [] },
  },
  projects: [
    {
      name: 'merge-readonly',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
});

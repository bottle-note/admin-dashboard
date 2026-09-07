import { test, expect } from '@playwright/test';

function inclusiveDays(from: string, to: string) {
  return Math.floor((Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000)) + 1;
}

test.describe('통계 시계열', () => {
  test('대시보드는 한국 시간 기준 최근 7일 통계를 표시한다', async ({ page }) => {
    const activeResponse = page.waitForResponse((response) =>
      response.url().includes('/statistics/visitors/active')
    );
    const retentionResponse = page.waitForResponse((response) =>
      response.url().includes('/statistics/visitors/retention')
    );

    await page.goto('/');
    const [active, retention] = await Promise.all([activeResponse, retentionResponse]);

    expect(active.status()).toBe(200);
    expect(retention.status()).toBe(200);

    const activeUrl = new URL(active.url());
    expect(activeUrl.searchParams.get('granularity')).toBe('DAY');
    expect(
      inclusiveDays(activeUrl.searchParams.get('from')!, activeUrl.searchParams.get('to')!)
    ).toBe(7);

    await expect(page.getByText('방문자 DAU', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('회원 DAU', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('재방문율', { exact: true }).first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });

  test('방문자 통계는 조회 버튼을 누를 때만 조건을 적용한다', async ({ page }) => {
    const visitorRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/statistics/visitors/')) {
        visitorRequests.push(request.url());
      }
    });

    const initialActive = page.waitForResponse((response) =>
      response.url().includes('/statistics/visitors/active')
    );
    const initialRetention = page.waitForResponse((response) =>
      response.url().includes('/statistics/visitors/retention')
    );
    await page.goto('/statistics/visitors');
    await Promise.all([initialActive, initialRetention]);

    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}/);
    await expect(page).toHaveURL(/to=\d{4}-\d{2}-\d{2}/);
    await expect(page).toHaveURL(/granularity=DAY/);

    const beforeChange = visitorRequests.length;
    await page.getByRole('combobox', { name: '집계 단위' }).click();
    await page.getByRole('option', { name: '주간' }).click();
    await page.waitForTimeout(300);
    expect(visitorRequests).toHaveLength(beforeChange);

    const weeklyActive = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/active') &&
        new URL(response.url()).searchParams.get('granularity') === 'WEEK'
    );
    const weeklyRetention = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/retention') &&
        new URL(response.url()).searchParams.get('granularity') === 'WEEK'
    );
    await page.getByRole('button', { name: '조회', exact: true }).click();
    const [active, retention] = await Promise.all([weeklyActive, weeklyRetention]);

    expect(active.status()).toBe(200);
    expect(retention.status()).toBe(200);
    await expect(page).toHaveURL(/granularity=WEEK/);
    await expect(page.getByText('방문자 WAU', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('회원 WAU', { exact: true }).first()).toBeVisible();
  });

  test('위스키 인기도 통계는 상세 패널을 펼칠 때 처음 조회한다', async ({ page }) => {
    const alcoholStatisticsRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/statistics/alcohols/')) {
        alcoholStatisticsRequests.push(request.url());
      }
    });

    await page.goto('/whisky');
    await page
      .getByText('로딩 중...')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const firstRow = page.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      test.skip();
      return;
    }
    await firstRow.click();
    await expect(page).toHaveURL(/\/whisky\/\d+/);
    await page
      .getByText('로딩 중...')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const trigger = page.getByRole('button', { name: /인기도 추이/ });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await page.waitForTimeout(300);
    expect(alcoholStatisticsRequests).toHaveLength(0);

    const popularityResponse = page.waitForResponse((response) =>
      response.url().includes('/statistics/alcohols/') && response.url().includes('/popularity')
    );
    const interestResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/INTEREST')
    );
    await trigger.click();
    const [popularity, interest] = await Promise.all([popularityResponse, interestResponse]);

    expect(popularity.status()).toBe(200);
    expect(interest.status()).toBe(200);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('whisky-popularity-panel')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);

    const beforeGranularityChange = alcoholStatisticsRequests.length;
    await page.getByRole('combobox', { name: '인기도 집계 단위' }).click();
    await page.getByRole('option', { name: '월간' }).click();
    await page.waitForTimeout(300);
    expect(alcoholStatisticsRequests).toHaveLength(beforeGranularityChange);

    const monthlyPopularity = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/popularity') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    const monthlyObservation = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/INTEREST') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    await page.getByRole('button', { name: '조회', exact: true }).click();
    const [popularityByMonth, observationByMonth] = await Promise.all([
      monthlyPopularity,
      monthlyObservation,
    ]);
    expect(popularityByMonth.status()).toBe(200);
    expect(observationByMonth.status()).toBe(200);
  });
});

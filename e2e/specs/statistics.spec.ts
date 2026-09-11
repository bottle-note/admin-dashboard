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
    await expect(page.getByText('재방문율', { exact: true }).first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });

  test('방문자 통계는 직접 조회와 빠른 기간을 각각 올바른 버킷으로 적용한다', async ({ page }) => {
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
    await page.getByRole('option', { name: '주별' }).click();
    await expect(page.getByRole('button', { name: '주 범위 선택' })).toBeVisible();
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

    await page.getByRole('combobox', { name: '집계 단위' }).click();
    await page.getByRole('option', { name: '월별' }).click();
    await expect(page.getByLabel('시작 월')).toBeVisible();
    await expect(page.getByLabel('종료 월')).toBeVisible();

    const monthlyActive = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/active') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    const monthlyRetention = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/retention') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    await page.getByRole('button', { name: '조회', exact: true }).click();
    await Promise.all([monthlyActive, monthlyRetention]);
    await expect(page).toHaveURL(/granularity=MONTH/);
    await expect(page.getByText('방문자 MAU', { exact: true }).first()).toBeVisible();

    const quickActive = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/active') &&
        new URL(response.url()).searchParams.get('granularity') === 'WEEK' &&
        inclusiveDays(
          new URL(response.url()).searchParams.get('from')!,
          new URL(response.url()).searchParams.get('to')!
        ) === 30
    );
    const quickRetention = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/retention') &&
        new URL(response.url()).searchParams.get('granularity') === 'WEEK' &&
        inclusiveDays(
          new URL(response.url()).searchParams.get('from')!,
          new URL(response.url()).searchParams.get('to')!
        ) === 30
    );
    await page.getByRole('button', { name: '최근 30일', exact: true }).click();
    await Promise.all([quickActive, quickRetention]);
    await expect(page).toHaveURL(/granularity=WEEK/);
    await expect(page).toHaveURL(/preset=30/);
    await expect(page.getByRole('button', { name: '최근 30일', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByText('방문자 WAU', { exact: true }).first()).toBeVisible();

    await page.getByRole('combobox', { name: '집계 단위' }).click();
    await page.getByRole('option', { name: '월별' }).click();
    await expect(page.getByRole('button', { name: '최근 30일', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    const longRangeActive = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/active') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH' &&
        inclusiveDays(
          new URL(response.url()).searchParams.get('from')!,
          new URL(response.url()).searchParams.get('to')!
        ) === 90
    );
    const longRangeRetention = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/visitors/retention') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH' &&
        inclusiveDays(
          new URL(response.url()).searchParams.get('from')!,
          new URL(response.url()).searchParams.get('to')!
        ) === 90
    );
    await page.getByRole('button', { name: '최근 90일', exact: true }).click();
    await Promise.all([longRangeActive, longRangeRetention]);
    await expect(page).toHaveURL(/granularity=MONTH/);
    await expect(page).toHaveURL(/preset=90/);
    await expect(page.getByText('방문자 MAU', { exact: true }).first()).toBeVisible();
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

    const popularityResponse = page.waitForResponse(
      (response) =>
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

  test('주류 통계는 개별 분석과 주류 비교의 URL 상태를 조회한다', async ({ page }) => {
    const alcoholStatisticsRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/statistics/alcohols/')) {
        alcoholStatisticsRequests.push(request.url());
      }
    });

    await page.goto('/statistics/alcohols');
    await expect(page.getByText('조회할 주류를 선택하면 통계 차트가 표시됩니다.')).toBeVisible();
    await page.waitForTimeout(300);
    expect(alcoholStatisticsRequests).toHaveLength(0);

    await page.getByRole('combobox', { name: '주류 검색' }).focus();
    await expect(page.getByText('한 글자 이상 입력하면 검색 결과가 표시됩니다.')).toBeVisible();

    const lookupResponse = page.waitForResponse((response) =>
      response.url().includes('/alcohols/lookup')
    );
    await page.getByRole('combobox', { name: '주류 검색' }).fill('글렌');
    expect((await lookupResponse).status()).toBe(200);

    const searchResults = page
      .getByTestId('alcohol-statistics-search-dropdown')
      .getByRole('button');
    if ((await searchResults.count()) === 0) {
      test.skip();
      return;
    }

    const popularityResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') && response.url().includes('/popularity')
    );
    await searchResults.first().click();
    const popularity = await popularityResponse;

    expect(popularity.status()).toBe(200);
    await expect(page).toHaveURL(/alcoholId=\d+/);
    await expect(page.getByText('인기도 · 점수', { exact: true })).toBeVisible();
    await expect(page.getByText('인기도 · 현재값', { exact: true })).toBeVisible();

    const ratingResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/RATING')
    );
    await page.getByRole('combobox', { name: '통계 지표 그룹' }).click();
    await page.getByRole('option', { name: '평가' }).click();
    expect((await ratingResponse).status()).toBe(200);
    await expect(page).toHaveURL(/group=RATING/);

    const monthlyObservation = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/RATING') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    await page.getByRole('combobox', { name: '주류 통계 집계 단위' }).click();
    await page.getByRole('option', { name: '월간' }).click();
    await page.getByRole('button', { name: '조회', exact: true }).click();
    expect((await monthlyObservation).status()).toBe(200);
    await expect(page).toHaveURL(/granularity=MONTH/);
    await page.getByRole('tab', { name: '주류 비교' }).click();
    await expect(page).toHaveURL(/mode=compare/);
    const comparisonResults = page
      .getByTestId('alcohol-statistics-search-dropdown')
      .getByRole('button');
    for (let count = 2; count <= 3; count += 1) {
      await page.getByRole('combobox', { name: '주류 검색' }).fill('글렌');
      await expect(comparisonResults.first()).toBeVisible();
      const compareResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/statistics/alcohols/') &&
          response.url().includes('/observations/RATING')
      );
      await comparisonResults.first().click();
      expect((await compareResponse).status()).toBe(200);
      await expect
        .poll(() => new URL(page.url()).searchParams.get('ids')?.split(',').length)
        .toBe(count);
    }
    await expect(page.getByRole('combobox', { name: '주류 검색' })).toBeDisabled();
    await page.getByRole('combobox', { name: '비교 지표' }).click();
    await page.getByRole('option', { name: '평균 평점', exact: true }).click();
    await expect(page).toHaveURL(/metric=averageRating/);
    const comparisonUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(comparisonUrl);
    await expect(page.getByText('평가 · 평균 평점 비교', { exact: true })).toBeVisible();
    await expect(page.locator('.recharts-legend-item')).toHaveCount(3);
    const legendColors = () =>
      page
        .locator('.recharts-legend-item')
        .evaluateAll((items) =>
          Object.fromEntries(
            items.map((item) => [
              item.textContent,
              item.querySelector('path')?.getAttribute('stroke'),
            ])
          )
        );
    const beforeColors = await legendColors();
    expect(new Set(Object.values(beforeColors)).size).toBe(3);
    await page.getByRole('button', { name: / ×$/ }).first().click();
    await expect(page.locator('.recharts-legend-item')).toHaveCount(2);
    await expect(page.getByRole('combobox', { name: '주류 검색' })).toBeEnabled();
    const afterColors = await legendColors();
    for (const [name, color] of Object.entries(afterColors)) expect(color).toBe(beforeColors[name]);
    await page.getByRole('tab', { name: '개별 분석' }).click();
    await expect(page).toHaveURL(/alcoholId=\d+/);
    await expect(page.getByText('평가 · 평균 평점', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });
});

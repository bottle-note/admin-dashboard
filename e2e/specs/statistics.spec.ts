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
    const activePayload = (await active.json()).data;
    for (const series of activePayload.series.filter((item: { key: string }) =>
      ['visitors', 'members'].includes(item.key)
    )) {
      await expect(
        page.locator('.recharts-legend-item').filter({ hasText: series.label })
      ).toBeVisible();
    }
    await expect(page.locator('.recharts-area')).toHaveCount(0);
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
    const [initialVisitorResponse] = await Promise.all([initialActive, initialRetention]);
    const activePayload = (await initialVisitorResponse.json()).data;
    for (const series of activePayload.series.filter((item: { key: string }) =>
      ['visitors', 'members'].includes(item.key)
    )) {
      await expect(
        page.locator('.recharts-legend-item').filter({ hasText: series.label })
      ).toBeVisible();
    }
    await expect(page.locator('.recharts-area')).toHaveCount(0);

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
    await trigger.click();
    expect((await popularityResponse).status()).toBe(200);
    await expect(page.getByRole('heading', { name: '인기도 점수', exact: true })).toBeVisible();
    await expect(page.getByText('인기도 원본 수치', { exact: true })).toHaveCount(0);
    await expect(page.getByText('관찰 지표', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: '관찰 기준' })).toHaveCount(0);
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
    await page.getByRole('button', { name: '조회', exact: true }).click();
    expect((await monthlyPopularity).status()).toBe(200);
    expect(alcoholStatisticsRequests.some((url) => url.includes('/observations/'))).toBe(false);
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
    await expect(page.getByRole('button', { name: '최근 7일', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '최근 30일', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '최근 90일', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '주 범위 선택' })).toBeVisible();
    await page.waitForTimeout(300);
    expect(alcoholStatisticsRequests).toHaveLength(0);

    await page.getByRole('button', { name: '최근 7일', exact: true }).click();
    await expect(page).toHaveURL(/granularity=HOUR/);
    await expect(page).toHaveURL(/preset=7/);
    await expect(page.getByLabel('주류 통계 시작일')).toBeVisible();
    await page.getByRole('button', { name: '최근 30일', exact: true }).click();
    await expect(page).toHaveURL(/granularity=WEEK/);
    await expect(page).toHaveURL(/preset=30/);
    await expect(page.getByRole('button', { name: '주 범위 선택' })).toBeVisible();
    expect(alcoholStatisticsRequests).toHaveLength(0);

    const initialLookupResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/alcohols/lookup') &&
        new URL(response.url()).searchParams.get('keyword') === ''
    );
    const searchInput = page.getByRole('combobox', { name: '주류 검색' });
    await searchInput.focus();
    expect((await initialLookupResponse).status()).toBe(200);
    await expect(page.getByTestId('alcohol-statistics-search-results')).toBeVisible();

    await searchInput.dispatchEvent('compositionstart');
    await searchInput.fill('글렌');
    await searchInput.press('Enter');
    expect(new URL(page.url()).searchParams.has('keyword')).toBe(false);
    await searchInput.dispatchEvent('compositionend', { data: '렌' });
    await expect(searchInput).toHaveValue('글렌');
    await expect(searchInput).toBeFocused();
    expect(new URL(page.url()).searchParams.has('keyword')).toBe(false);
    const lookupResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/alcohols/lookup') &&
        new URL(response.url()).searchParams.get('keyword') === '글렌'
    );
    await searchInput.press('Enter');
    expect((await lookupResponse).status()).toBe(200);

    const searchResults = page
      .getByTestId('alcohol-statistics-search-results')
      .getByRole('button', { name: /주류 선택$/ });
    await expect(searchResults.first()).toBeVisible();

    const interestResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/INTEREST')
    );
    await searchResults.first().click();
    const interest = await interestResponse;

    expect(interest.status()).toBe(200);
    await expect(page).toHaveURL(/alcoholId=\d+/);
    await expect(page.getByText('조회 지표', { exact: true })).toBeVisible();
    await expect(page.locator('.recharts-bar')).toHaveCount(1);
    await searchInput.focus();
    await expect(searchResults.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/keyword=/);
    const interestData = (await interest.json()).data;
    const summary = page.getByTestId('alcohol-observation-summary');
    const views = interestData.points.reduce(
      (total: number, point: { values: Record<string, number> }) => total + point.values.viewCount,
      0
    );
    await expect(
      summary
        .getByText('기간 조회 수', { exact: true })
        .locator('..')
        .getByText(`${views.toLocaleString('ko-KR')}회`, { exact: true })
    ).toBeVisible();

    const popularitySeriesResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') && response.url().includes('/popularity')
    );
    await page.getByRole('tab', { name: '인기도', exact: true }).click();
    const popularityData = (await (await popularitySeriesResponse).json()).data;
    await expect(page.getByText('인기도 지수', { exact: true })).toBeVisible();
    await expect(page.getByText('인기도 · 기간 조회 수', { exact: true })).toHaveCount(0);
    await expect(page.getByText('인기도 · 현재값', { exact: true })).toHaveCount(0);
    await expect(page.locator('.recharts-line')).toHaveCount(1);
    const closedPopularityPoints = popularityData.points.filter(
      (point: { partial: boolean; values: Record<string, number | null> }) =>
        !point.partial && typeof point.values.popularityScore === 'number'
    );
    const lastClosedPopularity =
      closedPopularityPoints[closedPopularityPoints.length - 1]?.values.popularityScore;
    if (typeof lastClosedPopularity === 'number') {
      await expect(page.getByTestId('alcohol-popularity-score')).toHaveText(
        `${(lastClosedPopularity * 100).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}점`
      );
    }
    await page.getByRole('button', { name: '관심도', exact: true }).click();
    await expect(page.getByRole('button', { name: '관심도', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('.recharts-line')).toHaveCount(2);

    const ratingResponse = page.waitForResponse((response) =>
      response.url().includes('/observations/RATING')
    );
    await page.getByRole('tab', { name: '평가', exact: true }).click();
    const ratingData = (await (await ratingResponse).json()).data;
    await expect(page).toHaveURL(/group=RATING/);
    await expect(page.getByText('평가 지표', { exact: true })).toBeVisible();
    await expect(page.getByText('평점 합', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '평균 평점', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(
      page.locator('.recharts-legend-item').filter({ hasText: '평균 평점' })
    ).toBeVisible();
    const lastRating = ratingData.points[ratingData.points.length - 1]?.values.averageRating;
    if (typeof lastRating === 'number') {
      await expect(page.getByTestId('alcohol-observation-summary')).toContainText(
        `${lastRating.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}점`
      );
    }
    await page.getByRole('button', { name: '평점 수 순증감', exact: true }).click();
    await expect(page.getByRole('button', { name: '평점 수 순증감', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(
      page.locator('.recharts-legend-item').filter({ hasText: '평점 수 순증감' })
    ).toBeVisible();

    const pickResponse = page.waitForResponse((response) =>
      response.url().includes('/observations/PICK')
    );
    await page.getByRole('tab', { name: '찜', exact: true }).click();
    await pickResponse;
    await expect(page.getByText('찜 지표', { exact: true })).toBeVisible();
    await expect(page.getByText('찜 해제 상태 수', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '찜 수', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: '찜 순증감', exact: true }).click();
    await expect(
      page.locator('.recharts-legend-item').filter({ hasText: '찜 순증감' })
    ).toBeVisible();

    const engagementResponse = page.waitForResponse((response) =>
      response.url().includes('/observations/ENGAGEMENT')
    );
    await page.getByRole('tab', { name: '참여', exact: true }).click();
    await engagementResponse;
    await expect(page.getByText('참여 지표', { exact: true })).toBeVisible();
    await expect(page.getByTestId('alcohol-observation-summary')).toContainText('리뷰 수');
    await expect(page.getByRole('button', { name: '리뷰', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('.recharts-legend-item')).toHaveCount(1);
    await page.getByRole('button', { name: '좋아요', exact: true }).click();
    await expect(page.locator('.recharts-legend-item')).toHaveCount(2);

    await page.getByRole('tab', { name: '평가', exact: true }).click();

    const monthlyObservation = page.waitForResponse(
      (response) =>
        response.url().includes('/statistics/alcohols/') &&
        response.url().includes('/observations/RATING') &&
        new URL(response.url()).searchParams.get('granularity') === 'MONTH'
    );
    await page.getByRole('combobox', { name: '주류 통계 집계 단위' }).click();
    await page.getByRole('option', { name: '월별' }).click();
    await expect(page.getByLabel('주류 통계 시작 월')).toBeVisible();
    await expect(page.getByLabel('주류 통계 종료 월')).toBeVisible();
    await page.getByRole('button', { name: '조회', exact: true }).click();
    expect((await monthlyObservation).status()).toBe(200);
    await expect(page).toHaveURL(/granularity=MONTH/);
    await page.getByRole('tab', { name: '주류 비교' }).click();
    await expect(page).toHaveURL(/mode=compare/);
    const comparisonResults = page
      .getByTestId('alcohol-statistics-search-results')
      .getByRole('button', { name: /주류 선택$/ });
    for (let count = 2; count <= 3; count += 1) {
      await page.getByRole('combobox', { name: '주류 검색' }).fill('글렌');
      await expect(comparisonResults.first()).toBeVisible();
      const compareResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/statistics/alcohols/') &&
          response.url().includes('/observations/RATING')
      );
      await page
        .getByTestId('alcohol-statistics-search-results')
        .locator('button[aria-pressed="false"]')
        .first()
        .click();
      expect((await compareResponse).status()).toBe(200);
      await expect
        .poll(() => new URL(page.url()).searchParams.get('ids')?.split(',').length)
        .toBe(count);
    }
    await searchInput.click();
    await expect(
      page
        .getByTestId('alcohol-statistics-search-results')
        .locator('button[aria-pressed="false"]')
        .first()
    ).toBeDisabled();
    await page.getByRole('combobox', { name: '비교 지표' }).click();
    await page.getByRole('option', { name: '평균 평점', exact: true }).click();
    await expect(page).toHaveURL(/metric=averageRating/);
    const comparisonUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(comparisonUrl);
    await expect(page.getByText('평가 · 평균 평점 비교', { exact: true })).toBeVisible();
    await expect(page.locator('.recharts-legend-item')).toHaveCount(3);
    await expect(page.getByRole('button', { name: /^주류 \d+ ×$/ })).toHaveCount(0);
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
    await expect(page.getByText('평가 지표', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: '평균 평점', exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });
});

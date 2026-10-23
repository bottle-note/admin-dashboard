import { test, expect } from '@playwright/test';

test.use({
  storageState: { cookies: [], origins: [] },
  hasTouch: true,
  trace: 'off',
  video: 'off',
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
});

test('개발 시나리오 저장·재조회·7단계 분기·스킵과 반응형 화면', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(
    !process.env.SCENARIO_QA_GROUP_ID,
    '공유 개발 데이터 검증은 대상 그룹을 명시한 경우에만 실행한다.'
  );
  const groupId = process.env.SCENARIO_QA_GROUP_ID!;
  const email = process.env.VITE_E2E_TEST_ID;
  const password = process.env.VITE_E2E_TEST_PW;
  if (!email || !password) throw new Error('개발 E2E 계정 환경변수가 필요합니다.');
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/alcohol-attributes?tab=scenario');
  const list = page.waitForResponse(
    (r) =>
      r.request().method() === 'GET' && r.url().endsWith(`/attribute/groups/${groupId}/scenarios`)
  );
  await page.getByLabel('시나리오 속성 그룹').selectOption(groupId);
  const body: { data: { id: number }[] } = await (await list).json();
  const resuming = process.env.SCENARIO_QA_SCENARIO_ID;
  if (resuming) {
    expect(body.data.map((item) => item.id)).toContain(Number(resuming));
    const detail = page.waitForResponse(
      (r) => r.request().method() === 'GET' && r.url().endsWith(`/scenarios/${resuming}`)
    );
    if (body.data[0]?.id !== Number(resuming))
      throw new Error('재개할 시나리오를 첫 탭으로 선택해야 합니다.');
    await detail;
    await page.getByRole('button', { name: '질문 설정', exact: true }).click();
  } else {
    expect(body.data, '기존 시나리오를 덮어쓰지 않도록 빈 그룹에서만 생성한다.').toHaveLength(0);
    await page.getByRole('button', { name: '시나리오 추가', exact: true }).click();
    await expect(page.getByText('아직 설정한 속성과 질문이 없습니다.')).toBeVisible();
    const rows = [
      { source: '얼마나 드셔보셨나요?', title: '얼마나 드셔보셨나요?', stage: 1 },
      { source: '잔 참고 가격', title: '한 잔에 얼마 정도 생각하세요?', stage: 2 },
      { source: '위스키 종류', title: '어떤 종류를 원하세요?', stage: 3 },
      { source: '향 그룹', title: '어떤 향이 좋으세요?', stage: 4 },
      { source: '어떻게 마실까요?', title: '어떻게 마실까요?', stage: 4 },
      { source: '도수', title: '어느 정도 도수를 원하세요?', stage: 4 },
      { source: '인지도 선호', title: '어느 쪽을 더 선호하세요?', stage: 5 },
      { source: '어떻게 마실까요?', title: '마시는 방식을 골라주세요.', stage: 6 },
      { source: '도수', title: '마지막으로 도수를 정해주세요.', stage: 7 },
    ];
    for (const [index, row] of rows.entries()) {
      const number = index + 1;
      await page.getByRole('button', { name: '질문 추가', exact: true }).click();
      await page
        .getByLabel(`질문 ${number} 속성`, { exact: true })
        .selectOption({ label: row.source });
      await page.getByLabel(`질문 ${number} 문구`, { exact: true }).fill(row.title);
      await page.getByLabel(`질문 ${number} 단계`, { exact: true }).fill(String(row.stage));
      if (number === 2) {
        await page.getByLabel('질문 2 max', { exact: true }).fill('100000');
        await page.getByLabel('질문 2 step', { exact: true }).fill('1000');
      }
    }
    const question = (index: number) =>
      page.locator('form[aria-label="시나리오 질문 설정"] > fieldset > fieldset').nth(index - 1);
    async function rule(
      number: number,
      index: number,
      operator: string,
      label: string | null,
      target: string
    ) {
      await question(number).getByRole('button', { name: '이동 조건 추가' }).click();
      await page
        .getByLabel(`질문 ${number} 이동 조건 ${index} 비교`, { exact: true })
        .selectOption(operator);
      if (label !== null)
        await page
          .getByLabel(`질문 ${number} 이동 조건 ${index} 답변`, { exact: true })
          .selectOption({ label });
      await page
        .getByLabel(`질문 ${number} 이동 조건 ${index} 이동`, { exact: true })
        .selectOption({ label: target });
    }
    await rule(1, 1, 'EQ', '다양하게 마셔봤어요', '3단계 · 어떤 종류를 원하세요?');
    await rule(3, 1, 'EQ', '싱글몰트', '4단계 · 어떤 향이 좋으세요?');
    await rule(3, 2, 'EQ', '버번', '4단계 · 어떻게 마실까요?');
    await rule(3, 3, 'ALWAYS', null, '4단계 · 어느 정도 도수를 원하세요?');
    await rule(5, 1, 'ALWAYS', null, '6단계 · 마시는 방식을 골라주세요.');
  }
  const save = page.waitForResponse(
    (r) => r.request().method() === 'PUT' && /\/scenarios\/\d+\/versions\/\d+$/.test(r.url())
  );
  await page.getByRole('button', { name: '시나리오 저장', exact: true }).click();
  const response = await save;
  const saved = await response.json();
  expect(response.status(), JSON.stringify(saved.errors)).toBe(200);
  expect(saved.data.definition.questions).toHaveLength(9);
  expect(saved.data.definition.stages).toHaveLength(7);
  expect(saved.data.definition.questions.every((q: { id: number }) => q.id > 0)).toBe(true);
  await expect(
    page.getByRole('heading', { name: '얼마나 드셔보셨나요?', exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: '질문 4 분기' })).toBeVisible();
  await expect(page.getByText('질문 4-1', { exact: true })).toBeVisible();
  await expect(page.getByText('질문 4-2', { exact: true })).toBeVisible();
  await expect(page.getByText('질문 4-3', { exact: true })).toBeVisible();
  const card = (name: string) =>
    page.locator('fieldset').filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card('얼마나 드셔보셨나요?')
    .getByRole('button', { name: /다양하게 마셔봤어요/ })
    .click();
  await expect(card('어떤 종류를 원하세요?')).not.toHaveAttribute('disabled', '');
  await expect(card('한 잔에 얼마 정도 생각하세요?')).toHaveAttribute('disabled', '');
  await page.getByRole('button', { name: '처음부터', exact: true }).click();
  await card('얼마나 드셔보셨나요?')
    .getByRole('button', { name: '상관없어요', exact: true })
    .click();
  await card('한 잔에 얼마 정도 생각하세요?')
    .getByRole('button', { name: '상관없어요', exact: true })
    .click();
  await card('어떤 종류를 원하세요?')
    .getByRole('button', { name: /버번 ·/ })
    .click();
  await card('어떻게 마실까요?').getByRole('button', { name: '상관없어요', exact: true }).click();
  await expect(card('마시는 방식을 골라주세요.')).not.toHaveAttribute('disabled', '');
  await expect(card('어느 쪽을 더 선호하세요?')).toHaveAttribute('disabled', '');
  await card('마시는 방식을 골라주세요.')
    .getByRole('button', { name: '상관없어요', exact: true })
    .click();
  await card('마지막으로 도수를 정해주세요.')
    .getByRole('button', { name: '상관없어요', exact: true })
    .click();
  await expect(page.getByText('시나리오가 완료되었습니다.')).toBeVisible();
  await card('어떤 종류를 원하세요?')
    .getByRole('button', { name: /싱글몰트 ·/ })
    .click();
  await expect(card('어떤 향이 좋으세요?')).not.toHaveAttribute('disabled', '');
  await expect(card('마시는 방식을 골라주세요.')).toHaveAttribute('disabled', '');
  await card('어떤 향이 좋으세요?')
    .getByRole('button', { name: '상관없어요', exact: true })
    .click();
  await expect(card('어느 쪽을 더 선호하세요?')).not.toHaveAttribute('disabled', '');
  for (const [width, height] of [
    [375, 812],
    [812, 375],
    [768, 1024],
    [1023, 800],
    [1024, 800],
    [1280, 800],
    [2257, 1266],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator('main').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `가로 넘침 ${width}×${height}`
    ).toBe(true);
    await page.screenshot({ path: `/tmp/bottlenote scenario ${width}x${height}.png` });
    const branches = page.getByRole('region', { name: '질문 4 분기' });
    await branches.scrollIntoViewIfNeeded();
    await branches.locator('[data-stage-node]').last().scrollIntoViewIfNeeded();
    const contained = await branches
      .locator('.scenario-stage-branches')
      .evaluate(async (element) => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        element.scrollLeft = element.scrollWidth;
        const viewport = element.getBoundingClientRect();
        const card = element.lastElementChild!.getBoundingClientRect();
        return card.left >= viewport.left - 1 && card.right <= viewport.right + 1;
      });
    expect(contained, `마지막 분기 카드 잘림 ${width}×${height}`).toBe(true);
    await expect(branches.getByText('질문 4-3', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    await page.screenshot({ path: `/tmp/bottlenote branches ${width}x${height}.png` });
    if (width === 375) {
      await card('어느 쪽을 더 선호하세요?')
        .getByRole('button', { name: '상관없어요', exact: true })
        .tap();
      await expect(card('마시는 방식을 골라주세요.')).not.toHaveAttribute('disabled', '');
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const splitter = page.getByRole('separator', { name: '질문 패널 너비' });
  await splitter.focus();
  await page.keyboard.press('End');
  await expect(splitter).toHaveAttribute('aria-valuenow', '75');
  await page.keyboard.press('Home');
  await expect(splitter).toHaveAttribute('aria-valuenow', '35');
});

test('저장된 시나리오의 답변 변경·추천 근거·스킵 안내를 읽기 전용으로 확인한다', async ({
  page,
}) => {
  test.setTimeout(180_000);
  test.skip(
    !process.env.SCENARIO_QA_SCENARIO_ID || !process.env.SCENARIO_QA_GROUP_ID,
    '기존 개발 시나리오와 그룹을 명시해야 한다.'
  );
  const email = process.env.VITE_E2E_TEST_ID;
  const password = process.env.VITE_E2E_TEST_PW;
  if (!email || !password) throw new Error('개발 E2E 계정 환경변수가 필요합니다.');
  const errors: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/preview') && response.status() >= 400)
      errors.push(`preview HTTP ${response.status()}`);
  });
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(
    `/alcohol-attributes?tab=scenario&scenarioGroupId=${process.env.SCENARIO_QA_GROUP_ID}&scenarioId=${process.env.SCENARIO_QA_SCENARIO_ID}`
  );
  const card = (name: string) =>
    page.locator('fieldset').filter({ has: page.getByRole('heading', { name, exact: true }) });
  const choose = async (title: string, name: RegExp | string) => {
    await card(title)
      .getByRole('button', { name, exact: typeof name === 'string' })
      .click();
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    await choose('얼마나 드셔보셨나요?', /한두 번 마셔봤어요/);
    await card('한 잔에 얼마 정도 생각하세요?')
      .getByLabel('한 잔에 얼마 정도 생각하세요? 최댓값', { exact: true })
      .fill('20000');
    await choose('한 잔에 얼마 정도 생각하세요?', '범위 적용');
    await choose('어떤 종류를 원하세요?', /버번 ·/);
    await choose('어떻게 마실까요?', /하이볼로 마실래요/);
    await expect(
      card('어느 쪽을 더 선호하세요?').getByText('현재 답변에 따라 건너뛴 질문입니다.')
    ).toBeVisible();
    await choose('마시는 방식을 골라주세요.', /하이볼로 마실래요/);
    await choose('마지막으로 도수를 정해주세요.', '상관없어요');
    await expect(page.getByText('시나리오가 완료되었습니다.')).toBeVisible();
    const result = page.getByRole('region', { name: '추천 후보' });
    await expect(result.getByText('적용한 답변')).toBeVisible();
    await expect(result.getByText(/잔 참고 가격: [\d,]+원/).first()).toBeVisible();
    await expect(result.getByText('어떻게 마실까요?: 그대로 마실래요')).toHaveCount(0);
    await choose('얼마나 드셔보셨나요?', /다양하게 마셔봤어요/);
    await expect(
      card('한 잔에 얼마 정도 생각하세요?').getByText('현재 답변에 따라 건너뛴 질문입니다.')
    ).toBeVisible();
    await choose('어떤 종류를 원하세요?', '상관없어요');
    await choose('어느 정도 도수를 원하세요?', '상관없어요');
    await choose('어느 쪽을 더 선호하세요?', '상관없어요');
    await choose('마시는 방식을 골라주세요.', '상관없어요');
    await card('마지막으로 도수를 정해주세요.')
      .getByLabel('마지막으로 도수를 정해주세요. 최솟값', { exact: true })
      .fill('99');
    await choose('마지막으로 도수를 정해주세요.', '범위 적용');
    await expect(result.getByText('조건에 맞는 위스키가 없습니다.')).toBeVisible();
    await expect(result.getByText(/가격·도수 범위를 넓히거나/)).toBeVisible();
    await choose('마지막으로 도수를 정해주세요.', '상관없어요');
    await expect(result.getByText('조건에 맞는 위스키가 없습니다.')).toHaveCount(0);
    await page.getByRole('button', { name: '처음부터', exact: true }).click();
  }
  for (const [width, height] of [
    [375, 812],
    [812, 375],
    [768, 1024],
    [1023, 800],
    [1024, 800],
    [1280, 800],
    [2257, 1266],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('region', { name: '추천 후보' }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    await page.screenshot({ path: `/tmp/scenario QA fix ${width}x${height}.png` });
  }
  expect(errors).toEqual([]);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

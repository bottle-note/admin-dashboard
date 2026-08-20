import { test, expect } from '@playwright/test';

import { CurationPage, type CurationCode } from '../pages/curation.page';

const ENTRY_TYPES: Array<{ code: CurationCode; label: string }> = [
  { code: 'WHISKY_TASTING_EVENT', label: '시음회' },
  { code: 'PROGRAM', label: '프로그램' },
  { code: 'RECOMMENDED_WHISKY', label: '일반 큐레이션' },
  { code: 'WHISKY_PAIRING', label: '페어링 · 위스키 → 음식' },
];

test.describe('큐레이션 Entry', () => {
  test('네 가지 큐레이션 유형을 선택하고 미리보기를 확인할 수 있다', async ({ page }) => {
    const curationPage = new CurationPage(page);
    await curationPage.gotoEntry();

    for (const type of ENTRY_TYPES) {
      await expect(page.getByRole('button', { name: `${type.label} 작성하기` })).toBeVisible();
      await page.getByRole('button', { name: `${type.label} 미리보기` }).click();
      await expect(page.getByText(`${type.label} 미리보기 선택됨`, { exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: '시음회 작성하기' }).click();
    await expect(page).toHaveURL(/\/dashboard\/curations\/new\?code=WHISKY_TASTING_EVENT/);
  });
});

test.describe('code별 큐레이션 폼', () => {
  test('시음회 핵심 필드와 미리보기가 동작한다', async ({ page }) => {
    const curationPage = new CurationPage(page);
    const testName = createTestName('시음회');

    await curationPage.gotoCreate('WHISKY_TASTING_EVENT');
    await expect(page.getByText('날짜 및 장소', { exact: true })).toBeVisible();
    await expect(page.getByText('참가 정보', { exact: true })).toBeVisible();
    await expect(page.getByText('라인업', { exact: true })).toBeVisible();

    await curationPage.fillCommonFields(testName);
    await curationPage.field('eventDate').fill('2027-12-20');
    await curationPage.field('eventTime').fill('19:30');
    await expect(curationPage.field('placeName')).toHaveAttribute('readonly', '');
    await expect(curationPage.field('barAddress')).toHaveAttribute('readonly', '');
    await curationPage.field('capacity').fill('10');
    await page.getByRole('checkbox', { name: '모집 인원 미정' }).click();
    await expect(curationPage.field('capacity')).toHaveValue('0');
    await expect(curationPage.field('capacity')).toBeDisabled();
    await page.getByRole('checkbox', { name: '모집 인원 미정' }).click();
    await expect(curationPage.field('capacity')).toBeEnabled();
    await curationPage.field('entryFee').fill('10000');

    await expect(curationPage.field('applicationLink')).toBeDisabled();
    await page.locator('#isRecruiting').click();
    await expect(curationPage.field('applicationLink')).toBeEnabled();
    await curationPage.field('applicationLink').fill('https://example.com/e2e-tasting');

    await curationPage.addManualAlcohol('alcohols', 'E2E 시음 위스키');
    await curationPage.field('alcohols.0.comment').fill('E2E 시음 코멘트');
    await expect(curationPage.preview()).toContainText(testName);
    await expect(curationPage.preview()).toContainText('E2E 시음 위스키');
  });

  test('프로그램의 중첩 필드와 미리보기가 동작한다', async ({ page }) => {
    const curationPage = new CurationPage(page);
    const testName = createTestName('프로그램');

    await curationPage.gotoCreate('PROGRAM');
    await expect(page.getByText('행사 기간 및 장소', { exact: true })).toBeVisible();
    await expect(page.getByText('프로그램 및 이벤트', { exact: true })).toBeVisible();

    await curationPage.fillCommonFields(testName);
    await curationPage.field('eventStartDate').fill('2027-12-20');
    await curationPage.field('eventEndDate').fill('2027-12-21');
    await expect(curationPage.field('placeName')).toHaveAttribute('readonly', '');
    await expect(curationPage.field('address')).toHaveAttribute('readonly', '');
    await page.locator('label[for="programTags-WHISKY"]').click();

    await curationPage.field('programs.0.name').fill('E2E 마스터 클래스');
    await curationPage.field('programs.0.programDate').fill('2027-12-20');
    await curationPage.field('programs.0.startTime').fill('14:00');
    await curationPage.field('programs.0.endTime').fill('15:00');
    await curationPage.field('programs.0.venue').fill('세미나룸 A');
    await curationPage.field('programs.0.host').fill('E2E 호스트');

    await curationPage.addManualAlcohol('programs.0.whiskies', 'E2E 프로그램 위스키');
    await expect(curationPage.preview()).toContainText(testName);
    await expect(curationPage.preview()).toContainText('E2E 마스터 클래스');
  });

  test('추천 위스키 라인업과 미리보기가 동작한다', async ({ page }) => {
    const curationPage = new CurationPage(page);
    const testName = createTestName('추천');

    await curationPage.gotoCreate('RECOMMENDED_WHISKY');
    await expect(page.getByText('라인업', { exact: true })).toBeVisible();

    await curationPage.fillCommonFields(testName);
    await curationPage.addManualAlcohol('alcohols', 'E2E 추천 위스키');
    await curationPage.field('alcohols.0.comment').fill('E2E 추천 코멘트');
    await expect(curationPage.preview()).toContainText(testName);
    await expect(curationPage.preview()).toContainText('E2E 추천 위스키');
  });

  test('위스키 페어링 입력과 미리보기가 동작한다', async ({ page }) => {
    const curationPage = new CurationPage(page);
    const testName = createTestName('페어링');

    await curationPage.gotoCreate('WHISKY_PAIRING');
    await expect(page.getByText('라인업', { exact: true })).toBeVisible();

    await curationPage.fillCommonFields(testName);
    await curationPage.addManualAlcohol('alcohols', 'E2E 페어링 위스키');
    await curationPage.field('alcohols.0.pairings.0.itemName').fill('바닐라 아이스크림');
    await curationPage.field('alcohols.0.pairings.0.pairingNote').fill('E2E 페어링 설명');
    await expect(curationPage.preview()).toContainText(testName);
    await expect(curationPage.preview()).toContainText('바닐라 아이스크림');
  });
});

function createTestName(type: string) {
  return `E2E_${type}_${Date.now()}`;
}

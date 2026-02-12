import { type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { BasePage } from './base.page';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BannerDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators

  readonly pageTitle = () => this.page.getByRole('heading', { level: 1 });

  readonly backButton = () =>
    this.page.locator('main button').first();

  readonly saveButton = () =>
    this.page.getByRole('button', { name: /등록|저장/ });

  readonly deleteButton = () => this.page.getByRole('button', { name: '삭제' });

  readonly loadingState = () => this.page.getByText('로딩 중...');

  readonly nameInput = () => this.page.getByPlaceholder('배너명을 입력하세요');

  readonly bannerTypeSelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /설문조사|큐레이션|광고|제휴|기타|배너 타입 선택/ });

  readonly isActiveSwitch = () => this.page.locator('button#isActive');

  readonly descriptionAInput = () => this.page.getByPlaceholder('첫 번째 줄 설명');

  readonly descriptionBInput = () => this.page.getByPlaceholder('두 번째 줄 설명');

  readonly textPositionSelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /좌측 상단|좌측 하단|우측 상단|우측 하단|중앙|텍스트 위치 선택/ });

  readonly nameFontColorInput = () => this.page.locator('input#nameFontColor');

  readonly descriptionFontColorInput = () => this.page.locator('input#descriptionFontColor');

  readonly targetUrlInput = () => this.page.locator('input#targetUrl');

  readonly isExternalUrlCheckbox = () => this.page.locator('button#isExternalUrl');

  /** CURATION 타입에서만 표시 */
  readonly curationSelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /큐레이션을 선택하세요/ });

  readonly isAlwaysVisibleCheckbox = () => this.page.locator('button#isAlwaysVisible');

  readonly startDateInput = () => this.page.locator('input#startDate');

  readonly endDateInput = () => this.page.locator('input#endDate');

  readonly imageFileInput = () => this.page.locator('input[type="file"][accept="image/*"]');

  readonly uploadedImage = () => this.page.locator('img[alt="업로드된 이미지"]');

  readonly deleteDialog = () => this.page.getByRole('alertdialog');

  readonly confirmDeleteButton = () => this.deleteDialog().getByRole('button', { name: '삭제' });

  // Actions

  async gotoNew() {
    await this.page.goto('/banners/new');
    await this.waitForLoadingComplete();
  }

  async gotoDetail(id: number) {
    await this.page.goto(`/banners/${id}`);
    await this.waitForLoadingComplete();
  }

  async waitForLoadingComplete() {
    await this.loadingState().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  async goBack() {
    await this.backButton().click();
  }

  async clickSave() {
    await this.saveButton().click();
  }

  async clickDelete() {
    await this.deleteButton().click();
  }

  async confirmDelete() {
    await this.deleteDialog().waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmDeleteButton().click();
  }

  async selectBannerType(type: '설문조사' | '큐레이션' | '광고' | '제휴' | '기타') {
    await this.bannerTypeSelect().click();
    await this.page.getByRole('option', { name: type, exact: true }).click();
  }

  async selectTextPosition(position: '좌측 상단' | '좌측 하단' | '우측 상단' | '우측 하단' | '중앙') {
    await this.textPositionSelect().click();
    await this.page.getByRole('option', { name: position, exact: true }).click();
  }

  async fillBasicInfo(data: {
    name: string;
    bannerType?: '설문조사' | '큐레이션' | '광고' | '제휴' | '기타';
    descriptionA?: string;
    descriptionB?: string;
  }) {
    await this.nameInput().fill(data.name);
    if (data.bannerType) {
      await this.selectBannerType(data.bannerType);
    }
    if (data.descriptionA) {
      await this.descriptionAInput().fill(data.descriptionA);
    }
    if (data.descriptionB) {
      await this.descriptionBInput().fill(data.descriptionB);
    }
  }

  async updateName(name: string) {
    await this.nameInput().fill(name);
  }

  async checkAlwaysVisible() {
    const isChecked = await this.isAlwaysVisibleCheckbox().getAttribute('data-state') === 'checked';
    if (!isChecked) {
      await this.isAlwaysVisibleCheckbox().click();
    }
  }

  async setTargetUrl(url: string, isExternal = false) {
    if (isExternal) {
      const isChecked = await this.isExternalUrlCheckbox().getAttribute('data-state') === 'checked';
      if (!isChecked) {
        await this.isExternalUrlCheckbox().click();
      }
    }
    await this.targetUrlInput().fill(url);
  }

  async uploadTestImage() {
    const testImagePath = path.resolve(__dirname, '../fixtures/test-image.png');
    await this.imageFileInput().setInputFiles(testImagePath);
    await this.uploadedImage().waitFor({ state: 'visible', timeout: 10000 });
  }

  async ensureImage() {
    const hasImage = await this.uploadedImage().isVisible().catch(() => false);
    if (!hasImage) {
      await this.uploadTestImage();
    }
  }
}

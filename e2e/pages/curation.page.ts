import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export type CurationCode =
  | 'WHISKY_TASTING_EVENT'
  | 'PROGRAM'
  | 'RECOMMENDED_WHISKY'
  | 'WHISKY_PAIRING';

export class CurationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly field = (name: string): Locator => this.page.locator(`[name="${name}"]`);

  readonly preview = (): Locator => this.page.locator('main aside');

  readonly createButton = (): Locator => this.page.getByRole('button', { name: '등록' });

  async gotoEntry() {
    await this.page.goto('/dashboard/curations/new');
    await this.page
      .getByText('큐레이션 스펙을 불러오는 중입니다.')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});
  }

  async gotoCreate(code: CurationCode) {
    await this.page.goto(`/dashboard/curations/new?code=${code}`);
    await this.createButton().waitFor({ state: 'visible', timeout: 15000 });
  }

  async fillCommonFields(name: string) {
    await this.field('name').fill(name);
    await this.field('description').fill(`${name} E2E 설명`);
    await this.field('displayOrder').fill('0');
  }

  async addManualAlcohol(listName: string, whiskyName: string) {
    await this.page.getByRole('button', { name: '추가', exact: true }).click();
    await this.page.getByRole('button', { name: '직접 입력' }).click();
    await this.field(`${listName}.0.alcohol.korName`).fill(whiskyName);
    await this.field(`${listName}.0.alcohol.engName`).fill('E2E Test Whisky');
  }
}

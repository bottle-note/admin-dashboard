import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 큐레이션 상세 페이지 Page Object
 *
 * 실제 UI 구조:
 * - 기본 정보 카드 (큐레이션명, 설명, 노출순서, 활성상태)
 * - 포함된 위스키 카드 (검색 선택, 위스키 목록)
 * - 커버 이미지 카드
 */
export class CurationDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* ============================================
   * Locators
   * ============================================ */

  /** 페이지 제목 (등록/수정) */
  readonly pageTitle = () => this.page.getByRole('heading', { level: 1 });

  /** 뒤로가기 버튼 (아이콘 전용 버튼 - 헤더 영역의 첫 번째 버튼) */
  readonly backButton = () =>
    this.page.locator('main button').first();

  /** 저장/등록 버튼 */
  readonly saveButton = () =>
    this.page.getByRole('button', { name: /등록|저장/ });

  /** 삭제 버튼 */
  readonly deleteButton = () => this.page.getByRole('button', { name: '삭제' });

  /** 로딩 상태 */
  readonly loadingState = () => this.page.getByText('로딩 중...');

  /* Form Fields */

  /** 큐레이션명 입력 */
  readonly nameInput = () => this.page.getByPlaceholder('큐레이션명을 입력하세요');

  /** 설명 입력 */
  readonly descriptionTextarea = () => this.page.getByPlaceholder('큐레이션에 대한 설명을 입력하세요');

  /** 노출 순서 입력 */
  readonly displayOrderInput = () => this.page.locator('input#displayOrder');

  /** 활성화 상태 스위치 */
  readonly isActiveSwitch = () => this.page.locator('button#isActive');

  /* Cards */

  /** 기본 정보 카드 */
  readonly basicInfoCard = () => this.page.locator('text=기본 정보').locator('..');

  /** 포함된 위스키 카드 */
  readonly whiskyCard = () => this.page.locator('text=포함된 위스키').locator('..');

  /** 커버 이미지 카드 */
  readonly imageCard = () => this.page.locator('text=커버 이미지').locator('..');

  /* Whisky Section */

  /** 위스키 검색 입력 */
  readonly whiskySearchInput = () => this.page.getByPlaceholder('위스키 검색하여 추가...');

  /** 위스키 목록 아이템 */
  readonly whiskyList = () => this.page.locator('ul.space-y-2 li');

  /** 위스키 없음 상태 */
  readonly whiskyEmptyState = () => this.page.getByText('포함된 위스키가 없습니다.');

  /** 특정 위스키의 제거 버튼 */
  readonly whiskyRemoveButton = (whiskyName: string) =>
    this.page.locator('li').filter({ hasText: whiskyName }).getByRole('button');

  /* Delete Dialog */

  /** 삭제 확인 다이얼로그 */
  readonly deleteDialog = () => this.page.getByRole('alertdialog');

  /** 다이얼로그 내 삭제 확인 버튼 */
  readonly confirmDeleteButton = () => this.deleteDialog().getByRole('button', { name: '삭제' });

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 새 큐레이션 등록 페이지로 이동
   */
  async gotoNew() {
    await this.page.goto('/curations/new');
    await this.waitForLoadingComplete();
  }

  /**
   * 특정 큐레이션 상세 페이지로 이동
   */
  async gotoDetail(id: number) {
    await this.page.goto(`/curations/${id}`);
    await this.waitForLoadingComplete();
  }

  /**
   * 로딩 완료 대기
   */
  async waitForLoadingComplete() {
    await this.loadingState().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  /**
   * 뒤로가기
   */
  async goBack() {
    await this.backButton().click();
  }

  /**
   * 저장/등록 버튼 클릭
   */
  async clickSave() {
    await this.saveButton().click();
  }

  /**
   * 삭제 버튼 클릭
   */
  async clickDelete() {
    await this.deleteButton().click();
  }

  /**
   * 삭제 확인 다이얼로그에서 삭제 클릭
   */
  async confirmDelete() {
    await this.deleteDialog().waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmDeleteButton().click();
  }

  /**
   * 기본 정보 폼 입력 (필수/선택 필드)
   */
  async fillBasicInfo(data: {
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    await this.nameInput().fill(data.name);
    if (data.description) {
      await this.descriptionTextarea().fill(data.description);
    }
    if (data.displayOrder !== undefined) {
      await this.displayOrderInput().fill(String(data.displayOrder));
    }
  }

  /**
   * 큐레이션명만 수정
   */
  async updateName(name: string) {
    await this.nameInput().fill(name);
  }

  /**
   * 활성화 상태 토글
   */
  async toggleActive() {
    await this.isActiveSwitch().click();
  }

  /**
   * 위스키 검색 (키워드 입력 + debounce 300ms + API 응답 대기)
   */
  async searchWhisky(keyword: string) {
    await this.whiskySearchInput().fill(keyword);
    // 컴포넌트 debounce (300ms) + API 응답 대기
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/alcohols') && resp.status() === 200,
      { timeout: 10000 }
    ).catch(() => {});
    // 드롭다운 렌더링 대기
    await this.page.waitForTimeout(100);
  }

  /**
   * 위스키 검색 드롭다운 목록 (ul > li > button 구조)
   */
  readonly whiskyDropdownList = () => this.page.locator('ul.max-h-64');

  /**
   * 드롭다운에서 첫 번째 위스키 선택
   */
  async selectFirstWhiskyFromDropdown() {
    const firstOption = this.whiskyDropdownList().locator('li button').first();
    await firstOption.click();
  }

  /**
   * 드롭다운에서 특정 위스키 선택 (이름으로)
   */
  async selectWhiskyFromDropdown(whiskyName: string) {
    await this.whiskyDropdownList().locator('li button').filter({ hasText: whiskyName }).click();
  }

  /**
   * 특정 위스키 제거
   */
  async removeWhisky(whiskyName: string) {
    await this.whiskyRemoveButton(whiskyName).click();
  }

  /**
   * 선택된 위스키 개수 확인
   */
  async getWhiskyCount() {
    const isEmpty = await this.whiskyEmptyState().isVisible().catch(() => false);
    if (isEmpty) return 0;
    return await this.whiskyList().count();
  }
}

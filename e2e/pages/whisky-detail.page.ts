import { type Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 위스키 상세 페이지 Page Object
 *
 * 실제 UI 구조:
 * - 기본 정보 카드 (한글명, 영문명, 카테고리, 지역, 증류소, 도수, 숙성년도, 용량, 캐스크, 설명)
 * - 이미지 업로드 카드
 * - 통계 카드 (수정 모드에서만)
 * - 테이스팅 태그 카드
 * - 연관 키워드 카드
 */
export class WhiskyDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* ============================================
   * Locators
   * ============================================ */

  /** 페이지 제목 (등록/상세) */
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

  /** 한글명 입력 */
  readonly korNameInput = () => this.page.getByPlaceholder('예: 글렌피딕 12년');

  /** 영문명 입력 */
  readonly engNameInput = () => this.page.getByPlaceholder('예: Glenfiddich 12 Years');

  /** 카테고리 선택 트리거 */
  readonly categorySelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /카테고리|싱글몰트|블렌디드|버번|라이|기타/ });

  /** 지역 선택 트리거 */
  readonly regionSelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /지역 선택|스코틀랜드|아일랜드|미국|캐나다|일본/ });

  /** 증류소 선택 트리거 */
  readonly distillerySelect = () =>
    this.page.locator('button[role="combobox"]').filter({ hasText: /증류소 선택/ });

  /** 도수 입력 */
  readonly abvInput = () => this.page.getByPlaceholder('예: 40');

  /** 숙성년도 입력 */
  readonly ageInput = () => this.page.getByPlaceholder('예: 12');

  /** 용량 입력 */
  readonly volumeInput = () => this.page.getByPlaceholder('예: 700ml');

  /** 캐스크 입력 */
  readonly caskInput = () => this.page.getByPlaceholder('예: 아메리칸 오크 & 스패니시 셰리');

  /** 설명 입력 */
  readonly descriptionInput = () => this.page.getByPlaceholder('위스키에 대한 설명을 입력하세요...');

  /* Cards */

  /** 기본 정보 카드 */
  readonly basicInfoCard = () => this.page.locator('text=기본 정보').locator('..');

  /** 이미지 카드 */
  readonly imageCard = () => this.page.locator('text=이미지').locator('..');

  /** 통계 카드 (수정 모드에서만 표시) */
  readonly statsCard = () => this.page.locator('text=통계').locator('..');

  /** 테이스팅 태그 카드 */
  readonly tastingTagCard = () => this.page.locator('text=테이스팅 태그').locator('..');

  /** 삭제 확인 다이얼로그 */
  readonly deleteDialog = () => this.page.getByRole('alertdialog');

  /* ============================================
   * Actions
   * ============================================ */

  /**
   * 새 위스키 등록 페이지로 이동
   */
  async gotoNew() {
    await this.page.goto('/whisky/new');
    await this.waitForLoadingComplete();
  }

  /**
   * 특정 위스키 상세 페이지로 이동
   */
  async gotoDetail(id: number) {
    await this.page.goto(`/whisky/${id}`);
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
    await this.deleteDialog().getByRole('button', { name: '삭제' }).click();
  }

  /**
   * 기본 정보 폼 입력 (모든 필드)
   */
  async fillBasicInfo(data: {
    korName: string;
    engName: string;
    abv: string;
    age: string;
    volume: string;
    cask: string;
    description: string;
  }) {
    await this.korNameInput().fill(data.korName);
    await this.engNameInput().fill(data.engName);
    await this.abvInput().fill(data.abv);
    await this.ageInput().fill(data.age);
    await this.volumeInput().fill(data.volume);
    await this.caskInput().fill(data.cask);
    await this.descriptionInput().fill(data.description);
  }

  /**
   * 한글명만 수정
   */
  async updateKorName(name: string) {
    await this.korNameInput().fill(name);
  }
}

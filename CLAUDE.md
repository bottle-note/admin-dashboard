# Bottlenote Admin Dashboard

위스키 테이스팅 정보 관리를 위한 어드민 대시보드.

## 명령어

```bash
pnpm dev           # 개발 서버 (dev 환경)
pnpm dev:local     # 개발 서버 (로컬 환경)
pnpm build         # 프로덕션 빌드
pnpm test          # Unit/Hook 테스트 (watch)
pnpm test:run      # Unit/Hook 테스트 (단일 실행)
pnpm test:e2e      # E2E 테스트 (Playwright)
pnpm test:e2e:ui   # E2E 테스트 (UI 모드)
pnpm test:all      # 전체 테스트 (Unit + E2E)
pnpm lint          # ESLint 검사
```

## 아키텍처

```
src/
├── components/
│   ├── common/     # 재사용 컴포넌트 (DetailPageHeader, ImageUpload 등)
│   ├── layout/     # 레이아웃 (AdminLayout, Sidebar, Header)
│   └── ui/         # shadcn/ui 프리미티브 (수정 금지)
├── pages/          # 라우트별 페이지 컴포넌트
├── hooks/          # 커스텀 훅 (useApi*, useToast 등)
├── services/       # API 서비스 레이어
├── stores/         # Zustand 스토어
├── types/api/      # API 타입 정의
└── lib/            # 유틸리티 (api-client, axios 설정)
```

## 핵심 패턴

### API 레이어 (3계층)
1. **types/api/*.api.ts** - API 엔드포인트 정의 + 타입
2. **services/*.service.ts** - API 호출 함수 + query keys
3. **hooks/use*.ts** - TanStack Query 훅 래퍼

새 API 추가 시 이 순서로 작성: types → service → hook

### 폼 처리
- React Hook Form + Zod 스키마 사용
- 스키마는 `pages/*/*.schema.ts`에 정의
- `useApiMutation` 훅으로 mutation 처리

### 컴포넌트 구조
```typescript
/**
 * 컴포넌트 설명
 * @param propName - 설명
 */
export interface ComponentProps { ... }

export function Component({ ... }: ComponentProps) { ... }
```

## 구현 워크플로우 (IMPORTANT)

### 자동 TDD 적용
새로운 hook, service, 페이지 작업 시 **테스트 먼저 작성**.

**순서:**
1. `__tests__/` 디렉토리에 테스트 파일 생성
2. 실패하는 테스트 케이스 작성 (최소: 성공 1개, 에러 1개)
3. 구현 코드 작성
4. `pnpm test:run` 실행 및 통과 확인

### 테스트 위치 규칙
| 대상 | 테스트 위치 |
|------|------------|
| hooks/use*.ts | hooks/__tests__/use*.test.ts |
| pages/domain/*.tsx | pages/domain/__tests__/*.test.tsx |
| services/*.service.ts | services/__tests__/*.test.ts |

### 완료 보고 형식
```
✅ [기능명]
- 테스트: [경로] ([N]개 케이스)
- 구현: [경로]
- 결과: PASS
```

### TDD 예외
스타일 수정, 타입만 추가, 설정 변경은 테스트 생략 가능.

## 테스트

### 테스트 계층
```
e2e/specs/           # E2E 테스트 (Playwright) - 유저 플로우
src/pages/__tests__/ # Component 테스트 - 페이지 단위
src/hooks/__tests__/ # Hook 테스트 - API 훅 검증
```

### Unit/Hook 테스트
- MSW로 API 모킹 (`src/test/mocks/`)
- 훅 테스트: `@testing-library/react`의 `renderHook` 사용
- 테스트 유틸: `src/test/test-utils.tsx`

### E2E 테스트 (Playwright)
- Page Object 패턴: `e2e/pages/`
- 인증 fixture: `e2e/fixtures/auth.fixture.ts`
- 개발 서버 자동 시작 (localhost:5173)
- **필수 환경변수:** `VITE_E2E_TEST_ID`, `VITE_E2E_TEST_PW` (테스트 계정)

```bash
pnpm test:e2e        # headless 실행
pnpm test:e2e:ui     # UI 모드 (디버깅)
pnpm test:e2e:headed # 브라우저 표시
```

## 주의사항

- **IMPORTANT:** `src/components/ui/`는 shadcn/ui 생성 파일 - 직접 수정 금지
- **IMPORTANT:** API 타입은 `src/types/api/`에 정의, 다른 곳에 중복 정의 금지
- 환경변수는 `scripts/ensure-env.sh`로 관리됨 - `.env` 직접 수정 금지
- 페이지네이션은 0-based index 사용 (백엔드 API 규격)

## 참고 문서

- API 타입 패턴: `src/types/api/tasting-tag.api.ts` 참조
- 서비스 패턴: `src/services/tasting-tag.service.ts` 참조
- 훅 패턴: `src/hooks/useTastingTags.ts` 참조
- 테스트 패턴: `src/hooks/__tests__/useTastingTags.test.ts` 참조
- E2E 패턴: `e2e/specs/tasting-tags.spec.ts` 참조
- Page Object 패턴: `e2e/pages/tasting-tag-list.page.ts` 참조

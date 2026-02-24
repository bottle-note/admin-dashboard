# Code Review Instructions

You are reviewing a **Vite + React 18 + TypeScript + TanStack Query v5 + Zustand** admin dashboard project.
The app manages whisky tasting platform data (배너, 큐레이션, 위스키, 테이스팅 태그 등).

## Language

- Write all review comments in Korean
- Do not translate technical terms (null check, race condition, stale closure, query key, mutation, refetch 등)

## Review Categories

### 1. Runtime Errors (앱을 중단시키거나 깨뜨리는 버그)

- API 응답 데이터의 null/undefined 접근 처리 누락
- useEffect cleanup 누락으로 인한 메모리 누수 (setTimeout, event listener 등)
- useCallback/useEffect 내 stale closure (outdated state 참조)
- 무한 리렌더 루프 (render 내 setState, 의존성 배열 오류)
- `useSearchParams` 값을 Number 변환 시 NaN 처리 누락

### 2. Data Integrity (잘못된 데이터 표시 또는 유실)

- 잘못된 query key로 인한 stale/incorrect 캐시 데이터
- mutation 후 `queryClient.invalidateQueries` 또는 `refetch` 누락
- TanStack Query 훅의 `data`를 초기값 없이 직접 구조분해 (undefined 가능성)
- URL 파라미터 기반 상태에서 기본값 처리 누락 (`Number(null)` = 0 등 의도치 않은 변환)
- 페이지네이션 `page` 파라미터가 0-based임에도 1-based로 연산

### 3. Auth & Security

- 인증 필요 API 호출 시 auth 토큰 누락
- 사용자 입력을 `dangerouslySetInnerHTML`로 렌더링 (sanitization 없이)
- 토큰/userId 등 민감 정보가 URL 파라미터나 `console.log`에 노출

### 4. Convention Violations (미래 버그를 유발하는 프로젝트 규칙 위반)

**Import & Module:**

- 배럴 파일 import 사용 (`from '@/hooks'` 대신 `from '@/hooks/useBanners'` 직접 import)
- 컴포넌트에서 API를 직접 호출 (fetch/axios) — 반드시 서비스 레이어 경유
- 3계층 API 패턴 순서 위반: `types/api/*.api.ts` → `services/*.service.ts` → `hooks/use*.ts`
  - 컴포넌트가 service를 직접 import하거나 types/api를 건너뛰는 경우

**State Management:**

- 서버 데이터(API 응답)를 Zustand에 저장 — TanStack Query로 관리해야 함
- 검색/필터/페이지네이션 상태를 useState로 관리 — URL 파라미터(`useSearchParams`)로 관리해야 함
- Zustand store에서 auth, sidebar 외 도메인 데이터 저장

**Form:**

- React Hook Form + Zod 없이 수동 `onChange` + `useState`로 폼 처리
- Zod 스키마 없이 수동 유효성 검사
- `FormField` 컴포넌트 미사용으로 에러 메시지 표시 방식 불일치

**File Placement:**

- 테스트 파일이 `__tests__/` 서브디렉토리 외 위치에 작성됨
- Hook 테스트가 `hooks/__tests__/` 아닌 다른 위치에 작성됨
- 새 `index.ts` 배럴 파일 생성 (CLAUDE.md 명시 금지)

**Other:**

- `console.log` 사용 (디버그 목적으로 남겨진 경우)
- `src/components/ui/` 내 shadcn/ui 파일 직접 수정

## Severity

모든 코멘트에 다음 중 하나의 접두사를 붙이세요:

- **[P0]** 앱 크래시, 데이터 유실, 보안 취약점, 인증 우회
- **[P1]** 일반 사용자 플로우에서 오작동, 잘못된 데이터 표시, 네비게이션 오류
- **[P2]** 엣지 케이스 버그, 유효성 검사 누락, 유지보수성을 해치는 컨벤션 위반
- **[nit]** 경미한 컨벤션 이탈, 블로킹 아님

### 코멘트 기준: P0, P1, P2만 작성.

- P0/P1: 항상 코멘트. 수정이 명확한 경우 `suggestion` 블록 포함.
- P2: `suggestion` 없이 코멘트. 어떤 규칙을 위반했는지 한 문장으로 설명.
- [nit]: 코멘트하지 않음. 완전히 스킵.

### P1 기준 (하나 이상 해당해야 함):

- 일반 사용자 플로우에서 버그가 발생
- 잘못된 데이터가 표시되거나 제출됨
- 네비게이션 오류 (빈 페이지, 무한 리디렉션)
- 관리자 권한 체크 누락으로 접근 제어 실패
- 장시간 유지되는 페이지에서 메모리 누수

### P1 아닌 경우 (플래그 달지 말 것):

- "서버가 예상치 못한 형태를 반환할 수도 있음" (API 계약은 서버 책임)
- 실제 버그 없는 useEffect 의존성 배열 lint 경고
- 로딩/에러 UI 누락 (UX 문제, 버그 아님)
- 사용자 체감 영향 없는 성능 최적화

## 리뷰하지 않는 항목 (완전히 무시):

- 코드 스타일, 포맷, 들여쓰기 (Prettier가 처리)
- import 순서 (ESLint가 처리)
- 네이밍 컨벤션 (진짜로 혼란스러운 경우 제외)
- 문서, 주석, README
- 테스트 파일 (테스트 로직이 틀린 경우 제외)
- 설정 파일 (빌드/런타임 오류 유발 아닌 경우)
- 리팩토링 제안
- "있으면 좋은" 개선사항
- 사용자 체감 없는 성능 최적화

## 코멘트 형식

```
[P{n}] {한 줄 요약: 무엇이 문제인지}

{재현 조건 또는 영향 범위 (1문장)}
```

- 최대 1단락. 여러 단락 설명 금지.
- P0/P1이고 수정이 명확한 경우에만 `suggestion` 블록 포함.
- Suggestion 코드는 5줄 이하.
- Suggestion 블록에서 아키텍처 변경 제안 금지.

## Examples

**올바른 P1 코멘트:**

[P1] `page` 파라미터가 없을 때 `Number(null)`이 `0`이 되어 올바른 기본값처럼 보이지만, `NaN` 케이스가 별도로 처리되지 않습니다. 필터 파라미터 변경 시 페이지가 의도치 않은 값으로 요청됩니다.

```suggestion
const page = Number(urlParams.get('page')) || 0;
```

**올바른 P2 코멘트:**

[P2] 배럴 파일 import 사용. `@/hooks/useBanners`에서 직접 import 해주세요.

**나쁜 코멘트 (이렇게 쓰지 말 것):**

~~[P1] 이 코드는 개선이 필요합니다. useEffect cleanup이 없는데 React best practice에 위배됩니다. cleanup을 추가하면 메모리 누수를 방지할 수 있고...~~

(너무 길고, 재현 조건 없음. "Best practice"는 버그가 아님.)

## PR Overview Guidelines

- 최대 3문장
- 구성:
  - 변경 요약: 무엇이 왜 바뀌었는지 (1문장)
  - 우려 사항: 발견된 P0/P1, 없으면 "특이사항 없음" (1~2문장)
- 인라인 코멘트에서 이미 언급한 내용 반복 금지
- 칭찬 생략 ("좋은 PR", "잘 작성" 등 금지)

# Program Schema-Driven Curation Form Design

## UI Summary

기존 큐레이션 작성 화면의 `DetailPageHeader`, 기본 정보 카드, 이미지 업로드,
섹션 카드를 유지한다. `PROGRAM` payload는 행사 정보 카드와 프로그램 목록 카드로
나누며, 프로그램 배열의 각 항목은 번호가 있는 중첩 카드로 표시한다.

requestSpec이 제공하는 필드 순서, 표시 이름, 타입, 필수 여부, 개수 제한을 화면에
반영한다. 스펙에 앱 렌더링 정보가 없으므로 오른쪽 앱 미리보기 패널은 만들지 않고
입력 영역을 전체 너비로 사용한다.

## Navigation

- Route:
  - 모든 스펙의 공통 생성 라우트:
    `/dashboard/curations/specs/:specCode/new`
  - `PROGRAM` 진입:
    `/dashboard/curations/specs/PROGRAM/new`
  - 수정은 기존 `/dashboard/curations/:id`를 유지하고 상세 응답의
    `spec.code === PROGRAM`일 때 프로그램 수정 폼을 렌더링한다.
  - 기존 `/dashboard/curations/tasting-events/new`,
    `/dashboard/curations/general/new`, `/dashboard/curations/pairings/new`는
    동일한 공통 생성 라우트로 redirect하는 호환 경로만 유지한다.
- Sidebar/menu placement:
  - 기존 `큐레이션` 메뉴와 `/dashboard/curations` 목록을 유지한다.
  - 별도 사이드바 항목은 추가하지 않는다.
- Entry actions:
  - `/dashboard/curations/new`의 모든 활성 스펙 카드 전체와 `작성하기` 버튼이
    각 spec code를 포함한 공통 생성 라우트로 이동한다.
  - 프로그램 카드는 행사형 큐레이션임을 보여주는 기존 lucide 아이콘과 디자인
    시스템 색상을 사용한다.
  - 앱 미리보기 계약이 없으므로 `PROGRAM` 카드의 미리보기 액션은 표시하지 않는다.

## List View

- Columns:
  - 기존 큐레이션 목록 컬럼을 변경하지 않는다.
  - 스펙 표시는 기존 스펙 이름/코드 formatter를 통해 `프로그램`으로 표시한다.
- Filters/search:
  - 기존 스펙 필터는 API 스펙 목록 기반이므로 `PROGRAM`을 자동 표시한다.
- Row actions:
  - 기존 상세 이동을 유지한다.
- Empty/loading/error states:
  - 기존 큐레이션 목록 상태를 유지한다.

## Detail/Create/Edit View

- Sections/cards:
  - Header:
    - 생성: `프로그램 작성`
    - 수정: `프로그램 수정`
    - 보조 문구는 생성 시 스펙 이름, 수정 시 큐레이션 ID를 표시한다.
  - `기본 정보`:
    - 기존 `CurationBasicInfoSection`을 사용한다.
    - 큐레이션명, 설명, 이미지, 노출 기간, 노출 순서, 활성 상태를 유지한다.
  - `행사 정보`:
    - `programs`를 제외한 requestSpec 루트 필드를 스펙 순서로 렌더링한다.
    - 날짜/숫자/짧은 문자열은 2열, 주소·URL·enum 다중 선택은 전체 너비를 사용한다.
  - `프로그램`:
    - 섹션 제목에 현재 개수와 스펙의 1~20개 제한을 표시한다.
    - 빈 상태에 `프로그램을 추가해주세요.`와 `프로그램 추가` 버튼을 표시한다.
    - 각 항목은 `프로그램 1`, `프로그램 2` 형태의 카드이며 우측 상단에 `삭제`가 있다.
    - 프로그램 필드는 requestSpec의 item properties 순서로 표시한다.
    - `시음 위스키`는 해당 프로그램 카드 안의 하위 영역에 기존 위스키 카드 목록
      UI를 재사용한다.
- Fields:
  - string/date/time/number는 기존 `Input`, `Textarea`를 사용한다.
  - 단일 enum은 `Select`로 표시한다.
  - enum 배열은 체크박스 목록으로 표시하며 선택 개수 제한을 안내한다.
  - `alcohol-card-list`는 DB 검색/직접 입력/테이스팅 태그/이미지 입력을 포함한
    기존 위스키 카드 UI를 사용한다.
  - optional 필드는 required marker를 표시하지 않는다.
- Validation messages:
  - 기존 필드 메시지 형식인 `<필드명>은/는 필수입니다.`를 유지한다.
  - 배열 최소/최대:
    `<필드명>을 최소 N개 이상 추가해주세요.`,
    `<필드명>은 최대 N개까지 추가할 수 있습니다.`
  - 행사 날짜:
    `행사 종료일은 행사 시작일보다 빠를 수 없습니다.`
  - 프로그램 시간:
    `종료 시간은 시작 시간보다 빠를 수 없습니다.`
  - enum:
    `<필드명>을 선택해주세요.`
- Primary/secondary actions:
  - Primary: `저장` 또는 `수정`
  - Secondary: `목록`
  - 저장 중 또는 이미지 업로드 중에는 primary action을 비활성화한다.

## State and Feedback

- Loading:
  - 모든 생성 유형의 스펙 목록/상세 로딩은 단일 작성 페이지의 로딩 카드를 사용한다.
- Empty:
  - 스펙이 없거나 비활성이면 기존 `큐레이션 스펙을 찾을 수 없습니다.` 상태를
    표시한다.
  - 프로그램 배열이 비어 있으면 카드 안에 dashed empty state를 표시한다.
- Error:
  - 스펙 목록/상세 조회 실패는 기존 retry/back blocking state를 사용한다.
  - 지원하지 않는 requestSpec 구조는 `이 스펙은 아직 자동 폼에서 지원하지
않습니다.` 오류 카드와 목록 이동을 표시한다.
- Success:
  - 생성: `<스펙 이름> 큐레이션이 등록되었습니다.`
  - 수정: 기존 `큐레이션이 수정되었습니다.` 토스트를 유지한다.
  - 성공 후 큐레이션 목록으로 이동한다.
- Destructive confirmation:
  - 아직 저장되지 않은 프로그램/위스키 항목 삭제는 즉시 반영한다.
  - 서버 레코드 삭제는 이 기능에 포함하지 않는다.

## Design System Usage

- Components:
  - `DetailPageHeader`, `CurationBasicInfoSection`, `CurationSectionCard`,
    `CurationFormFieldRenderer`, `CurationWhiskyCardListField`, `FormField`
  - shadcn `Card`, `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`
- Tokens/classes:
  - `border-border`, `bg-card`, `bg-muted/20`, `text-muted-foreground`,
    `text-destructive`, `ring-ring` 등 기존 토큰을 사용한다.
  - 페이지 주요 영역은 `grid`, `minmax(0,1fr)`, `md:grid-cols-2`를 사용하고
    고정 픽셀 열 너비를 추가하지 않는다.
- Existing pages to mirror:
  - 공통 기본 정보와 저장: `WhiskyTastingEventForm.tsx`
  - 공통 스펙 조회 상태: `CurationCreate.tsx`
  - 반복 카드와 위스키 입력: `CurationWhiskyCardListField.tsx`
  - 일반 payload 상세 fallback: `CurationDetail.tsx`

## Manual UI Review Points

- [ ] 생성 유형 화면에서 프로그램 카드가 다른 활성 스펙과 자연스럽게 정렬되는지 확인한다.
- [ ] `/dashboard/curations/specs/PROGRAM/new` 직접 진입 시 스펙 로딩 후 폼이 표시되는지 확인한다.
- [ ] 모바일/태블릿/데스크톱에서 행사 정보의 1열/2열 전환과 중첩 프로그램 카드가
      가로 스크롤 없이 표시되는지 확인한다.
- [ ] 프로그램 추가/삭제 후 번호와 개수 badge가 즉시 갱신되는지 확인한다.
- [ ] 두 프로그램 각각의 시음 위스키가 서로 섞이지 않고 독립적으로 추가/삭제되는지 확인한다.
- [ ] enum 단일/다중 선택의 키보드 접근성과 required/error 표시를 확인한다.
- [ ] 저장 요청 payload의 프로그램 및 위스키 배열 순서가 화면 순서와 같은지 확인한다.
- [ ] 기존 시음회/추천/페어링 생성·수정 화면에 시각적 회귀가 없는지 확인한다.

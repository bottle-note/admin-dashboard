# 시음회 가격 미정 Design

## UI Summary

기존 시음회 작성·수정 화면의 `참가 정보` 카드와 2열 반응형 그리드를 유지한다.
`참가비(1인당)` 숫자 입력 바로 아래에 `가격 미정` 체크박스를 배치해 가격 필드와
의미상 한 그룹으로 보이게 한다. 체크 상태에서는 숫자 입력에 기존 disabled 스타일을
적용하고 값은 `0`으로 표시한다.

## Navigation

- Route: 기존 `/dashboard/curations/create/WHISKY_TASTING_EVENT` 및 시음회 수정
  라우트를 그대로 사용한다.
- Sidebar/menu placement: 기존 `큐레이션 관리` 메뉴를 그대로 사용한다.
- Entry actions: 기존 시음회 `작성하기` 및 목록 행 진입 동선을 그대로 사용한다.

## List View

- Columns: 변경 없음.
- Filters/search: 변경 없음.
- Row actions: 변경 없음.
- Empty/loading/error states: 변경 없음.

## Detail/Create/Edit View

- Sections/cards:
  - 기존 `참가 정보` 카드 안의 `참가비(1인당)` 필드만 확장한다.
  - 오른쪽 앱 미리보기 패널 구조는 유지한다.
- Fields:
  - 참가비 숫자 입력은 기존 `원` suffix와 최소값 `0`을 유지한다.
  - 숫자 입력 아래에 체크박스와 `가격 미정` 라벨을 한 줄로 배치한다.
  - 체크 시 숫자 입력은 disabled 상태가 되고 `0`으로 표시된다.
  - 체크 해제 시 숫자 입력은 활성화되며 `0`을 유지한다.
  - Backend의 `is_tbc` 필드는 독립된 `네/아니요` 라디오로 노출하지 않는다.
- Validation messages:
  - 참가비의 기존 숫자·최소값 validation을 유지한다.
  - 가격 미정 상태는 참가비를 `0`으로 동기화하므로 별도 오류 문구를 추가하지 않는다.
- Primary/secondary actions:
  - 기존 `저장`/`수정`, `목록` 버튼 동작을 그대로 사용한다.

## State and Feedback

- Loading: 기존 저장 버튼의 `저장 중...` 상태를 유지한다.
- Empty: 신규 작성 화면의 기본 상태는 `가격 미정` 미선택, 참가비 `0원`이다.
- Error: 기존 form validation과 `입력 정보를 확인해주세요.` 토스트를 유지한다.
- Success: 기존 시음회 등록·수정 성공 토스트와 목록 이동을 유지한다.
- Destructive confirmation: 해당 없음.
- Edit restoration:
  - `is_tbc=true`: 체크됨, 참가비 `0`, 입력 disabled.
  - `is_tbc=false` 또는 필드 없음: 체크 해제, 저장된 참가비 표시, 입력 활성화.

## Design System Usage

- Components: 기존 `FormField`, shadcn `Input`, `Checkbox`, `Label`을 재사용한다.
- Tokens/classes: 기존 number field의 `space-y-2`, `flex items-center gap-2`,
  `text-sm font-normal`, disabled input 스타일을 따른다.
- Existing pages to mirror:
  - `CurationFormFieldRenderer`의 모집 인원 미정 체크박스 패턴.
  - `WhiskyTastingEventForm`의 참가 정보 카드 및 오른쪽 sticky 미리보기 패널.

## Manual UI Review Points

- [ ] 데스크톱 2열 참가 정보 그리드에서 참가비 입력과 체크박스가 자연스럽게 묶인다.
- [ ] `가격 미정` 체크 시 참가비가 `0`으로 바뀌고 입력이 명확히 비활성화된다.
- [ ] 체크 해제 시 참가비 입력이 다시 활성화되고 무료 `0원` 상태로 구분된다.
- [ ] 앱 미리보기가 유료 금액, `무료`, `가격 미정`을 각각 올바르게 표시한다.
- [ ] 수정 화면에서 가격 미정 상태가 시각적으로 올바르게 복원된다.
- [ ] 좁은 화면에서 참가 정보 그리드와 체크박스 라벨이 잘리거나 겹치지 않는다.

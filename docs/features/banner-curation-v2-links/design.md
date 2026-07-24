# Banner Curation V2 Links Design

## UI Summary

기존 배너 등록/수정 화면의 `링크 설정` 카드를 그대로 사용한다. 큐레이션 타입을 선택했을 때만 달라지는 동작은 자동 생성되는 읽기 전용 이동 URL의 형식이며, 운영자는 기존과 동일하게 V2 큐레이션 드롭다운에서 대상만 선택한다. 기존 배너 데이터 전환은 운영 화면에 별도 버튼을 추가하지 않는 일회성 개발 환경 마이그레이션으로 처리한다.

## Navigation

- Route:
  - 배너 관리: `/banners`, `/banners/new`, `/banners/:id`
  - 배너가 저장하는 Product 이동 경로: `/curation/:id`
- Sidebar/menu placement:
  - 기존 `배너 관리` 메뉴를 유지한다.
- Entry actions:
  - 배너 등록 또는 수정 화면의 `링크 설정 > 큐레이션 선택`에서 대상 큐레이션을 선택한다.

## List View

- 기존 `BannerListPage`의 목록, 검색, 필터, 정렬순서 UI는 변경하지 않는다.
- 일회성 마이그레이션은 목록에 노출하지 않는다. 데이터 변경 대상과 결과는 개발 작업 로그로 확인한다.

## Detail/Create/Edit View

- Sections/cards:
  - 기존 `링크 설정` 카드를 유지한다.
- Fields:
  - `배너 타입`이 `큐레이션`이면 `큐레이션 선택` 드롭다운을 표시한다.
  - 드롭다운 옵션은 활성 상태인 V2 큐레이션의 `name`만 표시한다.
  - 대상 선택 시 `이동 URL`은 `/curation/{id}`로 자동 표시하며 읽기 전용으로 둔다.
  - 기존 레거시 URL(`/search?curationId={id}`, `/alcohols/search?curationId={id}`)을 가진 배너를 열어도 해당 ID의 큐레이션이 선택 상태로 표시된다.
  - 이미 V2 URL(`/curation/{id}`)인 배너도 해당 ID의 큐레이션이 선택 상태로 표시된다.
- Validation messages:
  - 큐레이션 타입에서 대상이 없으면 기존 문구 `큐레이션을 선택해주세요`를 유지한다.
- Primary/secondary actions:
  - 기존 `등록`·`저장`·`삭제` 동작과 피드백을 유지한다.

## State and Feedback

- Loading:
  - 기존 큐레이션 목록 로딩 상태와 배너 상세 로딩 상태를 유지한다.
- Empty:
  - 선택 가능한 V2 큐레이션이 없으면 드롭다운은 빈 상태로 표시한다.
- Error:
  - 기존 배너 저장 실패 처리와 토스트를 유지한다.
  - 일회성 마이그레이션에서 안전하게 파싱할 수 없는 링크, 상세 조회 실패, PUT 실패는 ID·사유를 실행 결과에 기록한다.
- Success:
  - 마이그레이션이 갱신한 배너 ID와 변경 전후 URL을 실행 결과에 기록한다.
- Destructive confirmation:
  - 링크 전환은 개발 환경에서 이미 사용자 승인된 일회성 데이터 정정이므로 별도 운영 UI 확인 다이얼로그는 추가하지 않는다.

## Design System Usage

- Components:
  - 기존 `Card`, `FormField`, `Select`, `Input`, `Label`, `Checkbox`를 유지한다.
- Tokens/classes:
  - 기존 큐레이션 타입의 `bg-muted` 읽기 전용 URL 필드 스타일을 유지한다.
- Existing pages to mirror:
  - `src/pages/banners/BannerDetail.tsx`
  - `src/pages/banners/components/BannerLinkSettingsCard.tsx`

## Manual UI Review Points

- [ ] 큐레이션 타입에서 V2 큐레이션을 선택하면 이동 URL이 `/curation/{id}`로 표시되는지 확인한다.
- [ ] 비활성 V2 큐레이션은 선택 드롭다운에 표시되지 않는지 확인한다.
- [ ] 레거시 및 V2 링크를 가진 기존 큐레이션 배너를 열었을 때 드롭다운이 올바른 큐레이션을 표시하는지 확인한다.
- [ ] 큐레이션 타입이 아닌 배너의 직접 URL 입력 및 외부 URL 선택 동작이 그대로인지 확인한다.

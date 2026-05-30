# Curation V2 Entry Design

## UI Summary

큐레이션 v2의 첫 화면은 운영자용 선택 허브다. 기존 어드민의 조용하고 밀도 있는 shadcn/Tailwind 스타일을 유지하되, 목록 테이블이 아니라 큐레이션 타입을 고르는 카드형 진입 화면으로 시작한다.

작성 화면 안에서 `추천 위스키`, `페어링`, `시음회`를 탭으로 바꾸는 구조는 사용하지 않는다. 첫 진입점에서 `시음회`, `일반 큐레이션`, `페어링` 중 하나를 선택하고, 이후 화면은 해당 타입 전용 작성 흐름으로 이동한다.

## Navigation

- Route:
  - Entry: `/dashboard/curations`
  - 시음회 작성: `/dashboard/curations/tasting-events/new`
  - 일반 큐레이션 작성: `/dashboard/curations/general/new`
  - 페어링 작성: `/dashboard/curations/pairings/new`
- Sidebar/menu placement:
  - `대시보드` 그룹 하위에 `큐레이션` 단일 탭을 추가한다.
  - 기존 ROOT 관리자 전용 `큐레이션 관리` 메뉴는 이 진입점과 섞지 않는다.
  - `큐레이션` 탭 노출 role: `ROOT_ADMIN`, `BAR_OWNER`, `COMMUNITY_MANAGER`
- Entry actions:
  - 각 타입 카드의 primary action: `작성하기`
  - 각 타입 카드의 secondary action: `미리보기`
  - `미리보기`는 우측 preview panel의 선택 상태만 바꾼다.

## Entry View

- Header:
  - 제목: `큐레이션`
  - 설명: `운영 목적에 맞는 큐레이션 유형을 선택해 작성합니다.`
  - 우측에는 별도 global create 버튼을 두지 않는다. 타입 카드에서 작성한다.
  - 공통 `PageHeader` 컴포넌트를 사용해 entry/list 성격의 페이지 제목과 설명 패턴을 재사용한다.
- Layout:
  - Desktop:
    - 좌측: 타입 카드 3개를 세로 stack 또는 넓은 카드 목록으로 배치한다.
    - 우측: `미리보기` 패널 공간을 비율 기반 그리드 컬럼으로 둔다.
  - Mobile/tablet:
    - 타입 카드 아래에 미리보기 패널을 쌓는다.
- Type cards:
  - 공통 구조:
    - 타입명
    - 짧은 설명
    - 작성에 필요한 핵심 입력 요약
    - `작성하기` button
    - `미리보기` outline button
  - 백엔드 코드나 내부 enum 값은 사용자 화면에 badge/tag로 노출하지 않는다.
  - 노출 순서:
    1. `시음회`
    2. `일반 큐레이션`
    3. `페어링`
- 시음회 카드:
  - Description: `일시, 장소, 모집 정보와 시음 위스키 라인업을 작성합니다.`
  - Input summary: `날짜`, `장소`, `참가비`, `정원`, `시음 위스키`
- 일반 큐레이션 카드:
  - Description: `위스키 카드와 큐레이터 코멘트를 작성합니다.`
  - Input summary: `위스키 카드`, `태그`, `코멘트`, `노출 이미지`
- 페어링 카드:
  - Description: `위스키와 어울리는 음식/아이템 페어링을 작성합니다.`
  - Input summary: `위스키`, `페어링 음식`, `이미지`, `설명`
- Preview panel:
  - Title: `미리보기`
  - Subcopy: `선택한 유형의 미리보기 이미지가 표시될 영역입니다.`
  - Body:
    - 빈 rectangle 또는 dashed placeholder만 둔다.
    - 실제 이미지, 임시 mock image, gradients, phone mockup은 넣지 않는다.
  - Empty state:
    - 미리보기 버튼을 누르기 전: 빈 placeholder
    - 미리보기 버튼을 누른 후: 선택된 타입명만 panel header 쪽에 표시해도 되지만 본문은 비워둔다.

## State and Feedback

- Loading:
  - 정적 진입점이므로 서버 loading 상태는 없다.
- Empty:
  - 타입 카드가 정적이므로 empty state는 없다.
  - 미리보기 본문은 의도적으로 비어 있다.
- Error:
  - route 접근 권한이 없으면 기존 `RoleProtectedRoute` fallback을 따른다.
- Success:
  - 진입점 자체에는 toast가 없다.
- Destructive confirmation:
  - 해당 없음.

## Design System Usage

- Components:
  - `Button`
  - `PageHeader`
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  - 필요하면 `Separator`
- Icons:
  - `CalendarDays` for 시음회
  - `Layers` or `BookOpen` for 일반 큐레이션
  - `Utensils` or similar for 페어링
  - `Eye` for 미리보기
  - `ArrowRight` for 작성하기
- Tokens/classes:
  - Page spacing: `space-y-6`
  - Header: `PageHeader`
  - Main layout: `grid gap-6 lg:grid-cols-3`
  - Main content span: `lg:col-span-2`
  - Preview panel span: `lg:col-span-1`
  - Type card layout: `flex flex-col gap-4 sm:flex-row sm:items-center`
  - Card radius: existing `rounded-lg` token, 8px
  - Border: `border`
  - Background: `bg-background`, `bg-card`, `bg-muted/30`
  - Muted text: `text-muted-foreground`
  - Buttons: existing `Button` variants (`default`, `outline`, `ghost`)
- Existing pages to mirror:
  - `src/pages/Dashboard.tsx` for dashboard-level entry feeling
  - `src/config/menu.config.ts` for dashboard menu group
  - `src/components/layout/Sidebar/SidebarMenuItem.tsx` for role-based menu visibility

## Manual UI Review Points

- [ ] `대시보드` 그룹 하위에 `큐레이션` 탭이 단일 항목으로 보이는지 확인한다.
- [ ] ROOT 관리자 전용 기존 `큐레이션 관리` 메뉴와 새 `큐레이션` 탭이 시각적으로 혼동되지 않는지 확인한다.
- [ ] `/dashboard/curations` 첫 화면이 작성 폼이 아니라 타입 선택 진입점으로 보이는지 확인한다.
- [ ] 타입 카드가 `시음회`, `일반 큐레이션`, `페어링` 순서로 노출되는지 확인한다.
- [ ] 각 카드의 `작성하기`, `미리보기` 액션이 명확히 구분되는지 확인한다.
- [ ] 우측 미리보기 영역은 공간만 확보되고 실제 이미지가 렌더링되지 않는지 확인한다.
- [ ] 좁은 화면에서 카드와 미리보기 패널이 겹치지 않고 단일 컬럼으로 자연스럽게 쌓이는지 확인한다.

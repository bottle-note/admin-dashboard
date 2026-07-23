# Region Management Design

## UI Summary

지역 관리는 위스키 기준정보를 다루는 운영 화면으로 구성한다. 증류소 관리와 같은 테이블 기반 목록, `DetailPageHeader` 기반 등록/상세 화면, `Card` 기반 기본 정보 폼을 사용해 기존 어드민 화면과 같은 밀도와 흐름을 유지한다.

목록은 빠른 검색, 페이지 이동, 드래그 앤 드롭 순서 변경에 집중한다. 등록/상세 화면은 지역의 이름, 대륙, 상위 지역, 설명을 편집하는 단일 폼 중심으로 구성하고, 정렬 순서는 목록에서만 변경한다. 상세 화면에서는 현재 순서, 하위 지역 존재 여부, 연결 위스키 수를 읽기 전용 참고 정보로 보여 삭제 판단에 도움을 준다.

## Navigation

- Route:
  - `/regions`: 지역 목록
  - `/regions/new`: 지역 등록
  - `/regions/:id`: 지역 상세/수정
- Sidebar/menu placement:
  - `위스키/테이스팅 태그` 그룹 하위에 `지역 관리` 섹션을 추가한다.
  - `지역 관리` 하위 메뉴는 `지역 목록`, `지역 추가`를 둔다.
  - 아이콘은 지역/지도 의미의 lucide 아이콘이 있으면 `MapPinned` 또는 `Map`; 없으면 기존 관리 섹션과 맞춰 `List`, `Plus`를 사용한다.
- Entry actions:
  - 목록 우측 상단의 `순서 변경` 버튼으로 드래그 앤 드롭 순서 변경 모드에 진입한다.
  - 목록 우측 상단의 `지역 추가` 버튼으로 `/regions/new`에 진입한다.
  - 목록 행 클릭으로 `/regions/:id`에 진입한다.
  - 상세/등록 화면의 뒤로가기 버튼은 `/regions`로 이동한다.

## List View

- Header:
  - 제목: `지역 목록`
  - 설명: `위스키 원산지로 사용되는 지역을 관리합니다.`
  - 우측 액션:
    - 일반 모드: `순서 변경` 버튼, `ArrowUpDown` 아이콘 포함
    - 일반 모드: `지역 추가` 버튼, `Plus` 아이콘 포함
    - 순서 변경 모드: `취소` outline 버튼
    - 순서 변경 모드: `순서 변경 완료` primary 버튼, 저장 중에는 `순서 저장 중...`
- Columns:
  - 순서 변경 모드일 때 첫 컬럼 `순서`: `sortOrder + 1` 또는 `sortOrder` 표시. 기존 배너/큐레이션 화면과 같은 표시 규칙을 따른다.
  - `ID`: 고정 폭, monospaced small text
  - `한글명`: primary text, bold
  - `영문명`: muted text
  - `대륙`: 값이 없으면 `-`
  - `상위 지역`: `parentId`가 있으면 `#<id>`, 없으면 `-`
  - `순서`: 일반 모드에서 숫자, 고정 폭
  - `수정일`: `ko-KR` 날짜
  - 순서 변경 모드일 때 마지막 빈 헤더: 드래그 핸들 영역
- Filters/search:
  - 증류소 목록과 같은 필터 바를 사용한다.
  - 검색 input placeholder: `지역 이름으로 검색...`
  - 검색 아이콘: `Search`
  - 검색 실행: 검색 버튼 클릭 또는 Enter
  - 정렬 select:
    - `순서 낮은순` = `ASC`
    - `순서 높은순` = `DESC`
  - 검색어, 정렬, 페이지, 페이지 크기는 URL 파라미터에 유지한다.
  - 순서 변경 모드에서는 현재 화면에 표시된 목록 기준으로만 드래그한다.
- Row actions:
  - 별도 액션 메뉴는 두지 않는다.
  - 행 hover는 `hover:bg-muted/50`, 행 전체 클릭으로 상세 진입.
  - `id=0`처럼 특수 데이터도 목록에서는 동일하게 보여주되, 삭제 제한 여부는 상세/삭제 응답으로 처리한다.
  - 순서 변경 모드에서는 행 클릭으로 상세 진입하지 않는다.
  - 순서 변경 모드에서는 마지막 컬럼에 `GripVertical` 핸들을 표시하고 `cursor-grab active:cursor-grabbing`을 적용한다.
  - 드래그 오버 대상 행은 `bg-primary/10`로 강조한다.
  - `parentId`는 순서 변경 제약으로 사용하지 않는다. 서로 다른 상위 지역을 가진 row 사이 드래그도 허용한다.
- Empty/loading/error states:
  - Loading: 테이블 한 줄 전체 폭에 `로딩 중...`
  - Empty without keyword: `등록된 지역이 없습니다.`
  - Empty with keyword: `검색 결과가 없습니다.`
  - Error: 기존 프로젝트 에러 처리 패턴을 따르되, 화면 내 표시가 필요하면 테이블 영역에 `지역 목록을 불러오지 못했습니다.`
- Pagination:
  - 공용 `Pagination` 컴포넌트를 사용한다.
  - 페이지 번호는 0-based API 값을 그대로 전달하고, 표시 문구는 공용 컴포넌트에 맡긴다.
- Reorder mode:
  - 기존 `BannerList`/`CurationList`의 순서 변경 UI 패턴을 따르되, 저장 시점은 드롭이 아니라 완료 버튼 클릭으로 둔다.
  - `sortOrder=ASC` 기준에서만 순서 변경 모드를 연다.
  - `sortOrder=DESC` 상태에서 `순서 변경`을 누르면 `sortOrder=ASC`, `page=0`으로 전환한 뒤 순서 변경 모드에 진입한다.
  - 안내 배너:
    - `순서 변경 모드 - 우측의 핸들을 드래그하여 지역 순서를 변경할 수 있습니다.`
    - 로컬 변경이 있으면 `(저장되지 않은 순서 변경이 있습니다.)`를 덧붙인다.
    - 완료 저장 중에는 `(순서 저장 중...)`을 덧붙인다.
  - 드래그앤드롭은 API를 호출하지 않고 로컬 row 배열만 재정렬한다.
  - 드롭할 때마다 staged move를 기록한다.
    - staged move: `{ regionId, targetSortOrder }`
    - `targetSortOrder`는 드롭된 위치의 순서 값이다.
  - `순서 변경 완료` 클릭 시 staged move를 저장한다.
  - 백엔드 `PATCH /regions/{id}/sort-order`는 단일 지역 이동 API다. 프론트가 영향받은 모든 row를 직접 저장하지 않는다.
  - staged move가 1개면 `PATCH /regions/{regionId}/sort-order`를 한 번 호출한다.
  - staged move가 여러 개면 완료 시 staged move queue를 순서대로 재생한다.
  - 각 요청 body는 `{ sortOrder: targetSortOrder }`다.
  - 저장 후에는 목록을 다시 조회해 백엔드가 자동 reorder한 최종 순서를 화면에 반영한다.
  - 실패 시 저장 전 로컬 순서로 되돌리고 목록을 다시 조회한다.
  - `취소`를 누르면 로컬 변경을 버리고 진입 시점의 원본 목록 순서로 되돌린 뒤 일반 모드로 나온다.
  - `parentId`가 다른 대상 위에 드롭해도 일반 row reorder로 처리한다.
  - 검색 또는 페이지네이션이 적용된 상태에서도 현재 페이지에 표시된 flat 목록 기준으로 순서 변경을 허용한다.
  - 저장되지 않은 순서 변경이 있을 때 검색/정렬/page size/페이지 이동은 비활성화한다.
  - 관리자는 `순서 변경 완료`로 저장하거나 `취소`로 변경을 버린 뒤 다른 목록 조작을 할 수 있다.

## Detail/Create/Edit View

- Page header:
  - 등록 제목: `지역 등록`
  - 상세 제목: `지역 상세`
  - 상세 subtitle: `ID: {id}`
  - 좌측: 뒤로가기 icon button
  - 우측:
    - 상세 모드: `삭제` destructive 버튼, `저장` 버튼
    - 등록 모드: `등록` 버튼
    - 저장 중: `저장 중...`
- Sections/cards:
  - `기본 정보` 카드:
    - 지역의 기본 이름과 분류 정보를 입력한다.
    - 페이지 폭 전체 또는 `max-w` 없이 기존 상세 화면의 content width를 따른다.
  - `참고 정보` 카드:
    - 상세 모드에서만 표시한다.
    - 하위 지역 여부, 연결 위스키 수, 생성일, 수정일을 읽기 전용으로 보여준다.
    - 등록 모드에서는 표시하지 않는다.
- Fields:
  - `한글명`:
    - Required
    - Input placeholder: `예: 스코틀랜드`
  - `영문명`:
    - Required
    - Input placeholder: `예: Scotland`
  - `대륙`:
    - Optional
    - Input placeholder: `예: 유럽`
    - enum이 확정되지 않았으므로 1차 UI는 자유 입력으로 둔다.
  - `상위 지역`:
    - Optional
    - 기존 지역 목록 API를 사용한 select/combobox.
    - Placeholder: `상위 지역 없음`
    - Search placeholder: `상위 지역 검색...`
    - Empty: `지역을 찾을 수 없습니다.`
    - 상세 모드에서는 현재 지역 자신은 선택 목록에서 제외한다.
  - `정렬 순서`:
    - 입력 필드로 제공하지 않는다.
    - 상세 모드의 `참고 정보` 카드에서 읽기 전용 값으로만 표시한다.
    - 순서 변경은 목록의 `순서 변경` 모드에서만 제공한다.
  - `설명`:
    - Optional
    - Textarea
    - Placeholder: `지역 설명을 입력하세요.`
    - 3-5줄 높이
  - `대표 이미지`:
    - Optional
    - 기존 저장 URL 또는 저장 전 WebP 결과를 미리보기로 표시한다.
    - JPG/PNG/WebP를 선택하면 자유 비율, 1:1, 4:3, 16:9 중 하나를 선택해 크롭한다. 크롭 영역을 드래그하고 모서리 핸들로 크기를 조절하며, 선택 영역 모서리에 원본 기준 가로×세로 픽셀을 표시한다.
    - 기본 WebP 품질은 70이며 40~95 범위에서 5 단위로 직접 조절한다.
    - 변환 완료 후 원본/결과 해상도·실제 파일 크기·증감률을 표시한다. 결과는 저장 클릭 전까지 로컬 `PreparedImage`로 유지한다.
    - 최대 입력 20 MiB, 최대 결과 5 MiB, 최대 출력 긴 변 1600px을 적용한다.
- Validation messages:
  - `한글명은 필수입니다`
  - `영문명은 필수입니다`
  - `상위 지역은 자기 자신으로 설정할 수 없습니다`
- Primary/secondary actions:
  - Primary: `등록` 또는 `저장`
  - Secondary/destructive: 상세 모드에서 `삭제`
  - Back: 헤더의 icon button
  - 삭제 성공 후 `/regions`로 이동한다.
  - 생성 성공 후 `/regions` 또는 생성된 상세 페이지 중 하나로 이동할 수 있으나, 기존 증류소 패턴에 맞춰 목록으로 이동한다.

## State and Feedback

- Loading:
  - 목록: 테이블 body에서 `로딩 중...`
  - 상세: 본문 영역에서 `로딩 중...`
  - 저장 버튼 disabled, 문구 `저장 중...`
  - 삭제 버튼 disabled 또는 다이얼로그 confirm pending, 문구는 공용 다이얼로그 pending 상태를 따른다.
- Empty:
  - 목록 빈 상태는 검색어 유무에 따라 `등록된 지역이 없습니다.` 또는 `검색 결과가 없습니다.`
  - 상위 지역 select 빈 상태는 `지역을 찾을 수 없습니다.`
- Error:
  - API 공통 toast/error handling을 따른다.
  - 상세 조회 실패 시 화면 본문에 `지역 정보를 불러오지 못했습니다.`
  - 중복 한글명 등 API validation 에러는 toast로 표시하고, 필드 매핑이 가능하면 해당 필드 에러로도 보여준다.
- Success:
  - 등록 성공 toast: `지역이 등록되었습니다.`
  - 수정 성공 toast: `지역이 수정되었습니다.`
  - 삭제 성공 toast: `지역이 삭제되었습니다.`
  - 순서 변경 성공 toast: `지역 순서가 변경되었습니다.`
- Reorder failure:
  - API 실패 시 공통 에러 toast를 표시하고 저장 전 순서로 되돌린 뒤 목록을 다시 조회한다.
- Destructive confirmation:
  - Dialog title: `지역 삭제`
  - Dialog description: `정말 이 지역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
  - `hasChildren` 또는 `alcoholCount`가 있을 때 삭제 버튼을 숨기지는 않는다. 백엔드가 제한하면 에러 toast로 보여준다.

## Design System Usage

- Components:
  - `Button`
  - `Input`
  - `Textarea`
  - `Select`
  - `Table`
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  - `DetailPageHeader`
  - `FormField`
  - `Pagination`
  - `DeleteConfirmDialog`
  - `useReorderDrag` 또는 동일한 로컬 재정렬 로직
  - 지역 선택에 기존 searchable select 컴포넌트가 있으면 재사용하고, 없으면 기존 `WhiskyBasicInfoCard`의 검색 가능 select 패턴을 따른다.
- Tokens/classes:
  - Page spacing: `space-y-6`
  - Header: `flex items-center justify-between`
  - Filter bar: `flex flex-col gap-4 sm:flex-row`
  - Search icon positioning: `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`
  - Table wrapper: `rounded-lg border`
  - Clickable rows: `cursor-pointer hover:bg-muted/50`
  - Reorder banner: `rounded-lg border border-primary/50 bg-primary/5 p-4`
  - Drag-over row: `bg-primary/10`
  - Drag handle: `cursor-grab active:cursor-grabbing`
  - Muted values: `text-muted-foreground`
  - ID values: `font-mono text-sm`
  - Required marker comes from `FormField`
- Existing pages to mirror:
  - `src/pages/distilleries/DistilleryList.tsx`
  - `src/pages/distilleries/DistilleryDetail.tsx`
  - `src/pages/banners/BannerList.tsx` for reorder mode, drag handle, 안내 배너
  - `src/pages/curations/CurationList.tsx` for reorder mode visuals
  - `src/hooks/useReorderDrag.ts` for drag state and affected range calculation, adjusted so API save is deferred until completion
  - `src/pages/tasting-tags/TastingTagDetail.tsx` for delete dialog and detailed form flow

## Manual UI Review Points

- [ ] 사이드바에서 `위스키/테이스팅 태그 > 지역 관리 > 지역 목록/지역 추가`가 자연스럽게 보이는지 확인한다.
- [ ] `/regions` 목록에서 검색 input, 정렬 select, 검색 버튼이 한 줄에 안정적으로 배치되는지 확인한다.
- [ ] `순서 변경` 버튼을 누르면 안내 배너, 드래그 핸들, `순서 변경 완료` 문구가 기존 배너/큐레이션 목록과 같은 밀도로 보이는지 확인한다.
- [ ] 순서 변경 모드에서 행 클릭으로 상세 이동이 발생하지 않는지 확인한다.
- [ ] `parentId`가 다른 지역 사이에서도 드래그 순서 변경이 로컬에서 동일하게 동작하는지 확인한다.
- [ ] 드래그 직후에는 API가 호출되지 않고, `순서 변경 완료` 클릭 시 staged move의 sort-order API가 호출되는지 확인한다.
- [ ] sort-order API 저장 후 백엔드 자동 reorder 결과가 refetch로 반영되는지 확인한다.
- [ ] `취소`를 누르면 저장되지 않은 순서 변경이 버려지고 일반 목록 모드로 돌아오는지 확인한다.
- [ ] 순서 저장 실패 시 저장 전 순서로 되돌아가는지 확인한다.
- [ ] 순서 변경 중 검색/정렬/페이지 변경을 시도할 때 UI가 어색하게 꼬이지 않는지 확인한다.
- [ ] 목록 테이블이 좁은 화면에서 텍스트가 겹치지 않고 필요한 경우 가로 스크롤 또는 줄임표 처리가 되는지 확인한다.
- [ ] 빈 목록, 검색 결과 없음, 로딩 상태 문구가 테이블 중앙에 보이는지 확인한다.
- [ ] `/regions/new`에서 필수값 없이 저장 시 한국어 validation 메시지가 표시되는지 확인한다.
- [ ] `/regions/:id`에서 기본 정보와 참고 정보가 구분되어 보이고, 순서/날짜/숫자 값이 읽기 쉬운지 확인한다.
- [ ] 상위 지역 선택에서 현재 지역 자신이 제외되는지 확인한다.
- [ ] 저장/삭제 pending 중 버튼 중복 클릭이 막히는지 확인한다.
- [ ] 삭제 확인 다이얼로그 문구와 destructive 버튼 스타일이 기존 증류소/태그 삭제 흐름과 맞는지 확인한다.

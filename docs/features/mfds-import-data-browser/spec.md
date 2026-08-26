# MFDS Import Data Browser Spec

## Summary

식약처에서 수집한 주류 수입 신고 데이터를 운영자가 검토하고 보틀노트 데이터와 연결 상태를 확인할 수 있도록 `식약처 데이터 관리` 영역을 추가한다. 실제 수입 이력을 제공하는 화면과 구분되는 내부 데이터 검토 도구다.

이번 phase의 핵심은 운영자가 다음 질문에 답할 수 있게 하는 것이다.

- 어떤 술이 수입 신고되었는가?
- 어느 수입사를 통해 들어왔는가?
- 원본 정보가 어떻게 정제되었고 무엇을 추가로 확인해야 하는가?
- 보틀노트의 술·증류소·지역 중 어떤 데이터와 연결되었거나 후보로 제안되었는가?

수입 신고 데이터 검토 목록·상세를 P0으로 먼저 제공하고, 수입사 데이터 검토 목록·상세를 P1로 연결한다. 이번 phase는 조회 전용이며 수집 실행, 정규화 상태 변경, 연결 확정, 수입사 매핑과 같은 데이터 변경 기능은 포함하지 않는다.

## Source Inputs

- Workspace issue:
  - `https://github.com/bottle-note/workspace/issues/397`
  - Milestone: `식약처 주류 데이터 수집·정제`
- Related issues:
  - `#325`: 식약처 술 정보 수집 기능
  - `#375`: 확인 사유에서 연결 술 정보 조회
  - `#376`: 수집 데이터 정제·업체/증류소 매핑 규칙
- Admin API:
  - Human-readable docs: `https://bottle-note.github.io/workspace/#admin`
  - OpenAPI JSON: `https://bottle-note.github.io/workspace/openapi.admin.json`
  - Dev server: `https://admin-api.development.bottle-note.com/admin/api`
- Existing UI/code references:
  - `src/config/menu.config.ts`: `ROOT_ADMIN` 사이드바 그룹 패턴
  - `src/routes/index.tsx`: `RoleProtectedRoute` 적용 패턴
  - `src/pages/distilleries/DistilleryList.tsx`: 검색·필터·목록 패턴
  - `src/pages/distilleries/DistilleryDetail.tsx`: 상세 정보 구성 패턴
  - `src/hooks/useInfiniteApiQuery.ts`: 커서 기반 조회 구현 참고

## Domain Model

### 수입 신고

식약처에서 수집한 주류 신고 데이터 한 건이다. 제품명, 용량, 도수, 제조사, 국가, 수입사, 정규화 결과와 보틀노트 연결 정보를 포함한다. `id`는 어드민 데이터의 식별자이고 `rcno`는 식약처 수입신고번호로 사용한다.

### 정규화

수집한 원문에서 제품명, 용량, 도수, 숙성 연수, 빈티지, 배치 등의 구조화된 값을 추출하는 과정이다. 원문과 정규화 결과를 함께 보여주고, `normalizationReasons`와 `unparsedFragments`를 통해 운영자가 판단 근거와 미처리 내용을 확인할 수 있어야 한다.

### 저장된 매칭 후보

정제된 신고 데이터를 보틀노트의 기존 술·증류소·지역과 비교해 계산하고 저장한 후보 목록이다. 후보와 확정된 연결은 다르다.

- 후보: `alcoholCandidates`, `distilleryCandidates`, `regionCandidates`
- 확정된 연결: `selectedAlcoholId`, `selectedDistilleryId`, `selectedRegionId`
- 확정 여부는 판정 문구가 아니라 선택 ID 존재 여부로 판단한다.
- 상세 응답의 후보는 ID와 점수만 제공하므로, 이름이 포함된 후보를 표시할 때는 저장된 매칭 후보 API를 함께 사용한다.

### 수입사 매핑 근거

수입신고번호와 수입사를 연결한 수집 원장이다. 식약처 원문상의 수입사명, 매핑 방식, 출처 URL과 관측 시각을 보존한다. 운영자가 현재 수입사 매핑을 변경해도 이 원장은 바뀌지 않으므로 현재 상태가 아니라 출처·감사 정보로 취급한다.

### 수입사

식약처에서 확인된 수입 업체다. 업체 기본 정보와 운영 관리 상태를 갖는다. 수입사 데이터 검토 상세에서는 `importerId`로 신고 데이터 목록을 다시 조회해 해당 업체와 연결된 신고를 함께 보여준다.

## Screen Map

| Priority | Screen                  | Route                               | Purpose                                                            |
| -------- | ----------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| P0       | 수입 신고 데이터 검토   | `/mfds/declarations`                | 수집된 신고를 검색·필터하고 검토할 데이터를 찾는다.                |
| P0       | 신고 데이터 검토        | `/mfds/declarations/:declarationId` | 원문·정규화 결과, 수입사 매핑 근거, 보틀노트 연결 상태를 확인한다. |
| P1       | 수입사 데이터 검토      | `/mfds/importers`                   | 수집된 수입사를 검색하고 업체별 신고 데이터로 진입한다.            |
| P1       | 수입사 데이터 검토 상세 | `/mfds/importers/:importerId`       | 업체 정보와 해당 업체에 연결된 신고 데이터 목록을 확인한다.        |

사이드바에는 `ROOT_ADMIN` 전용 최상위 그룹 `식약처 데이터 관리`를 추가하고, `수입 신고 데이터 검토`와 `수입사 데이터 검토`를 하위 메뉴로 제공한다. 연결 후보와 수입사 매핑 근거는 독립 메뉴로 만들지 않고 신고 데이터 검토 화면의 보조 영역으로 제공한다.

## Admin Workflow

1. 관리자는 `식약처 데이터 관리 > 수입 신고 데이터 검토`로 진입한다.
2. 제품명·수입신고번호 검색, 정규화 상태, 매칭 여부, 수입사 등의 조건으로 신고를 찾는다.
3. 목록 행을 선택해 신고 데이터 검토 화면으로 이동한다.
4. 상세에서 원문과 정규화 결과, 확인 사유, 수입사 매핑과 출처, 현재 보틀노트 연결 결과와 후보를 확인한다.
5. 연결된 수입사명을 선택하면 수입사 상세로 이동한다.
6. 수입사 상세에서 업체 정보와 해당 업체에 연결된 수입 신고 이력을 확인한다.
7. 연결이 확정된 보틀노트 술이 있으면 술 상세로 이동할 수 있다. 술 상세에서 수입 신고 이력을 역으로 보여주는 기능은 후속 phase로 분리한다.

## Screen Requirements

### P0: 수입 신고 데이터 검토

- 표시 정보:
  - 수입 신고 데이터 ID
  - 수입신고번호(RCNO)
  - 한글·영문 SKU 표시명, 값이 없으면 기본 제품명을 대체 표시
  - 용량과 도수
  - 수입사명
  - 정규화 상태
  - 술 매칭 여부와 판정
  - 데이터 적재 시각
- 검색·필터:
  - `keyword`: 한글·영문 제품 검색 키와 수입신고번호 부분 일치
  - `normalizationStatus`
  - `alcoholMatched`
  - `alcoholMatchDecision`
  - 수입사 이름을 검색해 선택하고, 선택된 수입사의 `importerId`를 요청과 URL에 사용
- 페이징:
  - ID 내림차순 커서 방식
  - `cursor`, `pageSize`를 URL 파라미터로 관리한다.
  - 필터나 검색어 변경 시 cursor를 제거하고 첫 목록부터 다시 조회한다.
- 상태 표현:
  - 최초 로딩
  - 다음 목록 로딩
  - 전체 빈 결과
  - 검색·필터 결과 없음
  - 조회 오류와 재시도
- 행 선택 시 신고 데이터 검토 화면으로 이동한다.

### P0: 신고 데이터 검토

상세는 다음 정보 그룹으로 구성한다.

1. 정규화 결과
   - 수집 제품명은 한글·영문 원문을 한 번만 표시한다.
   - 정규화 결과는 `분류 / 항목 / 정규화 결과` 표로 표시한다.
   - 제품명, 카테고리, 제조 정보, 제품 식별 요소, 규격, 유통 정보를 하나의 표에서 확인한다.
   - 숫자와 소비기한은 임의로 변환하거나 합치지 않고 API 값을 그대로 표시한다.
   - 화면 대표 이름은 SKU 표시명을 우선하고, 값이 없으면 기본 제품명을 대체 표시
2. 데이터 처리 상태
   - 정규화 상태는 상세 제목 옆 태그로 표시한다.
   - 정상 상태는 별도 상태 박스나 안내 문구를 노출하지 않는다.
   - 검토·부분·실패 상태는 제목 아래 박스에 정규화 시각, 정규화 처리 코드와 미해석 원문을 펼쳐 표시한다.
   - `normalizationReasons`는 백엔드에 저장된 문자열을 해석하거나 분류하지 않고 그대로 표시한다.
   - 검토 대기 상태와 검토자·검토 시각·메모가 있으면 함께 표시한다.
3. 수입사 매핑 결과
   - 현재 연결 수입사와 연결 방식·시각
   - 수입사 상세 이동
4. 수입사 매핑 근거
   - 원문 수입사명, 근거 유형, 출처 URL, 관측 시각
   - 출처·감사 정보임을 명확히 표시한다.
5. 보틀노트 데이터 연결
   - 현재 선택된 술·증류소·지역
   - 저장된 후보의 이름과 점수
   - 자동 판정과 운영자 확정을 구분해 표시한다.

상세에서 데이터 변경 버튼은 제공하지 않는다. 후보나 현재 연결 값이 없으면 오류처럼 보이지 않도록 `연결된 정보 없음`, `저장된 연결 후보 없음`으로 표시한다.

### P1: 수입사 목록

- 표시 정보:
  - 수입사 ID와 업체명
  - 인허가 번호와 공식 업소 코드
  - 대표자, 소재지, 영업 상태
  - 어드민 관리 상태
  - 허가일
- 검색·필터:
  - `keyword`: 업체명, 인허가 번호, 공식 업소 코드 부분 일치
  - `adminStatus`: `ACTIVE`, `INACTIVE`
- ID 내림차순 커서 페이징을 사용한다.
- 행 선택 시 수입사 상세로 이동한다.
- 생성·수정·삭제 버튼은 제공하지 않는다.

### P1: 수입사 상세

- 공식 업체 정보:
  - 업체명, 대표자, 인허가 번호, 공식 업소 코드
  - 허가일, 관할 기관, 주소, 전화번호, 업종, 영업 상태
- 어드민 참고 정보:
  - 설명, 관리자 메모, 관리 상태, 검토자와 검토 시각
- 수입 신고 이력:
  - `importerId`를 조건으로 수입 신고 목록 API를 재사용한다.
  - 수입 신고 데이터 검토 목록과 같은 핵심 열과 커서 페이징을 제공한다.
  - 신고 행 선택 시 해당 신고 데이터 검토 화면으로 이동한다.
- 수정·삭제와 수동 등록 기능은 제공하지 않는다.

## API Requirements

### 수입 신고

- `GET /v1/mfds/declarations`
  - Query: `normalizationStatus`, `alcoholMatched`, `alcoholMatchDecision`, `importerId`, `keyword`, `cursor`, `pageSize`
  - Response data: `MfdsDeclarationListItem[]`
  - Response meta: `nextCursor`, `hasNext`를 사용한 커서 페이징
- `GET /v1/mfds/declarations/{declarationId}`
  - Response data: `MfdsDeclarationDetailResponse`
- `GET /v1/mfds/declarations/{declarationId}/matching/candidates`
  - Response data: `MfdsMatchingCandidatesResponse`
  - 상세 후보 이름과 점수를 표시할 때 사용한다.
- `GET /v1/mfds/rcno-links?rcno={rcno}`
  - Response data: `MfdsRcnoLinkItem[]`
  - 현재 수입사 연결이 아니라 수집 출처 근거를 표시할 때 사용한다.

### 수입사

- `GET /v1/mfds/importers`
  - Query: `adminStatus`, `keyword`, `cursor`, `pageSize`
  - Response data: `MfdsImporterItem[]`
  - Response meta: `nextCursor`, `hasNext`를 사용한 커서 페이징
  - 수입 신고 목록의 수입사 검색·선택에도 이 API를 재사용한다.
- `GET /v1/mfds/importers/{importerId}`
  - Response data: `MfdsImporterItem`
- 수입사별 신고 이력은 `GET /v1/mfds/declarations?importerId={importerId}`를 재사용한다.

모든 API 응답은 `success`, `code`, `data`, `errors`, `meta` 공통 형식이며 화면 데이터는 `data`에서 읽는다.

## API Validation Before Implementation

OpenAPI에 명확하지 않은 항목은 인증된 dev API의 실제 응답으로 확인한다.

- 목록 검색 조건이 실제 요청에서 개별 query parameter로 전달되는지 확인한다.
- `meta.nextCursor`, `meta.hasNext`의 실제 타입과 마지막 페이지 응답을 확인한다.
- 목록과 상세에서 값이 없는 필드가 누락되는지 `null`로 내려오는지 확인한다.
- 정상 정제 데이터와 `REVIEW_REQUIRED` 데이터의 실제 응답을 각각 확인한다.
- 정규화 상태와 매칭 판정 값별 실제 의미와 사용자 문구를 확인한다.
- `expiryStart`, `expiryEnd`의 도메인 의미를 확인한다.
- 실제 수입·신고 날짜를 나타내는 필드가 문서 밖 응답에 존재하는지 확인한다.

실제 수입·신고 날짜가 없다면 별도 백엔드 계약이 필요하다. `createdAt`, `normalizedAt`, `matchedAt`, `importerLinkedAt`, 수입사의 `permitDate`를 수입일로 대체해서 표시하지 않는다.

## API Validation Results

2026-08-25 dev API의 인증된 실제 목록 응답을 확인했다.

- `GET /v1/mfds/declarations?pageSize=100`은 정상 응답했고 목록 필드는 OpenAPI의 `MfdsDeclarationListItem`과 일치했다.
- 응답 `meta`에는 `nextCursor`, `hasNext`, `pageSize`, `totalElements`와 공통 서버 정보가 포함됐다.
- 다음 페이지가 있으면 `nextCursor`는 숫자이고, 마지막 페이지는 `nextCursor: null`, `hasNext: false`로 내려왔다.
- `REVIEW_REQUIRED` 필터가 개별 query parameter로 정상 적용됐다.
- 확인된 정규화 상태는 `NORMALIZED`, `REVIEW_REQUIRED`였다.
- 확인된 매칭 판정은 `AMBIGUOUS`, `AUTO_SELECTED`, `CONFLICT_REVIEW`, `NO_MATCH`, `REVIEW`였다.
- OpenAPI에는 nullable 표시가 없지만 실제 응답에서 `volumeMl`, `abvPercent`, `importerId`, `importerLinkSource`, `selectedAlcoholId`가 `null`일 수 있었다. 프론트 타입은 실제 응답에 맞춰 이 필드들의 `null`을 허용한다.
- 백엔드의 목록 응답 DTO와 매퍼는 14개 필드를 항상 응답에 포함한다. 엔티티 컬럼과 연결·매칭 해제 로직까지 확인한 결과 `baseProductNameKo`, `baseProductNameEn`, `volumeMl`, `abvPercent`, `importerId`, `importerBaseName`, `importerLinkSource`, `selectedAlcoholId`, `alcoholMatchDecision`, `matchedAt`은 `null`일 수 있고, `id`, `rcno`, `normalizationStatus`, `createdAt`은 저장된 신고에서 필수다.
- 상세, 저장 후보, RCNO 연결 근거 API를 실제 데이터 2건으로 확인했다. 상세 응답은 DTO의 모든 키를 포함하고, 원문·정제·검토·연결·선택 값은 데이터 상태에 따라 `null`이 될 수 있다.
- 저장 후보 응답의 `selection`은 항상 존재하지만 확정되지 않은 ID는 `null`이다. 자동 판정 문자열이 있어도 선택 ID가 없으면 확정으로 표시하지 않는다.
- 저장된 술 후보의 `scoreDetail`은 백엔드 계약상 항상 `null`이며, 삭제되거나 찾을 수 없는 참조 후보는 ID와 점수만 있고 이름이 `null`일 수 있다.
- RCNO 연결 근거는 없으면 빈 배열이고, 존재할 때 출처 URL과 관측 시각은 `null`일 수 있다.

## Acceptance Criteria

- [ ] `ROOT_ADMIN`은 사이드바의 `식약처 데이터 관리`에서 수입 신고 데이터 검토와 수입사 데이터 검토로 진입할 수 있다.
- [ ] 수입 신고 데이터 검토 목록은 검색·필터·커서 페이징 상태를 URL 파라미터로 유지한다.
- [ ] 수입 신고 데이터 검토 목록에서 로딩, 빈 결과, 검색 결과 없음, 오류 상태가 구분된다.
- [ ] 신고 데이터 검토 화면에서 수집 원문·정규화 결과와 정규화 사유를 확인할 수 있다.
- [ ] 신고 데이터 검토 화면에서 현재 수입사 매핑과 수입사 매핑 근거를 구분해 확인할 수 있다.
- [ ] 신고 데이터 검토 화면에서 확정된 보틀노트 연결과 저장된 후보를 구분해 확인할 수 있다.
- [ ] 수입사 목록에서 업체를 검색하고 상세로 이동할 수 있다.
- [ ] 수입사 상세에서 업체 정보와 해당 업체의 수입 신고 이력을 확인할 수 있다.
- [ ] 모든 화면은 조회 전용이며 데이터 변경 동작을 제공하지 않는다.
- [ ] 기존 사이드바, 인증, 권한별 라우팅 동작에 회귀가 없다.
- [ ] 변경한 조회 흐름을 Playwright E2E로 검증한다.

## Delivery Slices

구현 티켓은 계층별 작업이 아니라 운영자가 사용할 수 있는 흐름 단위로 나눈다.

1. 수입 신고 데이터 검토 목록
   - 메뉴·라우트, API 타입·서비스·훅, 검색·필터·커서 페이징, 상태 UI, E2E를 함께 제공한다.
2. 신고 데이터 검토 상세
   - 상세 API, 정제 정보, 수입사, 매칭 후보, RCNO 근거, 상세 이동 흐름과 E2E를 함께 제공한다.
3. 수입사 탐색
   - 수입사 목록·상세와 수입사별 신고 이력, 화면 간 링크, E2E를 함께 제공한다.

## In Scope

- `ROOT_ADMIN` 전용 `식약처 데이터 관리` 사이드바 그룹
- 수입 신고 데이터 검토 목록·상세 조회
- 수입사 목록·상세 조회
- 수입사별 수입 신고 이력 조회
- 저장된 매칭 후보와 현재 선택 결과 표시
- 수입사 매핑 근거 표시
- 검색·필터·커서 상태의 URL 파라미터 관리
- API 타입, 서비스, TanStack Query 훅
- 로딩·빈 결과·오류 상태
- 관련 운영 흐름의 Playwright E2E

## Out of Scope

- 식약처 데이터 수집 실행과 재수집
- 정규화 상태와 검토 상태 변경
- 매칭 실행·확정·해제
- 수입사 수동 연결·해제
- 수입사 생성·수정·삭제
- 수입사 매핑 근거 생성·삭제
- 운영 DB 또는 Product 데이터 자동 반영
- 보틀노트 술 상세에서 수입 신고 이력을 역으로 조회하는 기능
- Product 앱 화면과 프로덕션 배포
- 수입사별 신고 건수, 최근 수입일 등 백엔드 집계 기능

## Follow-up

- 신고 목록에서도 SKU 표시명을 대표 이름으로 사용할 수 있도록 목록 응답에 `skuDisplayNameKo`, `skuDisplayNameEn`을 추가한다.
- 보틀노트 술 상세에서 확정된 `selectedAlcoholId` 기준 수입 신고 이력을 조회한다.
- 이를 위해 `alcoholId`를 받는 신고 목록 필터 또는 술 기준 전용 조회 API가 필요하다.
- 실제 수입·신고 날짜를 목록과 상세, 날짜 검색·정렬에 제공한다.
- 바 운영자 등 외부 역할까지 어드민 접근 범위를 확장할 경우, 정규화 결과 중심의 수입 신고 정보와 원문·검토 메모·후보 점수 등의 내부 데이터 처리 정보를 권한과 API 응답 수준에서 분리한다.
- 운영 정책이 확정되면 매칭 확정과 해제, 수입사 연결과 정규화 상태 변경 기능을 별도 phase로 제공한다.

## Open Questions

- 이번 데이터에서 운영자가 말하는 `한국에 들어온 날짜`는 수입신고일, 통관일, 식약처 공개일 중 어느 날짜인가?
- 해당 날짜는 식약처 원본에서 수집되고 있는가? 없다면 새로 수집 가능한가?
- `REVIEW_REQUIRED`, `PARTIAL`, `UNPARSED`, `STALE`을 운영자에게 어떤 한국어 상태로 보여줄 것인가?
- 자동 판정과 운영자 확정을 화면에서 어떤 신뢰도·상태로 구분할 것인가?
- 수입사별 수입 신고 이력은 첫 배포에 포함할 것인가, P0 배포 후 이어서 제공할 것인가?

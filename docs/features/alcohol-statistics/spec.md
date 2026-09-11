# 주류 통계 Spec

## Summary

ROOT_ADMIN이 주류 이름을 검색해 개별 지표를 분석하거나, 최대 세 주류의 같은 지표를 비교한다. 기존 주류 상세의 접힘형 차트는 유지한다.

## Source Inputs

- [workspace #444](https://github.com/bottle-note/workspace/issues/444)
- 최신 Admin OpenAPI: `https://bottle-note.github.io/workspace/openapi.admin.json`
- 기존 방문자 통계: `src/pages/statistics/VisitorStatistics.tsx`
- 기존 주류 상세 통계: `src/pages/whisky/components/WhiskyPopularityChartCard.tsx`
- 기존 주류 검색: `src/components/common/WhiskySearchSelect.tsx`

## Operator Goal

- 운영자는 특정 주류의 인기도·조회·평가·찜·참여 지표를 상세 화면에 들어가지 않고 분석한다.
- 비교에서는 최대 세 주류의 하나의 지표를 같은 기간·버킷에서 비교한다.
- 이 화면은 읽기 전용이다. 통계의 범위와 선택 대상을 URL에 남겨 새로고침과 공유 뒤에도 같은 결과를 재현한다.

## Domain Model

- 주류 선택 결과는 `alcoholId`, 한글/영문 이름, 분류, 이미지로 구성된다. 검색어는 후보를 찾기 위한 임시 입력값이고, 확정 조회 대상은 `alcoholId`다.
- 인기도는 서버가 계산한 SCORE 시리즈와 그 계산에 사용한 COUNT 원시값 시리즈로 나뉜다. 열린 주·월 버킷의 SCORE는 `null`일 수 있다.
- 관찰 지표는 `INTEREST`(조회), `RATING`(평점), `PICK`(찜), `ENGAGEMENT`(리뷰·좋아요·댓글) 중 하나다.
- 통계 마지막 버킷은 아직 끝나지 않은 집계일 수 있으며 `partial: true`로 표시된다.
- 배포 OpenAPI는 query 객체를 `request`라는 필수 파라미터로 표기하고 응답의 required/nullable 정보를 충분히 제공하지 않는다. 현재 어드민이 쓰는 평면 query 직렬화와 기존 타입을 따른다.
- 2026-09-09 인증된 dev 확인: popularity와 INTEREST/RATING/PICK/ENGAGEMENT 모두 200이며 descriptor가 OpenAPI·백엔드와 일치했다. RATING의 `deltaRatingCount`와 `deltaRatingSum`은 음수가 가능하다(확인값 -51, -179.7). 마지막 주 버킷은 `partial: true`였고, 열린 버킷의 인기도 SCORE는 `null`이었다.

## API Contract

| 목적      | API                                                           | 요청                        | 응답에서 사용하는 값                            |
| --------- | ------------------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| 주류 검색 | `GET /v1/alcohols/lookup`                                     | `keyword`, `page`, `size`   | `alcoholId`, `korName`, `engName`, 분류, 이미지 |
| 인기도    | `GET /v1/statistics/alcohols/{alcoholId}/popularity`          | `from`, `to`, `granularity` | `series`, `points`, `partial`                   |
| 관찰 지표 | `GET /v1/statistics/alcohols/{alcoholId}/observations/{axis}` | `from`, `to`, `granularity` | `series`, `points`, `partial`                   |

- 브라우저 요청 경로는 프록시를 거쳐 `/admin/api/v1/...`를 사용한다.
- 주류 통계 집계 단위는 `HOUR`, `WEEK`, `MONTH`다. HOUR는 최대 31일, WEEK·MONTH는 최대 366일이다.
- 잘못된 기간·단위는 400, 존재하지 않는 주류는 404다. 오류 화면에는 서버 오류 메시지와 재시도 동작을 제공한다.

## Screen Map

| Priority | Screen    | Route                  | Purpose                             | API                              |
| -------- | --------- | ---------------------- | ----------------------------------- | -------------------------------- |
| 1        | 주류 통계 | `/statistics/alcohols` | 개별 지표 분석과 최대 3개 주류 비교 | lookup, popularity, observations |

## Screen Requirements

### 주류 통계 `/statistics/alcohols`

- 통계 메뉴의 `방문자 통계` 아래에 `주류 통계`를 ROOT_ADMIN에게만 노출한다.
- 상단에 이름 검색 선택기를 둔다. 한 글자 이상 입력하면 lookup 결과를 보여 주고, 선택한 주류의 이름·영문명·분류를 검색기 아래에 표시한다.
- 개별 분석은 `mode=individual`, `alcoholId`, `group`으로, 비교는 `mode=compare`, `ids`(쉼표 구분 최대 3개), `group`, `metric`으로 URL에 저장한다. `from`, `to`, `granularity`도 함께 저장한다.
- 통계 필터는 시작일, 종료일, 집계 단위이며 기본값은 KST 오늘 기준 최근 30일·WEEK다. 적용 전 입력은 API를 호출하지 않는다.
- 미래 날짜, 역순 날짜, HOUR 31일 초과, WEEK/MONTH 366일 초과는 클라이언트에서 막는다.
- 개별 분석은 지표 그룹을 선택하고, 해당 그룹의 모든 descriptor를 단위(COUNT/DECIMAL/SCORE)와 의미 단위로 나눈 세로 차트 행으로 표시한다. `delta*`는 음수가 가능한 `기간 증감`, `viewCount`와 `interestValue`는 `기간 조회 수`, `unpickCount`는 누적·현재값이다.
- 비교는 하나의 `metric`만 선택하며 각 주류의 시계열을 `bucketAt` 기준으로 합친다. 없는 버킷은 `null`로 남겨 선을 연결하지 않는다. 주류별 색상은 선택 순서 동안 고정한다.
- 각 행은 방문자 통계와 같은 Card + `TimeSeriesChart` 스타일을 사용하며, null은 선을 연결하지 않고 partial 버킷은 점선으로 표시한다.
- 검색 결과 없음, 검색 오류, 통계 로딩, 통계 오류·재시도, 빈 시계열을 각각 구분한다.

## State Matrix

| 상태                   | 화면 동작                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| 최초 진입              | 검색 입력과 주류 선택 안내를 표시하고 통계 API는 호출하지 않는다.                                              |
| 검색 중/다음 결과 로딩 | 검색 선택기 내부에서 로딩 표시와 무한 스크롤을 제공한다.                                                       |
| 검색 결과 없음         | 선택기에 `검색 결과가 없습니다`를 표시한다.                                                                    |
| 주류 선택 뒤 통계 로딩 | 각 차트 행에 로딩 상태를 표시한다.                                                                             |
| 빈 통계                | 해당 행에 `표시할 데이터가 없습니다`를 표시한다.                                                               |
| 400/404/네트워크 오류  | 해당 차트 행에 오류 메시지와 재시도 버튼을 표시한다.                                                           |
| null/partial/긴 이름   | null은 차트 선을 끊고 partial은 점선으로 표시한다. 주류 이름은 줄임 처리하되 제목 속성으로 전체 값을 확인한다. |
| 권한 없음              | 메뉴와 라우트 모두 ROOT_ADMIN으로 제한한다.                                                                    |

## Acceptance Criteria

- [ ] ROOT_ADMIN이 통계 메뉴에서 주류 통계로 이동할 수 있다.
- [ ] 한 글자 이상 주류를 검색하고 선택하면 개별 분석의 `alcoholId` 또는 비교의 `ids`가 URL에 남는다.
- [ ] 선택 전에는 통계 API를 요청하지 않는다.
- [ ] 개별 분석에서 선택한 그룹의 모든 지표가 단위·흐름별 세로 차트로 표시된다.
- [ ] 비교에서 최대 세 주류와 하나의 지표를 선택하면 주류별 라인이 같은 버킷으로 병합된다.
- [ ] 기간·집계 단위·그룹·지표를 적용하면 URL과 실제 요청이 함께 바뀐다.
- [ ] 잘못된 기간과 API 오류를 운영자가 이해하고 복구할 수 있다.
- [ ] 데스크톱과 좁은 화면에서 가로 넘침 없이 표시된다.

## Delivery Slices

1. 경로·메뉴·문서와 URL 상태를 추가하고 기존 lookup·통계 hooks로 실제 요청을 연결한다.
2. 개별 분석/주류 비교 탭, 기간·그룹·지표 필터와 세로 차트 행을 구현한다.
3. 실제 통합 Playwright 흐름, lint, build 및 브라우저 화면을 확인한다.

## In Scope

- ROOT_ADMIN 전용 주류 통계 단일 화면
- 기존 lookup·인기도·관찰 통계 API의 재사용
- URL 기반 대상·통계 필터 상태

## Out of Scope

- 차트 API·배치 집계·인기도 계산 방식 변경
- 순위 목록, 데이터 내보내기
- 기존 위스키 상세의 인기도 패널 제거 또는 변경

## Follow-up

- 기간 간 비교와 순위 조회 요구가 확인되면 별도 화면으로 설계한다.

## Open Questions

- 없음.

## Verification (2026-09-09)

- 최신 OpenAPI·백엔드 소스와 인증된 dev의 5개 통계 endpoint 응답을 확인했다.
- `pnpm lint`: 오류 0, 기존 경고 7. `pnpm build`: 성공.
- `pnpm exec playwright test e2e/specs/statistics.spec.ts --workers=1`: 인증 포함 5개 통과. 실제 lookup, 그룹·기간 변경, 3개 비교 제한, 지표 선택, 새로고침 복원, 제거 후 색상 유지, 개별 분석 복귀를 검증한다.
- 인증된 브라우저에서 데스크톱 1440px 및 모바일 390px의 검색·선택·비교 레이아웃과 가로 넘침을 확인했다. 실제 평점 수 감소 데이터를 음수 축으로 확인했다.
- 빈 응답·부분 실패 재시도는 코드 경로를 검토했으며 강제 오류를 이용한 브라우저 검증은 하지 않았다.

# Banner Curation V2 Links Spec

## Summary

큐레이션 타입 배너가 V1 검색 결과 페이지가 아닌 Product의 큐레이션 V2 상세 화면으로 이동하도록 링크 구조를 전환한다. 새로 생성하거나 수정하는 배너는 V2 큐레이션을 선택해 `/curation/{id}` 링크를 저장한다. 이미 저장된 레거시 큐레이션 배너도 일회성 API 마이그레이션으로 같은 형식으로 갱신한다.

## Source Inputs

- API docs/response shape:
  - Published admin API documentation: `https://bottle-note.github.io/bottle-note-api-server/bottle-note/admin-api/admin-api.html`
  - `GET /admin/api/v1/banners` supports `bannerType`, pagination, and returns banner IDs but not `targetUrl`.
  - `GET /admin/api/v1/banners/{bannerId}` returns `targetUrl` and every field required by `PUT /admin/api/v1/banners/{bannerId}`.
  - No bulk banner-update endpoint is published. `PATCH /admin/api/v1/banners/bulk/reorder` is ordering-only and must not be used for this migration.
  - `GET /admin/api/v2/curations` provides the V2 curation list used by the banner selector.
- Existing UI/code references:
  - `src/pages/banners/BannerDetail.tsx`: already loads V2 curations through `useCurationList` from `useCurations`.
  - `src/pages/banners/components/BannerLinkSettingsCard.tsx`: currently generates the legacy `/search?curationId={id}` URL.
  - `src/pages/banners/useBannerDetailForm.ts`: extracts `curationId` from legacy query-string URLs when editing existing banners.
- User request:
  - GitHub workspace issue #299: `https://github.com/bottle-note/workspace/issues/299`
  - Existing legacy links should be updated in bulk through the admin API.

## Admin Workflow

- 관리자는 배너 등록 또는 수정 화면에서 배너 타입을 `큐레이션`으로 선택한다.
- 관리자는 활성 상태인 V2 큐레이션 목록에서 링크 대상을 선택한다.
- 선택하면 이동 URL은 `/curation/{id}`로 자동 설정되고, 읽기 전용으로 표시된다.
- 기존 큐레이션 타입 배너를 수정 화면에서 열면 레거시 링크와 V2 링크 모두에서 큐레이션 ID를 인식해 선택 상태를 표시한다.
- 일회성 마이그레이션은 큐레이션 타입의 내부 링크 배너만 대상으로 하며, 레거시 링크를 `/curation/{id}`로 갱신한다.

## Data Requirements

- New and edited curation-banner link:
  - `targetUrl`: `/curation/{curationId}`
  - `isExternalUrl`: `false`
  - `bannerType`: `CURATION`
- Banner curation selector query:
  - `GET /admin/api/v2/curations?isActive=true`
  - 비활성 큐레이션은 새 배너의 링크 대상으로 표시하지 않는다.
- Migration candidate requirements:
  - `bannerType === 'CURATION'`
  - `isExternalUrl === false`
  - `targetUrl` is a recognized legacy curation URL with a numeric `curationId`, including `/search?curationId={id}` and the historical `/alcohols/search?curationId={id}` form.
- Migration request:
  - Fetch every CURATION banner page through `GET /admin/api/v1/banners`.
  - Fetch each candidate detail through `GET /admin/api/v1/banners/{bannerId}`.
  - Send `PUT /admin/api/v1/banners/{bannerId}` with the existing required detail fields unchanged except `targetUrl` set to `/curation/{curationId}` and `isExternalUrl` set to `false`.
  - Skip and report records whose URL cannot be safely parsed or whose detailed record no longer meets the candidate requirements.

## Acceptance Criteria

- [ ] 새 큐레이션 타입 배너를 저장하면 `targetUrl`이 `/curation/{id}` 형식이다.
- [ ] 큐레이션 선택 목록에는 활성 상태인 V2 큐레이션만 표시된다.
- [ ] 수정 화면에서 레거시 및 V2 큐레이션 링크 모두 해당 큐레이션을 선택 상태로 표시한다.
- [ ] 일회성 마이그레이션은 모든 페이지의 후보 배너를 조회하고, 안전하게 파싱 가능한 내부 큐레이션 링크만 갱신한다.
- [ ] 마이그레이션은 배너의 링크 외 필드와 정렬 순서를 변경하지 않는다.
- [ ] 마이그레이션 결과에는 갱신·건너뜀·실패 배너 ID와 사유가 남는다.
- [ ] 배너 클릭을 처리하는 Product 앱에서 `/curation/{id}`가 V2 큐레이션 상세로 연결된다.

## In Scope

- 배너 폼의 V2 링크 생성 및 기존 링크 파싱.
- V2 큐레이션 선택 타입을 유지하는 API/타입 연결.
- 개발 환경의 기존 레거시 큐레이션 배너 일회성 API 마이그레이션과 결과 보고.
- 단위 테스트 및 마이그레이션 dry-run 확인.

## Out of Scope

- Product 앱의 `/curation/{id}` 라우트 구현 또는 수정.
- API 서버에 전용 bulk banner-update endpoint 추가.
- CURATION 이외 배너 타입의 링크 정책 변경.
- 운영 환경 데이터 변경. 운영 전환은 별도 승인과 대상 검토 후 수행한다.

## Open Questions

- Product 앱의 `/curation/{id}` 라우트가 배포 환경에서 이미 V2 상세 화면으로 동작하는지 수동 확인이 필요하다.
- 레거시 링크를 수정할 때만 갱신하는 대신, 이번 요청에 따라 개발 환경에서는 일회성 마이그레이션으로 일괄 갱신한다.

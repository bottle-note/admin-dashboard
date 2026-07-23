# Region Management Spec

## Summary

위스키 원산지로 사용되는 지역(국가) 데이터를 어드민에서 조회, 등록, 수정, 삭제할 수 있는 관리 페이지를 추가한다.

초기 확인에 사용한 공개 GitHub Pages admin API 문서에는 지역 목록 조회만 노출되어 있었지만, dev 기준 API 서버에는 지역 상세, 생성, 수정, 삭제, 정렬 순서 변경 엔드포인트가 존재한다. 이 스펙은 dev API 계약을 기준으로 지역 관리 전체 CRUD 화면을 정의한다.

## Source Inputs

- API docs/response shape:
  - Dev API base: `.env.local`의 `VITE_API_BASE_URL` (`https://admin-api.development.bottle-note.com`)
  - Dev API 문서 후보 경로(`/admin-api/admin-api.html`, `/docs/index.html`, `/swagger-ui/index.html`, `/v3/api-docs`)는 인증 토큰을 붙여도 `403`을 반환했다.
  - Dev API 엔드포인트는 인증 토큰으로 `OPTIONS`, 안전한 `GET`, 검증 실패 요청을 통해 확인했다.
  - GitHub PR source: `https://github.com/bottle-note/bottle-note-api-server/pull/586`
    - PR summary confirms `sort-order` is Banner-style reorder.
    - `AdminRegionSortOrderRequest` is `{ sortOrder: number }`.
    - Backend behavior: changing one region's `sortOrder` moves that region and pushes all regions with `sortOrder >= newSortOrder` by `+1`; remaining ties are sorted by `korName ASC`.
  - `OPTIONS /admin/api/v1/regions`: `POST,GET,HEAD,OPTIONS`
  - `OPTIONS /admin/api/v1/regions/{regionId}`: `DELETE,GET,HEAD,PUT,OPTIONS`
  - `OPTIONS /admin/api/v1/regions/{regionId}/sort-order`: `PATCH,OPTIONS`
- Existing UI/code references:
  - `src/pages/distilleries/DistilleryList.tsx`: URL query 기반 검색, 정렬, 페이지네이션 테이블 패턴
  - `src/pages/distilleries/DistilleryDetail.tsx`: 단순 기준정보 상세/생성/수정/삭제 폼 패턴
  - `src/pages/banners/BannerList.tsx`: 순서 변경 모드, 드래그 핸들, 안내 배너 패턴
  - `src/pages/curations/CurationList.tsx`: 드래그 앤 드롭 순서 변경 UI 패턴
  - `src/hooks/useReorderDrag.ts`: 드래그 상태와 영향 범위 계산 참고
  - `src/pages/tasting-tags/TastingTagList.tsx`: 위스키/테이스팅 태그 메뉴 하위 관리 페이지 패턴
  - `src/config/menu.config.ts`: 위스키/테이스팅 태그 사이드바 그룹
  - `src/routes/index.tsx`: `ROOT_ADMIN` 보호 라우트 패턴
  - `src/types/api/region.api.ts`, `src/services/region.service.ts`, `src/hooks/useRegions.ts`: 현재는 지역 목록 API 레이어만 존재
- User request:
  - 위스키/테이스팅 태그 관리 영역에 지역 관리 페이지를 추가하기 전에, dev 기준 백엔드 API 스펙을 확인하고 화면 구성 기준이 되는 스펙을 작성한다.

## Admin Workflow

- 관리자는 사이드바의 `위스키/테이스팅 태그` 그룹에서 `지역 관리` 메뉴로 진입한다.
- 지역 관리의 기본 화면은 `지역 목록`이다.
- 목록 화면은 지역 데이터를 테이블로 보여준다.
- 관리자는 지역 한글명/영문명 기준으로 검색할 수 있다.
- 검색어, 페이지 번호, 페이지 크기, 정렬 방향은 URL 파라미터로 유지한다.
- 관리자는 순서 정렬 방향을 `ASC` 또는 `DESC`로 변경할 수 있다.
- 관리자는 페이지네이션으로 지역 목록을 탐색할 수 있다.
- 관리자는 `지역 추가` 버튼으로 신규 등록 화면에 진입한다.
- 관리자는 목록 행을 클릭해 지역 상세 화면에 진입한다.
- 상세 화면에서 관리자는 지역 한글명, 영문명, 대륙, 설명, 상위 지역을 확인하고 수정할 수 있다.
- 상세 화면에서 관리자는 지역을 삭제할 수 있다.
- 삭제는 확인 다이얼로그를 거친다.
- 지역 순서는 상세 폼이 아니라 목록의 순서 변경 모드에서만 변경한다.
- 순서 변경 모드는 기존 배너/큐레이션 목록의 드래그 앤 드롭 패턴을 따른다.
- 순서 변경 모드는 `sortOrder=ASC` 기준 목록에서 동작한다. 다른 정렬 방향에서 진입하면 `sortOrder=ASC`, `page=0`으로 전환한다.
- 순서 변경 모드에서 드래그 앤 드롭은 로컬 목록 순서만 변경한다.
- `순서 변경 완료` 버튼을 클릭하면 staged move를 `PATCH /sort-order`로 반영한다.
- `PATCH /sort-order`는 bulk API가 아니라 단일 지역 이동 API다. 한 지역의 `regionId`와 새 `sortOrder`를 보내면 백엔드가 충돌하는 기존 지역들을 자동으로 밀어낸다.
- `취소` 버튼을 클릭하면 저장하지 않은 로컬 순서 변경을 버리고 일반 목록 모드로 돌아간다.
- `parentId`는 지역 관계를 나타내는 참고 정보이며, 순서 변경 제약으로 사용하지 않는다.
- 드래그 앤 드롭은 목록에 표시된 flat 지역 row 사이에서 허용한다.
- 상위 지역 자체를 바꾸는 동작은 상세 화면의 `상위 지역` 필드에서 처리한다.

## Data Requirements

- `GET /admin/api/v1/regions`
  - `keyword?: string`: 검색어. 입력값이 비어 있으면 요청에서 제외한다.
  - `page?: number`: 0-based 페이지 번호. 기본값은 `0`.
  - `size?: number`: 페이지 크기. 지역 목록 화면 기본 조회 개수는 `100`.
  - `sortOrder?: 'ASC' | 'DESC'`: 정렬 방향. 기본값은 `ASC`.
  - Response list item:
    - `id: number`
    - `korName: string`
    - `engName: string`
    - `continent: string | null`
    - `description: string | null`
    - `createdAt: string`
    - `modifiedAt: string`
    - `parentId: number | null`
    - `sortOrder: number`
  - Response meta:
    - `page: number`
    - `size: number`
    - `totalElements: number`
    - `totalPages: number`
    - `hasNext: boolean`
- `GET /admin/api/v1/regions/{regionId}`
  - Response detail:
    - `id: number`
    - `korName: string`
    - `engName: string`
    - `continent: string | null`
    - `description: string | null`
    - `sortOrder: number`
    - `parentId: number | null`
    - `parentKorName: string | null`
    - `hasChildren: boolean`
    - `alcoholCount: number`
    - `createAt: string`
    - `lastModifyAt: string`
  - Dev 상세 응답은 목록 응답과 달리 날짜 필드명이 `createAt`, `lastModifyAt`이다.
- `POST /admin/api/v1/regions`
  - Request:
    - `korName: string`
    - `engName: string`
    - `continent?: string | null`
    - `description?: string | null`
    - `parentId?: number | null`
    - `sortOrder?: number | null`
  - Empty object 검증 결과 `korName`, `engName`은 필수다.
  - 중복 한글명은 `REGION_DUPLICATE_KOR_NAME`으로 실패한다.
  - Response는 프로젝트의 일반 mutation 응답 형식인 `{ code, message, targetId, responseAt }`로 본다.
- `PUT /admin/api/v1/regions/{regionId}`
  - Request는 생성과 동일하게 본다.
  - Empty object 검증 결과 `korName`, `engName`은 필수다.
  - 존재하지 않는 ID는 `REGION_NOT_FOUND`로 실패한다.
  - Response는 프로젝트의 일반 mutation 응답 형식인 `{ code, message, targetId, responseAt }`로 본다.
- `DELETE /admin/api/v1/regions/{regionId}`
  - 존재하지 않는 ID는 `REGION_NOT_FOUND`로 실패한다.
  - Response는 프로젝트의 일반 mutation 응답 형식인 `{ code, message, targetId, responseAt }`로 본다.
- Region 대표 이미지 후속 연동:
  - `imageUrl: string | null`은 Region 목록/상세 응답 및 생성/수정 요청에서 사용한다.
  - 지역 등록/수정 화면은 이미지 선택 → 비율 선택 크롭 → WebP 전처리 → 저장 시 S3 업로드 → Region API `imageUrl` 전달 순서를 따른다.
  - 이미지 선택·크롭만으로는 S3 또는 Region API를 호출하지 않는다.
  - 지원 입력은 JPG/PNG/WebP, 최대 20 MiB이며 WebP 결과는 최대 긴 변 1600px·최대 5 MiB로 제한한다.
  - 운영자는 1:1, 4:3, 16:9 중 크롭 비율을 선택하고 드래그/확대로 크롭 영역을 조절한다. 기본 비율은 1:1, 기본 품질은 70이다.
- `PATCH /admin/api/v1/regions/{regionId}/sort-order`
  - Request:
    - `sortOrder: number`
  - Empty object 검증 결과 `sortOrder`는 필수다.
  - Response는 프로젝트의 일반 mutation 응답 형식인 `{ code, message, targetId, responseAt }`로 본다.
  - UI에서는 `순서 변경 완료` 클릭 시에만 호출한다.
  - 드래그 중에는 API를 호출하지 않고 로컬 목록 순서만 변경한다.
  - 완료 시 마지막 staged move의 `regionId`와 target `sortOrder`를 전송한다.
  - 여러 번 드래그한 상태를 모두 지원해야 하면, 완료 시 staged move queue를 순서대로 재생한다. 각 요청은 `{ regionId, sortOrder }` 단건 이동이며, 변경된 모든 row를 직접 PATCH하지 않는다.
  - 백엔드는 해당 지역을 새 `sortOrder`에 삽입하고 `sortOrder >= newSortOrder`인 다른 지역들을 `+1` 밀어낸다.
  - 실패하면 저장 전 순서로 로컬 상태를 되돌리고 목록을 다시 조회한다.

## Acceptance Criteria

- [ ] `ROOT_ADMIN` 관리자는 사이드바의 `위스키/테이스팅 태그` 하위에서 `지역 관리 > 지역 목록` 메뉴를 볼 수 있다.
- [ ] `ROOT_ADMIN` 관리자는 `/regions` 경로에서 지역 목록 페이지를 볼 수 있다.
- [ ] 지역 목록은 `GET /admin/api/v1/regions`를 호출하고, 응답의 `data`와 `meta`를 사용해 테이블과 페이지네이션을 렌더링한다.
- [ ] 목록 테이블은 ID, 한글명, 영문명, 대륙, 상위 지역, 순서, 수정일을 표시한다.
- [ ] 검색어 입력 후 검색하면 `keyword`와 `page=0`이 URL에 반영되고 목록이 다시 조회된다.
- [ ] 정렬 방향을 변경하면 순서 기준 `sortOrder`와 `page=0`이 URL에 반영되고 목록이 다시 조회된다.
- [ ] 페이지 번호와 페이지 크기를 변경하면 URL 파라미터와 목록 조회 파라미터가 함께 변경된다.
- [ ] 목록 우측 상단의 `순서 변경` 버튼을 클릭하면 순서 변경 모드로 진입한다.
- [ ] `sortOrder=DESC` 상태에서 순서 변경 모드에 진입하면 `sortOrder=ASC`, `page=0` 기준 목록으로 전환된다.
- [ ] 순서 변경 모드에서는 안내 배너와 드래그 핸들이 표시되고, 버튼 문구는 `순서 변경 완료`로 바뀐다.
- [ ] 순서 변경 모드에서는 행 클릭으로 상세 화면에 이동하지 않는다.
- [ ] 지역 row를 드래그하면 `parentId`와 무관하게 화면 내 로컬 순서만 변경되고 API는 호출되지 않는다.
- [ ] 순서 변경 완료 버튼을 클릭하면 staged move에 대해 `PATCH /admin/api/v1/regions/{regionId}/sort-order`가 호출된다.
- [ ] 순서 변경 PATCH body는 `{ sortOrder: number }`이며, 프론트가 영향받은 모든 row를 직접 저장하지 않는다.
- [ ] 순서 변경 완료가 성공하면 일반 목록 모드로 돌아가고 목록을 다시 조회한다.
- [ ] 순서 변경 완료가 실패하면 저장 전 순서로 되돌리고 목록을 다시 조회한다.
- [ ] 취소 버튼을 클릭하면 로컬 순서 변경을 버리고 일반 목록 모드로 돌아간다.
- [ ] `지역 추가` 버튼은 `/regions/new` 등록 화면으로 이동한다.
- [ ] 목록 행 클릭은 `/regions/{id}` 상세 화면으로 이동한다.
- [ ] 등록 화면은 한글명, 영문명, 대륙, 설명, 상위 지역을 입력받고 `POST /admin/api/v1/regions`를 호출한다.
- [ ] 상세 화면은 `GET /admin/api/v1/regions/{regionId}`를 호출해 폼 초기값과 참조 정보를 표시한다.
- [ ] 수정 저장은 `PUT /admin/api/v1/regions/{regionId}`를 호출한다.
- [ ] 삭제는 확인 다이얼로그 이후 `DELETE /admin/api/v1/regions/{regionId}`를 호출하고 목록으로 돌아간다.
- [ ] 로딩, 빈 목록, 검색 결과 없음, 저장 중, 삭제 중 상태가 한국어 문구로 표시된다.
- [ ] API 성공 후 목록/상세 캐시가 적절히 무효화되고 한국어 toast가 표시된다.

## In Scope

- 지역 목록 페이지 추가
- 지역 등록/상세/수정 페이지 추가
- 지역 삭제 확인 다이얼로그
- 지역 목록 드래그 앤 드롭 순서 변경 모드
- 위스키/테이스팅 태그 사이드바 하위 메뉴 추가
- `/regions`, `/regions/new`, `/regions/:id` 라우트 추가
- 지역 API 타입, 서비스, 훅을 dev API 기준으로 보강
- 목록 페이지 검색, 정렬, 페이지네이션 상태의 URL 파라미터 관리
- React Hook Form + Zod 기반 지역 폼 스키마
- 상위 지역 선택은 기존 지역 목록 API를 재사용한다.
- `sortOrder` 변경은 상세 폼이 아니라 목록 드래그 앤 드롭으로만 제공한다.
- 순서 변경 API 호출은 드롭 시점이 아니라 `순서 변경 완료` 클릭 시점에만 수행한다.
- 순서 변경은 `parentId`와 무관한 flat 목록 기준으로 제공한다.
- 목록/상세/생성/수정/삭제/정렬 변경에 대한 focused 테스트

## Out of Scope

- 지역 계층 구조를 드래그 앤 드롭 트리로 편집하는 기능
- 드래그 앤 드롭으로 `parentId`를 변경하는 기능
- 지역과 위스키의 연결 관계 직접 편집
- 특정 지역에 연결된 위스키 목록 상세 관리
- 기존 위스키 등록/수정 폼의 지역 선택 UX 변경
- dev API 문서 HTML 접근 권한 문제 해결

## Open Questions

- `keyword` 검색 대상은 한글명과 영문명 모두인지, 대륙/설명까지 포함하는지 확인이 필요한가?
- `continent` 값은 자유 문자열인지, 고정 enum인지 확인이 필요한가?
- `parentId` 선택 시 자기 자신 또는 하위 지역 선택 방지는 백엔드 검증만으로 충분한가, 프론트에서도 제외해야 하는가?
- `hasChildren` 또는 `alcoholCount > 0`인 지역 삭제가 백엔드에서 제한되는지, 제한된다면 어떤 에러 코드와 문구가 내려오는가?
- 상세 응답의 `createAt`, `lastModifyAt` 필드명은 의도된 계약인가, `createdAt`, `modifiedAt`으로 맞춰질 예정인가?

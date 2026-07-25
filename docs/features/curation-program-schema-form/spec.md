# Program Schema-Driven Curation Form Spec

## Summary

큐레이션 V2 스펙에 추가된 `PROGRAM`을 어드민에서 생성하고 수정할 수 있게 한다.
작성 화면은 스펙 code를 받는 동적 라우트로 진입하고, 스펙 상세의 `requestSpec`을
해석해 행사 정보, 프로그램 목록, 프로그램별 시음 위스키 목록을 렌더링한다.

`PROGRAM` 한 종류만을 위한 필드 하드코딩을 추가하지 않고, 현재 큐레이션 폼의
JSON Schema 파서/필드 모델/렌더러를 객체 배열과 enum까지 확장한다. 다만
requestSpec에 없는 화면 문구, 섹션 의미, 앱 미리보기 구성은 자동 추론하지 않는다.

## Source Inputs

- API docs/response shape:
  - Published admin docs:
    `GET /admin/api/v2/curation-specs`,
    `GET /admin/api/v2/curation-specs/{specId}`,
    `POST /admin/api/v2/curations`,
    `PUT /admin/api/v2/curations/{curationId}`.
  - Backend `main` resource:
    `bottlenote-mono/src/main/resources/openapi/curation/program.json`
    (`feat: 프로그램 큐레이션 스펙 추가`, backend commit `d7944c51`).
  - Published admin docs do not yet include a `PROGRAM` example. The backend
    resource is the current contract source for this feature.
- Existing UI/code references:
  - `src/pages/curation/CurationEntry.tsx`
  - `src/pages/curation/curation-form-model.ts`
  - `src/pages/curation/components/CurationFormFieldRenderer.tsx`
  - `src/pages/curation/components/CurationWhiskyCardListField.tsx`
  - `src/pages/curation/whisky-tasting-event/*`
  - `src/pages/curation/whisky-curation/*`
  - `src/routes/index.tsx`
- User request:
  - 큐레이션 스펙에 추가된 프로그램의 새 화면 라우트와 렌더링을 추가한다.
  - 가능한 범위에서 스펙 기반 동적 생성을 사용한다.

## Admin Workflow

- 관리자는 큐레이션 생성 유형 선택 화면에서 활성 스펙 카드를 확인한다.
- 모든 스펙 카드의 작성하기는 동일한 spec code 기반 작성 라우트로 이동한다.
- 단일 작성 페이지는 URL의 spec code로 대상 스펙과 상세 `requestSpec`을 조회한다.
- 단일 작성 페이지는 조회한 스펙의 form style/code에 맞는 폼 모델과 렌더러를
  선택한다. 스펙 조회, loading/error/missing 상태와 목록 복귀는 이 페이지가
  공통으로 소유한다.
- 관리자는 공통 큐레이션 기본 정보와 행사 정보를 입력한다.
- 관리자는 프로그램을 1개 이상 추가하고 각 프로그램의 정보와 선택적인 시음
  위스키 목록을 입력한다.
- 저장 시 폼 값을 `PROGRAM` requestSpec의 object payload로 직렬화해 기존
  큐레이션 V2 생성 API로 전송한다.
- 기존 `PROGRAM` 큐레이션 상세에 진입하면 같은 스펙 기반 폼을 수정 모드로
  렌더링하고, 저장 시 기존 큐레이션 V2 수정 API로 전송한다.

## Data Requirements

- Spec list item:
  - `code`: `PROGRAM`
  - `name`, `description`, `version`, `isActive`는 생성 유형 카드와 스펙 선택에 사용한다.
- Spec detail:
  - `requestSpec.type`: `object`
  - 행사 필수 필드:
    `eventStartDate`, `eventEndDate`, `placeName`, `address`, `programs`
  - 행사 선택 필드:
    `detailLocation`, `organizer`, `sponsor`, `entryFee`, `officialUrl`,
    `registrationUrl`, `programTags`
  - `programTags`: enum string array, 최대 6개
  - `programs`: object array, 최소 1개/최대 20개
  - 프로그램 필수 필드:
    `name`, `type`, `programDate`, `startTime`, `description`
  - 프로그램 선택 필드:
    `endTime`, `venue`, `host`, `applicationUrl`, `whiskies`
  - `type`: enum string
  - `whiskies`: `x-field-style: alcohol-card-list`, 최대 10개
- Schema vocabulary used by the UI:
  - primitive `string`, `integer`, `number`, `boolean`
  - `format: date|time`
  - `enum`
  - array of enum strings
  - array of objects
  - nested `x-field-style: alcohol-card-list`
  - `required`, `nullable`, `minLength`, `maxLength`, `minimum`, `maximum`,
    `minItems`, `maxItems`, `x-display-name`, `x-placeholder`
- Mutation payload:
  - Common fields keep the existing `CurationV2CreateRequest` /
    `CurationV2UpdateRequest` contract.
  - `payload` is a single object because the `PROGRAM` container is `object`.
  - Optional empty strings and empty optional arrays are omitted or normalized
    consistently before submission; required values are retained.

## Acceptance Criteria

- [ ] 활성 `PROGRAM` 스펙이 생성 유형 선택 화면에 표시된다.
- [ ] 모든 활성 스펙 카드가 `/dashboard/curations/specs/{specCode}/new` 형식의
      단일 작성 페이지로 이동한다.
- [ ] `PROGRAM` 작성하기가 준비중 토스트가 아니라 동적 생성 라우트로 이동한다.
- [ ] 동적 라우트가 URL의 spec code로 활성 스펙 상세를 조회한다.
- [ ] 행사 필드의 입력 종류, 필수 여부, 길이/최솟값/최댓값이 requestSpec에서 생성된다.
- [ ] `programTags`와 `type` enum을 선택할 수 있다.
- [ ] 프로그램을 1~20개 추가/삭제할 수 있고 배열 순서가 저장 순서가 된다.
- [ ] 각 프로그램 안에서 시음 위스키를 최대 10개까지 추가/삭제할 수 있다.
- [ ] 생성 요청의 `specId`와 object `payload`가 스펙 계약에 맞게 전송된다.
- [ ] 기존 `PROGRAM` 상세는 읽기 전용 fallback 대신 수정 폼으로 렌더링된다.
- [ ] 종료일은 시작일보다 빠를 수 없고, 프로그램 종료 시간은 시작 시간보다
      빠를 수 없다.
- [ ] 기존 시음회/추천 위스키/페어링 생성·수정 동작이 유지된다.
- [ ] 지원하지 않는 스키마 구조는 잘못된 text input으로 조용히 렌더링하지 않고
      명시적인 지원 불가 상태를 표시한다.

## In Scope

- `PROGRAM` spec code 타입 추가.
- spec code 기반 동적 생성 라우트.
- 기존 생성 라우트의 단일 작성 페이지 통합.
- object requestSpec의 공통 스키마 기반 폼.
- primitive, enum, enum array, object array, 중첩 alcohol card list 렌더링.
- `PROGRAM` 생성과 수정.
- 생성 유형 카드의 프로그램 표시와 진입.
- 기존 시음회/추천 위스키/페어링 생성 화면의 공통 동적 라우트 통합.
- 스키마 파서, 폼 모델, validation, mapper, 페이지 테스트.

## Out of Scope

- 백엔드 `program.json` 변경.
- Product 앱의 프로그램 큐레이션 화면.
- requestSpec에 없는 프로그램 전용 앱 미리보기 자동 생성.
- 모든 JSON Schema 키워드와 임의 깊이의 재귀 구조 지원.
- 프로그램 배열의 드래그 앤 드롭 정렬. 이번 범위에서는 추가 순서를 저장 순서로
  유지한다.

## Open Questions

- `PROGRAM`의 enum 값은 스펙에 별도 한글 라벨 메타데이터가 없다. 이번 구현은
  enum code를 읽기 좋은 일반 표시 문자열로 변환한다. 정확한 한글 라벨이 필요하면
  백엔드 스펙에 enum 라벨 메타데이터 vocabulary를 추가해야 한다.
- 개발 API는 직접 인증 조회가 불가능해 배포된 응답 대신 backend `main`의
  `program.json`을 계약 소스로 사용한다.

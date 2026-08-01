# 시음회 가격 미정 Implementation Plan

## Summary

Spec 기반 시음회 폼의 `entryFee` 숫자 필드에 `is_tbc`를 제어하는 `가격 미정`
체크박스를 연결한다. 체크 시 참가비를 `0`으로 고정하고 입력을 비활성화하며,
payload·수정 복원·Admin 앱 미리보기에서 무료와 가격 미정을 구분한다.

## Inputs

- Spec: `docs/features/curation-tasting-event-price-tbc/spec.md`
- Design: `docs/features/curation-tasting-event-price-tbc/design.md`
- API source:
  - 2026-08-01 개발 API `WHISKY_TASTING_EVENT` spec v3.
  - `entryFee`: required integer, minimum `0`.
  - `is_tbc`: optional boolean, request/response 지원, response feed role `price-tbc`.
  - 공개 Admin API 문서는 아직 해당 필드를 노출하지 않는다.

## Data and API Mapping

- `GET /admin/api/v2/curation-specs/:specId`
  - `requestSpec.properties.is_tbc`는 기존 `JsonSchemaNode`와 동적 payload 타입으로
    수용 가능하므로 API 타입·서비스·hook 시그니처 변경은 없다.
- `POST /admin/api/v2/curations`, `PUT /admin/api/v2/curations/:curationId`
  - `buildWhiskyTastingEventPayload`가 `is_tbc`를 명시적으로 포함한다.
  - `is_tbc=true`이면 제출 시점에 `entryFee=0`을 강제한다.
- 상세 payload
  - `createWhiskyTastingEventFormStateFromCuration`은 `is_tbc` boolean을 복원한다.
  - 필드가 없는 기존 payload는 동적 기본값 `false`를 유지한다.
- Form model
  - `entryFee` number field에 연결 boolean checkbox 설정을 추가한다.
  - `is_tbc`는 payloadFields에는 유지하되 참가 정보 section의 독립 필드에서는
    제외한다.
- Preview model
  - `TastingEventPreviewPayload`에 `is_tbc`를 추가한다.
  - label 우선순위는 `is_tbc=true → 가격 미정`, `entryFee>0 → 금액`, 그 외 `무료`다.

## Implementation Steps

1. `CurationNumberFieldModel`에 다른 boolean form field를 제어하는 checkbox 옵션을
   추가하고, 공통 number renderer가 체크 상태·숫자 값·disabled 상태를 React Hook
   Form과 동기화하도록 확장한다. 기존 값 기반 `undecidedOption` 동작은 유지한다.
2. 시음회 form model에서 `entryFee`에 `가격 미정`, boolean key `is_tbc`, checked
   number value `0`, unchecked number value `0` 설정을 부여한다. `is_tbc`는 참가 정보
   section에서 숨겨 독립 라디오가 렌더링되지 않게 한다.
3. 시음회 submit mapper에서 `is_tbc=true`일 때 `entryFee=0`을 강제하고, 수정 초기값은
   기존 boolean normalization과 기본값 `false`를 사용한다.
4. 시음회 preview data와 preview label builder에 `is_tbc`를 전달하고 가격 미정 표시
   우선순위를 적용한다.
5. 테스트 fixture의 requestSpec에 개발 API와 동일한 optional `is_tbc`를 추가한다.
   form-model, mapper, 생성 payload, 수정 복원, preview model 및 preview 렌더링 테스트를
   먼저 실패하도록 추가한 뒤 구현한다.
6. 기존 라우트·메뉴·서비스·hook은 변경하지 않는다.

## Edge Cases

- `is_tbc=true`, `entryFee>0`인 비정상 기존 데이터도 수정 화면과 제출에서 가격 미정,
  `entryFee=0`으로 정규화한다.
- `is_tbc`가 없는 기존 payload는 `false`로 처리해 기존 무료·유료 표시를 유지한다.
- 가격 미정 해제 시 이전 유료 금액을 복원하지 않고 `0`을 유지한다.
- `entryFee=0`, `is_tbc=false`는 가격 미정이 아니라 무료다.
- requestSpec에서 `is_tbc`가 optional이어도 신규 payload에는 기본값 `false`를 포함한다.
- 모집 인원 미정은 기존 값 기반 checkbox와 이전 결정값 복원 동작을 그대로 유지한다.
- 서버 requestSpec에 `is_tbc`가 아직 없는 환경에서는 가격 미정 UI를 렌더링하지 않고
  기존 참가비 입력만 유지한다.

## Verification Checklist

- [ ] `pnpm test:run src/pages/curation/whisky-tasting-event/__tests__ src/pages/curation/_preview/__tests__/TastingEventPreview.test.tsx src/pages/curation/__tests__/CurationDetail.test.tsx`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] 개발 서버에서 시음회 작성 화면의 가격 미정 체크·해제 및 입력 disabled 확인.
- [ ] 체크 상태별 Admin 앱 미리보기 `가격 미정`/`무료`/유료 금액 확인.
- [ ] 수정 화면에서 기존 `is_tbc=true` 복원 확인.
- [ ] 좁은 viewport에서 참가비와 체크박스 배치 회귀 확인.

## Implementation Notes

- `src/components/ui`는 수정하지 않는다.
- 가격 미정 의미는 숫자 `0`이 아니라 `is_tbc`로 판단한다.
- checkbox는 `entryFee` FormField 내부에 렌더링하며 별도의 `is_tbc` 라디오를 만들지
  않는다.
- 사용자 앱 상세·피드 구현과 `PROGRAM` 폼은 이 계획에 포함하지 않는다.
- 서버 스키마 기반 payload 조립 구조를 유지하고 `is_tbc` 전용 API 타입을 중복 정의하지
  않는다.

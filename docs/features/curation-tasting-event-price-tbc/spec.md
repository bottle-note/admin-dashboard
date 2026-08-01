# 시음회 가격 미정 Spec

## Summary

Admin 시음회 등록·수정 폼에서 `0원(무료)`과 `가격 미정`을 구분한다. 운영자가
가격 미정을 선택하면 참가비는 `0`으로 고정하고 `is_tbc=true`로 저장하며, 앱은
`is_tbc`를 기준으로 가격 미정 문구를 노출한다.

## Source Inputs

- API docs/response shape:
  - 공개 Admin API 문서에는 2026-08-01 기준 `is_tbc`가 아직 노출되지 않는다.
  - 개발 API의 `WHISKY_TASTING_EVENT` spec v3에서 `entryFee`는 필수 integer,
    최소값 `0`이며, `is_tbc`는 optional boolean이다.
  - 개발 API의 responseSpec은 `entryFee`를 feed role `price`, `is_tbc`를 feed role
    `price-tbc`로 노출한다.
  - Backend 계약 이슈: [bottle-note/workspace#359](https://github.com/bottle-note/workspace/issues/359)
- Existing UI/code references:
  - `src/pages/curation/whisky-tasting-event/WhiskyTastingEventForm.tsx`
  - `src/pages/curation/whisky-tasting-event/whisky-tasting-event.form-model.ts`
  - `src/pages/curation/whisky-tasting-event/whisky-tasting-event.mapper.ts`
  - `src/pages/curation/components/CurationFormFieldRenderer.tsx`
  - `src/pages/curation/_preview/buildTastingEventPreviewModel.ts`
- User request:
  - [bottle-note/workspace#360](https://github.com/bottle-note/workspace/issues/360)
  - 참가비 입력의 무료 의미를 유지하면서 옆에 `가격 미정` 체크박스를 추가한다.
  - 가격 미정 선택 시 `entryFee=0`, `is_tbc=true`로 저장하고 참가비 입력은
    비활성화한다.
  - 앱은 `is_tbc=true`이면 `entryFee`와 관계없이 가격 미정으로 표시한다.

## Admin Workflow

- 시음회 등록 화면은 참가비 입력과 함께 `가격 미정` 체크박스를 제공한다.
- 체크박스를 선택하면 참가비를 `0`으로 변경하고 입력을 비활성화한다.
- 체크박스를 해제하면 참가비 입력을 다시 활성화하며 값 `0`은 무료를 뜻한다.
- 시음회 수정 화면은 기존 payload의 `is_tbc`로 체크 상태를 복원한다.
- 미리보기는 `is_tbc=true`일 때 참가비 대신 `가격 미정`을 표시한다.
- 저장 후 다시 수정 화면에 진입해 가격 상태가 유지되는지 확인한다.

## Data Requirements

- `entryFee`: requestSpec 필수 integer, 최소 `0`.
- `is_tbc`: requestSpec optional boolean. 신규 생성 시에도 명시적으로 `false` 또는
  `true`를 전송한다.
- `is_tbc=true`이면 제출 payload의 `entryFee`는 항상 `0`이다.
- `is_tbc=false`이고 `entryFee=0`이면 무료다.
- 수정 데이터에 `is_tbc`가 없으면 하위 호환을 위해 `false`로 복원한다.
- 가격 미정 해제 직후 `entryFee`는 `0`을 유지하며, 운영자가 무료 또는 유료 금액을
  직접 결정한다.

## Acceptance Criteria

- [ ] Admin 시음회 생성·수정 화면에서 `가격 미정`을 선택·해제할 수 있다.
- [ ] 가격 미정 선택 시 참가비가 `0`이 되고 참가비 입력이 비활성화된다.
- [ ] 가격 미정 선택 시 `entryFee=0`, `is_tbc=true`가 저장된다.
- [ ] 가격 미정 해제 시 `is_tbc=false`가 저장되고 참가비 입력이 활성화된다.
- [ ] `entryFee=0`, `is_tbc=false`는 무료로 저장·표시된다.
- [ ] 수정 화면에서 `is_tbc=true` 상태가 체크 및 비활성화 상태로 복원된다.
- [ ] `is_tbc`가 없는 기존 시음회는 가격 미정이 아닌 상태로 복원된다.
- [ ] Admin 앱 미리보기는 가격 미정과 무료·유료를 구분해 표시한다.
- [ ] 기존 시음회 생성·수정 및 모집 인원 미정 동작에 회귀가 없다.

## In Scope

- Admin 시음회 등록·수정 폼의 가격 미정 체크박스와 참가비 연동.
- 시음회 form model, 초기값/수정 복원, validation, 제출 mapper의 `is_tbc` 처리.
- Admin 시음회 앱 미리보기의 가격 미정 표기.
- 관련 단위 및 화면 테스트.

## Out of Scope

- 사용자 앱 상세·피드의 실제 렌더링 변경. 앱은 전달된 `is_tbc`를 기준으로 별도
  처리한다.
- `PROGRAM` 큐레이션 폼의 가격 미정 UI.
- Backend API 또는 requestSpec/responseSpec 변경.
- 기존 저장 데이터 migration.

## Open Questions

- None.

# Curation V2 Component Structure

큐레이션 v2 화면은 spec code별 page component가 presentation 조립을 맡고, 저장 폼과 API 계층은 공유한다.

```mermaid
flowchart TD
  Routes["src/routes/index.tsx"] --> Entry["CurationEntryPage"]
  Routes --> TastingCreate["CurationWhiskyTastingEventCreatePage"]
  Routes --> RecommendedCreate["CurationRecommendedWhiskyCreatePage"]
  Routes --> PairingCreate["CurationWhiskyPairingCreatePage"]
  Routes --> Detail["CurationDetailPage"]

  Detail -->|"WHISKY_TASTING_EVENT"| TastingEdit["CurationWhiskyTastingEventEditPage"]
  Detail -->|"RECOMMENDED_WHISKY"| RecommendedEdit["CurationRecommendedWhiskyEditPage"]
  Detail -->|"WHISKY_PAIRING"| PairingEdit["CurationWhiskyPairingEditPage"]
  Detail -->|"unknown spec"| ReadOnlyDetail["CurationDetailContent"]

  TastingCreate --> TastingGate["WhiskyTastingEventCreateGate"]
  TastingGate --> TastingForm["WhiskyTastingEventForm"]
  TastingEdit --> TastingForm

  RecommendedCreate --> WhiskyGate["WhiskyCurationCreateGate"]
  PairingCreate --> WhiskyGate
  WhiskyGate --> WhiskyForm["WhiskyCurationForm"]
  RecommendedEdit --> WhiskyForm
  PairingEdit --> WhiskyForm

  RecommendedCreate --> RecommendedPresentation["showCommentField: true"]
  RecommendedEdit --> RecommendedPresentation
  RecommendedPresentation --> WhiskyForm

  PairingCreate --> PairingPresentation["showCommentField: false<br/>renderItemExtra: WhiskyPairingFields"]
  PairingEdit --> PairingPresentation
  PairingPresentation --> WhiskyForm

  TastingForm --> BasicInfo["CurationBasicInfoSection<br/>label: 광고노출 시작일/종료일"]
  WhiskyForm --> BasicInfoCuration["CurationBasicInfoSection<br/>label: 노출 시작일/종료일"]
  WhiskyForm --> ImageSection["CurationImageSection"]

  TastingForm --> FormSection["CurationFormSection"]
  WhiskyForm --> FormSection
  FormSection --> FieldRenderer["CurationFormFieldRenderer"]
  FieldRenderer --> WhiskyCardList["CurationWhiskyCardListField"]
  PairingPresentation --> PairingFields["WhiskyPairingFields"]

  TastingForm --> TastingPreview["CurationSpecTastingEventPreview"]
  WhiskyForm --> WhiskyPreview["WhiskyCurationPreviewPanel"]
  WhiskyPreview --> AppPreview["WhiskyCurationPreview"]

  TastingForm --> Mutations["useCurationCreate / useCurationUpdate"]
  WhiskyForm --> Mutations
  Mutations --> Service["curationService"]
  Service --> ApiTypes["src/types/api/curation.api.ts"]
```

## Entry Points

- 시음회 생성: `src/pages/curation/whisky-tasting-event/CurationWhiskyTastingEventCreate.tsx`
- 시음회 수정: `src/pages/curation/whisky-tasting-event/CurationWhiskyTastingEventEdit.tsx`
- 추천 위스키 생성: `src/pages/curation/whisky-curation/CurationRecommendedWhiskyCreate.tsx`
- 추천 위스키 수정: `src/pages/curation/whisky-curation/CurationRecommendedWhiskyEdit.tsx`
- 위스키 페어링 생성: `src/pages/curation/whisky-curation/CurationWhiskyPairingCreate.tsx`
- 위스키 페어링 수정: `src/pages/curation/whisky-curation/CurationWhiskyPairingEdit.tsx`

## Shared Layers

- `WhiskyTastingEventCreateGate`, `WhiskyCurationCreateGate`: spec list/detail loading and blocking states.
- `WhiskyTastingEventForm`, `WhiskyCurationForm`: create/update mutation and common form layout.
- `CurationBasicInfoSection`: shared basic fields. Tasting event keeps ad exposure copy; recommendation and pairing override to plain exposure copy.
- `CurationFormSection` and `CurationFormFieldRenderer`: JSON schema-derived payload fields.
- `curation.api.ts` -> `curation.service.ts` -> `useCurations.ts`: API type, service, TanStack Query hook ownership.

## Preview Ownership

- 앱 미리보기 presentation은 `src/pages/curation-spec/components/preview/`가 소유한다.
- `CurationSpecTastingEventPreview`는 React Hook Form 값 구독과 admin card 조립만 담당한다.
- `TastingEventPreview`는 `WhiskyTastingEventFormValues` 중 필요한 필드를 직접 받아 렌더링한다.
- 별도의 전체 preview model builder는 두지 않고 날짜, 참가비, 모집 상태처럼 규칙이 있는 계산만 작은 순수 함수로 유지한다.
- preview 모듈은 barrel을 만들지 않고 필요한 파일을 직접 import한다.

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

  TastingForm --> TastingPreview["WhiskyTastingEventPreviewPanel"]
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

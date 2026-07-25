# Program Schema-Driven Curation Form Implementation Plan

## Summary

Add `PROGRAM` as a known curation spec and use one spec-code create route/page
for every curation type. The page resolves the list/detail spec once, then
selects a form-model/renderer strategy from the resolved spec. Extend the
shared curation schema vocabulary with enum select, enum multi-select, and
object array fields. Refactor the shared whisky card list to use its model key
as a React Hook Form path so each program can own an independent nested whisky
list. Preserve the specialized form renderers where their interaction model is
not expressible by the generic renderer, but remove page-level routing and
spec-query ownership from them.

## Inputs

- Spec: `docs/features/curation-program-schema-form/spec.md`
- Design: `docs/features/curation-program-schema-form/design.md`
- API source:
  - Published admin API docs for curation spec list/detail and curation
    create/update endpoints.
  - Backend `main` resource
    `bottlenote-mono/src/main/resources/openapi/curation/program.json`,
    introduced by backend commit `d7944c51`.
  - The development API could not be authenticated through direct probing, and
    the published docs do not yet include a `PROGRAM` example.

## Data and API Mapping

- `CurationSpecCode.PROGRAM` -> known code used by entry routing and detail form
  dispatch.
- `/dashboard/curations/specs/:specCode/new` ->
  `useCurationSpecByCode(specCode)` -> `useCurationSpec(specId)` -> dynamic form
  model/renderer strategy.
- Known create strategies:
  - `WHISKY_TASTING_EVENT` -> tasting-event form model and form renderer.
  - `RECOMMENDED_WHISKY`, `WHISKY_PAIRING` -> whisky-curation form model and
    form renderer.
  - object requestSpec, including `PROGRAM` -> generic schema-driven form model
    and renderer.
- `requestSpec.properties` -> ordered root payload field models.
- `string enum` -> single select field with enum values as options.
- `array` with `items.enum` -> multi-select checkbox field.
- `array` with `items.type === object` -> object array field with recursively
  parsed item property models.
- `x-field-style: alcohol-card-list` -> shared whisky card list field whose
  `key` may be a nested path such as `programs.0.whiskies`.
- `required`, `nullable`, `minLength`, `maxLength`, `minimum`, `maximum`,
  `minItems`, `maxItems` -> initial values and Zod validation.
- Common curation fields -> existing `CurationBasicInfoSection`.
- Create form -> `POST /admin/api/v2/curations` with `specId`, common fields,
  and object `payload`.
- Edit form -> `PUT /admin/api/v2/curations/{curationId}` with the same shape.
- `CurationV2Detail.payload` -> recursively normalized edit form values.

## Implementation Steps

1. Extend the curation API/code vocabulary.
   - Add `PROGRAM` to `CurationSpecCode` in
     `src/types/api/curation.api.ts`.
   - Update `src/pages/curation/curation-display-utils.ts` to show `프로그램`
     for the known code.
2. Extend the shared schema-driven field model.
   - In `src/pages/curation/curation-form-model.ts`, add:
     - single enum select model,
     - enum multi-select model,
     - recursively parsed object array model.
   - Resolve supported array/object shapes explicitly. Throw a descriptive
     error for unsupported schema structures instead of falling back to text.
   - Preserve property order from `requestSpec.properties`.
   - Add a helper that prefixes a field model key recursively for nested React
     Hook Form paths.
3. Extend shared rendering and validation.
   - Add single enum and multi-enum inputs to
     `src/pages/curation/components/CurationFormFieldRenderer.tsx`.
   - Add
     `src/pages/curation/components/CurationObjectArrayField.tsx` for
     add/remove and nested item rendering.
   - Extend `src/pages/curation/curation-form-schema.ts` with recursive Zod
     generation for all supported field kinds and shared whisky-card item
     validation.
4. Make the shared whisky list path-aware.
   - Refactor
     `src/pages/curation/components/CurationWhiskyCardListField.tsx` so
     `useFieldArray`, `useWatch`, `getValues`, `setValue`, `clearErrors`,
     error lookup, and nested registration paths derive from
     `fieldModel.key`.
   - Keep current root `alcohols` behavior unchanged for tasting events and
     whisky curations.
5. Add the generic object-payload form pipeline under
   `src/pages/curation/schema-driven/`.
   - `schema-driven-curation.form-model.ts`: create root sections from
     requestSpec; separate object arrays into their own sections.
   - `schema-driven-curation.schema.ts`: combine common curation validation
     with recursive payload validation and add the `PROGRAM` date/time
     cross-field checks.
   - `schema-driven-curation.mapper.ts`: create defaults, hydrate edit values,
     and recursively serialize trimmed payload values while preserving array
     order.
   - `SchemaDrivenCurationForm.tsx`: render common info and generated sections,
     submit create/update mutations, and handle upload/submission states.
   - `CurationCreate.tsx`: read `specCode` from route params, resolve active
     spec list/detail once, handle unsupported schema errors, and select/render
     the correct form strategy from the resolved spec.
   - `SchemaDrivenCurationEditPage.tsx`: build and render the same form from a
     loaded `CurationV2Detail`.
6. Integrate navigation and detail dispatch.
   - Render `CurationCreatePage` only at
     `/dashboard/curations/specs/:specCode/new` with the existing curation
     roles.
   - Keep the three prior type-specific paths as redirects to the shared route;
     they must not render or query a separate page.
   - Add `PROGRAM` UI metadata to `CurationEntry.tsx`.
   - Route every active card to the shared spec-code path without per-card
     href configuration.
   - Hide preview action for specs without a supported app preview, including
     `PROGRAM`.
   - Dispatch `PROGRAM` detail to `SchemaDrivenCurationEditPage` in
     `CurationDetail.tsx`.
7. Add tests first for each behavior before its implementation.
   - Extend `src/pages/curation/__tests__/CurationEntry.test.tsx` for the
     program card, no preview action, and shared route navigation for all
     known and unknown active specs.
   - Add
     `src/pages/curation/schema-driven/__tests__/schema-driven-curation.form-model.test.ts`
     for primitive/enum/enum-array/object-array/nested whisky parsing and
     unsupported structure errors.
   - Add
     `src/pages/curation/schema-driven/__tests__/schema-driven-curation.schema.test.ts`
     for required/limits/date/time validation.
   - Add
     `src/pages/curation/schema-driven/__tests__/SchemaDrivenCurationPages.test.tsx`
     for create rendering, nested program whisky isolation, create payload,
     edit hydration, and update payload.
   - Add a shared create-page dispatch test proving that the same page renders
     the tasting-event, whisky-curation, and generic strategies after one spec
     lookup.
   - Retain and run existing curation form/page tests as regressions.

## Edge Cases

- An inactive or missing URL spec code shows the existing missing-spec state.
- A malformed or unsupported schema shows a blocking unsupported-spec state;
  it does not render an incorrect generic text field.
- Optional enum arrays start empty and stop accepting values at `maxItems`.
- Programs start empty so the `minItems` error is observable on submit.
- Removing a program removes only its nested whisky list and React Hook Form
  errors.
- Nested field paths remain stable after removing an earlier program.
- Optional empty strings/arrays are excluded from serialized payload objects;
  required empty values remain available for validation.
- Nullable API values hydrate as empty UI values.
- Nested DB/manual whisky mapping follows the existing shared card contract and
  removes UI-only stats only when they are absent.
- Existing root `alcohols` pages continue using the same component behavior.
- Program app preview is intentionally absent until a response/display
  vocabulary is defined.

## Verification Checklist

- [x] `pnpm test:run`
- [ ] `pnpm lint`
- [x] Changed-file ESLint and Prettier checks
- [x] `pnpm build`
- [ ] Manual UI: open `/dashboard/curations/new` and confirm the `PROGRAM`
      card enters `/dashboard/curations/specs/PROGRAM/new`.
- [ ] Manual UI: add two programs and different whisky lists, then confirm
      independent state, responsive layout, and submitted array order.
- [ ] Manual UI: open an existing `PROGRAM` curation and confirm edit hydration.

## Implementation Notes

- Do not duplicate list/detail spec queries inside specialized create gates.
- Specialized form components may remain as renderer strategies, but all
  runtime create navigation and page-level state must be owned by
  `CurationCreatePage`.
- The dynamic engine supports the schema vocabulary listed in the feature spec,
  not arbitrary JSON Schema.
- Do not add static `PROGRAM` payload TypeScript interfaces that duplicate
  `requestSpec`; form state remains a recursive record/array shape.
- Do not hardcode `programs.0.whiskies` in the whisky component. All paths must
  derive from field models.
- Do not add program-specific enum label maps. Use a generic readable enum
  formatter until the backend publishes enum label metadata.
- Do not edit `src/components/ui`.
- New React components must each live in their own file.

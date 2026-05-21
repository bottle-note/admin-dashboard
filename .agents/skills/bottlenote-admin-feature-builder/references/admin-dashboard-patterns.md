# Bottlenote Admin Dashboard Patterns

Use this reference after a Bottlenote admin feature skill triggers and before
writing `spec.md`, `design.md`, `plan.md`, or implementation changes.

## Stack

- Vite + React 18 + TypeScript
- React Router 7
- TanStack Query 5
- React Hook Form + Zod
- Zustand for auth/sidebar UI state only
- shadcn/ui primitives in `src/components/ui`
- Vitest + Testing Library + MSW
- Playwright E2E with Page Object classes

## API-Backed Domain Work

Follow this order:

1. `src/types/api/{domain}.api.ts`
   - Endpoint constants.
   - Namespaced API type interface.
   - Helper type aliases.
2. `src/services/{domain}.service.ts`
   - Query keys via `createQueryKeys`.
   - API calls through `apiClient`.
   - Response normalization into `{ items, meta }` for paginated lists.
3. `src/hooks/use{Domain}.ts`
   - Query hooks with stable keys.
   - Mutation hooks with invalidation and Korean toast messages.
4. `src/pages/{domain}`
   - List/detail pages.
   - Schema files for forms.
   - Domain-specific form hooks when state is complex.
5. `src/routes/index.tsx` and `src/config/menu.config.ts`
   - Add routes and sidebar entries only when the feature introduces navigation.

## Feature Definition From API Docs

When the backend documentation or response shape is the starting point:

1. Extract available list/detail/create/update/delete/status/reorder endpoints.
2. Map list response fields to table columns and filters.
3. Map detail response fields to read-only fields, editable inputs, associated
   entity selectors, images, status controls, and validation rules.
4. Map mutation request fields to Zod schemas and submit payloads.
5. Identify gaps that need user decisions: labels, sidebar placement, destructive
   confirmation copy, required fields, or missing backend semantics.

## Feature Docs

Feature docs are committed repo artifacts under:

```text
docs/features/<feature-slug>/
├── spec.md
├── design.md
└── plan.md
```

- `spec.md`: product/API requirements and acceptance criteria.
- `design.md`: admin UI structure using existing components and tokens.
- `plan.md`: decision-complete implementation instructions.
- `.context/`: temporary scratch notes only.

## Existing Anchors

- Banners: `src/pages/banners`, `src/hooks/useBanners.ts`,
  `src/services/banner.service.ts`, `src/types/api/banner.api.ts`
- Curations: `src/pages/curations`, `src/hooks/useCurations.ts`,
  `src/services/curation.service.ts`, `src/types/api/curation.api.ts`
- Tasting tags: `src/pages/tasting-tags`, `src/hooks/useTastingTags.ts`,
  `src/services/tasting-tag.service.ts`,
  `src/types/api/tasting-tag.api.ts`
- Whisky: `src/pages/whisky`, `src/hooks/useAdminAlcohols.ts`,
  `src/services/admin-alcohol.service.ts`,
  `src/types/api/alcohol.api.ts`

## Forms

- Use React Hook Form and Zod.
- Keep schemas in `src/pages/{domain}/*.schema.ts`.
- Use `FormField` for labels, required markers, and errors.
- Fields are required by default unless optionality is explicit.
- For associated entity editing, keep local state and send bulk diffs on save.

## Lists

- Keep search, filter, sort, and pagination in URL params.
- Treat page numbers as 0-based.
- Use project pagination components and existing table styling.
- Invalidate list/detail query keys after mutations.

## UI Verification

- Check that the page fits the existing admin dashboard visual language.
- Verify loading, empty, error, and mutation states when practical.
- For new routes, verify sidebar navigation and direct URL access.
- For forms, verify required markers, validation messages, submit disabled or
  error behavior, and success navigation.
- For table/list pages, verify search/filter/page params remain in the URL.

## Tests

- Hook tests: `src/hooks/__tests__/use*.test.ts`
- Service tests: `src/services/__tests__/*.service.test.ts`
- Page/component tests: `src/pages/{domain}/__tests__/*.test.tsx`
- E2E specs: `e2e/specs/*.spec.ts`
- E2E Page Objects: `e2e/pages/*.page.ts`

Prefer a focused regression test for every bug fix when the behavior can be
tested without excessive setup.

# Bottlenote Admin Dashboard Agent Guide

This is the shared instruction file for coding agents working in this
repository. Keep tool-specific instructions in their own files only when they
are not useful to other agents.

## Project

Bottlenote Admin Dashboard is a Vite + React 18 + TypeScript admin app for
managing whisky tasting platform data such as banners, curations, whisky,
tasting tags, users, inquiries, policies, and distilleries.

## Project-Local Skills

Project-specific agent skills live in `.agents/skills` and belong to this
repository. Do not rely on user-global skills for Bottlenote admin workflow.

When a user request matches one of these project skills, open the skill's
`SKILL.md` and follow it before planning or editing:

- `.agents/skills/bottlenote-admin-feature-builder/SKILL.md`: use as the
  router for vague admin feature, bug, API, implementation, verification, or PR
  requests.
- `.agents/skills/bottlenote-admin-feature-spec/SKILL.md`: use to turn API
  docs, response shapes, and product intent into
  `docs/features/<feature-slug>/spec.md`.
- `.agents/skills/bottlenote-admin-feature-design/SKILL.md`: use to turn an
  approved `spec.md` into `docs/features/<feature-slug>/design.md` using this
  app's existing shadcn/Tailwind admin UI patterns.
- `.agents/skills/bottlenote-admin-feature-plan/SKILL.md`: use to turn
  `spec.md` and `design.md` into a decision-complete
  `docs/features/<feature-slug>/plan.md`.
- `.agents/skills/bottlenote-admin-feature-implement/SKILL.md`: use to
  implement from `docs/features/<feature-slug>/plan.md` without reinterpreting
  the spec/design.
- `.agents/skills/bottlenote-admin-api/SKILL.md`: use for API documentation
  checks, endpoint additions or changes, request/response type mismatches, and
  types/services/hooks API contract work. For feature work, include API
  findings in that feature's `spec.md` and `plan.md`.
- `.agents/skills/bottlenote-admin-korean-pr/SKILL.md`: use when the user asks
  to prepare or create a Korean PR for completed work.

Use `.context/` only for temporary scratch notes, unresolved investigation
state, or Conductor handoff details that should not be committed. Feature
requirements and implementation decisions should live under
`docs/features/<feature-slug>/`.

Typical delivery flow:

1. Read the latest API docs or provided response shape.
2. Write or update `docs/features/<feature-slug>/spec.md`.
3. Write or update `docs/features/<feature-slug>/design.md`.
4. Write or update `docs/features/<feature-slug>/plan.md`.
5. Implement only from `plan.md` following existing project structure.
6. Verify with code tests and UI/manual checks.
7. Let the user inspect the result.
8. Create a Korean PR when requested.

## Commands

```bash
pnpm dev           # development server, dev environment
pnpm dev:local     # development server, local environment
pnpm build         # production build
pnpm test          # unit/hook tests in watch mode
pnpm test:run      # unit/hook tests once
pnpm test:e2e      # Playwright E2E tests
pnpm test:e2e:ui   # Playwright UI mode
pnpm test:all      # unit + E2E tests
pnpm lint          # ESLint
```

## Architecture

```text
src/
├── components/
│   ├── common/     # reusable components
│   ├── layout/     # admin layout, sidebar, header
│   └── ui/         # shadcn/ui primitives; do not edit directly
├── pages/          # route-level page components
├── hooks/          # custom hooks
├── services/       # API service layer
├── stores/         # Zustand stores
├── types/api/      # API type definitions
└── lib/            # utilities and API client setup
```

## API Pattern

New API work follows the 3-layer order:

1. `src/types/api/*.api.ts` defines endpoints and request/response types.
2. `src/services/*.service.ts` implements API calls and query keys.
3. `src/hooks/use*.ts` wraps TanStack Query hooks.

Do not define duplicate API types outside `src/types/api/`. Components should
not call `fetch`, `axios`, or service functions directly when a project hook
should own the data flow.

## Forms

Use React Hook Form + Zod schemas for forms. Place schemas in
`src/pages/{domain}/*.schema.ts`.

All fields are required by default unless there is a clear product or API
reason for optional input. Use `FormField` from `src/components/common` to show
labels, required markers, and validation errors consistently.

## Related Entities

For related entity management, follow the tasting tag pattern:

1. Keep the initial IDs for diffing.
2. Manage add/remove interactions in local state.
3. On save, calculate `toAdd` and `toRemove`.
4. Call bulk add/remove APIs after the main save.

## Tests

For new hooks, services, and page behavior, write tests first unless the change
is styling-only, type-only, or configuration-only.

Test locations:

| Target | Location |
| --- | --- |
| `hooks/use*.ts` | `src/hooks/__tests__/use*.test.ts` |
| `pages/domain/*.tsx` | `src/pages/domain/__tests__/*.test.tsx` |
| `services/*.service.ts` | `src/services/__tests__/*.service.test.ts` |

Use MSW mocks from `src/test/mocks/` and test utilities from
`src/test/test-utils.tsx`.

## E2E

Playwright specs live in `e2e/specs/` and use Page Object classes from
`e2e/pages/`. Auth uses `e2e/fixtures/auth.fixture.ts`.

E2E tests require `VITE_E2E_TEST_ID` and `VITE_E2E_TEST_PW`.

## Conventions

- Do not edit `src/components/ui/`; those files are generated shadcn/ui
  primitives.
- Do not create new barrel files such as `index.ts` unless there is an existing
  local pattern that requires one.
- Import modules directly instead of through broad barrels.
- Keep server data in TanStack Query, not Zustand. Zustand should stay limited
  to UI/auth state such as sidebar and auth.
- Keep search, filters, and pagination in URL parameters when they affect list
  pages.
- Pagination is 0-based because that is the backend API contract.
- Toast messages and user-facing admin copy should be Korean unless nearby UI
  establishes otherwise.
- Prefer ratio-, fraction-, and container-based responsive layouts over fixed
  pixel widths for page grids and major layout columns. Use fixed dimensions
  only for intrinsic UI elements such as icons, controls, thumbnails, or when a
  product/design constraint explicitly requires it.
- Use `useMemo` and `useCallback` only when they solve a real referential
  stability or measured performance problem.
- Leave unrelated worktree changes alone.

## Reference Files

- API type pattern: `src/types/api/tasting-tag.api.ts`
- Service pattern: `src/services/tasting-tag.service.ts`
- Hook pattern: `src/hooks/useTastingTags.ts`
- Hook test pattern: `src/hooks/__tests__/useTastingTags.test.ts`
- List page pattern: `src/pages/banners/BannerList.tsx`
- Detail page pattern: `src/pages/banners/BannerDetail.tsx`
- Page Object pattern: `e2e/pages/tasting-tag-list.page.ts`

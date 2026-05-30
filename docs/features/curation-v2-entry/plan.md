# Curation V2 Entry Implementation Plan

## Summary

Replace the previous `/curations/spec` list/form-first plan with a dashboard-level curation v2 entry page. The first page is a type selector for non-root-only admins, with three cards ordered `시음회`, `일반 큐레이션`, `페어링` and an empty preview panel reserved for future preview images.

## Inputs

- Spec: `docs/features/curation-v2-entry/spec.md`
- Design: `docs/features/curation-v2-entry/design.md`
- API source:
  - No API call is needed for this entry page.
  - Backend type codes are not needed in this entry page.

## Data and API Mapping

- Static type config in the page or a local module:
  - `시음회`
    - label: `시음회`
    - href: `/dashboard/curations/tasting-events/new`
  - `일반 큐레이션`
    - label: `일반 큐레이션`
    - href: `/dashboard/curations/general/new`
  - `페어링`
    - label: `페어링`
    - href: `/dashboard/curations/pairings/new`
- Entry route:
  - `GET` page route only: `/dashboard/curations`
  - No TanStack Query hook is needed.
- Role guard:
  - Use existing `RoleProtectedRoute`.
  - Allowed roles: `ROOT_ADMIN`, `BAR_OWNER`, `COMMUNITY_MANAGER`.

## Implementation Steps

1. Add page component.
   - Create `src/pages/curations/CurationV2Entry.tsx`.
   - Render common `PageHeader`, type card list, and right preview panel.
   - Keep type config in the same file unless it grows or is reused by later forms.
2. Build the type cards.
   - Order must be `시음회`, `일반 큐레이션`, `페어링`.
   - Each card shows label, description, input summary chips, `작성하기`, and `미리보기`.
   - Do not include or render backend type codes as visible badges/tags.
   - `작성하기` uses `Link` or `navigate` to the type-specific route target.
   - `미리보기` updates local selected type state only.
3. Build the preview panel.
   - Use a card with title `미리보기`.
   - Reserve an empty bordered/dashed area.
   - Do not render mock image, generated image, phone frame, or gradient preview.
   - If a type is selected, show selected type in the panel metadata/header only; keep body empty.
4. Update sidebar menu.
   - In `src/config/menu.config.ts`, add a `큐레이션` item under the existing `dashboard` group.
   - Path: `/dashboard/curations`.
   - Icon: `Layers` or `BookOpen`.
   - Roles: `['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']`.
   - Keep existing ROOT-only `큐레이션 관리` group unchanged for now.
5. Update routes.
   - Import `CurationV2EntryPage`.
   - Add route `dashboard/curations`.
   - Wrap with `RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}`.
   - Type-specific create routes can be added as placeholders only if the implementation needs clickable links to resolve locally; otherwise leave links ready for the next feature stage.
6. Add focused tests.
   - Add `src/pages/curations/__tests__/CurationV2Entry.test.tsx`.
   - Assert card order: `시음회`, `일반 큐레이션`, `페어링`.
   - Assert all cards expose `작성하기` and `미리보기`.
   - Assert preview panel exists and does not contain an image.
   - Assert preview button updates selected type label without changing route.
7. Update docs/prototype only if implementation changes the agreed entry layout.

## Edge Cases

- Do not reuse the old `/curations/spec` route from the discarded plan.
- Do not put type switching tabs inside the future create/edit forms.
- Do not expose this entry only to `ROOT_ADMIN`; `BAR_OWNER` and `COMMUNITY_MANAGER` must be included.
- Do not add `CLIENT` or `PARTNER` until product confirms access.
- Existing legacy `/curations` pages remain ROOT-only and should not be renamed in this entry task.
- Preview body must remain empty until real preview assets or rendering rules are provided.

## Verification Checklist

- [ ] `pnpm test:run src/pages/curations/__tests__/CurationV2Entry.test.tsx`
- [ ] `pnpm lint`
- [ ] Manual UI check: sidebar dashboard group shows a single `큐레이션` tab.
- [ ] Manual UI check: `/dashboard/curations` is accessible to allowed curation roles.
- [ ] Manual UI check: card order is `시음회`, `일반 큐레이션`, `페어링`.
- [ ] Manual UI check: preview panel reserves space but renders no image.
- [ ] Manual UI check: narrow viewport stacks cards and preview without overlap.

## Implementation Notes

- This plan intentionally replaces the earlier spec-based list/form plan.
- Keep existing ROOT-only legacy curation pages untouched.
- Use shadcn primitives and existing Tailwind tokens.
- Keep admin-facing copy in Korean.
- Do not create new API types, services, or hooks for the entry page.

---
name: bottlenote-admin-feature-design
description: >
  Create or update Bottlenote admin feature UI design docs in
  docs/features/{feature-slug}/design.md from an approved spec.md and existing
  shadcn/Tailwind admin dashboard patterns. Use when Codex needs to define
  route/sidebar placement, list/detail/form UI, states, validation copy, and
  manual UI review points before implementation planning. Trigger on design,
  UI structure, 화면 설계, 디자인 문서, or admin page layout requests.
---

# Bottlenote Admin Feature Design

Use this skill to write the committed UI design document for a feature. The
design must follow the existing admin dashboard, not invent a new visual system.

## Workflow

1. Read the source spec.
   - Require `docs/features/<feature-slug>/spec.md`.
   - If the spec is missing, route back to `bottlenote-admin-feature-spec`.

2. Inspect local UI patterns.
   - Read `AGENTS.md`.
   - Review similar pages in `src/pages/banners`, `src/pages/curations`,
     `src/pages/tasting-tags`, or `src/pages/whisky`.
   - Check shared components such as `DetailPageHeader`, `FormField`,
     `Pagination`, `StatusToggle`, `ImageUpload`, and shadcn `Table`, `Card`,
     `Button`, `Select`, `Input`, `Dialog`.
   - Use `tailwind.config.js`, `src/index.css`, and `components.json` for token
     and component style constraints.

3. Write or update `docs/features/<feature-slug>/design.md`:

```markdown
# <Feature Name> Design

## UI Summary

<High-level admin UI approach.>

## Navigation

- Route:
- Sidebar/menu placement:
- Entry actions:

## List View

- Columns:
- Filters/search:
- Row actions:
- Empty/loading/error states:

## Detail/Create/Edit View

- Sections/cards:
- Fields:
- Validation messages:
- Primary/secondary actions:

## State and Feedback

- Loading:
- Empty:
- Error:
- Success:
- Destructive confirmation:

## Design System Usage

- Components:
- Tokens/classes:
- Existing pages to mirror:

## Manual UI Review Points

- [ ] <What the user should inspect visually or interactively.>
```

## Guardrails

- Do not write implementation order or API service details.
- Do not modify `src/components/ui`.
- Prefer existing dense admin layouts over marketing-style composition.
- Use Korean for labels, validation, and destructive confirmation copy.

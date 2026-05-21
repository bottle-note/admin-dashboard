---
name: bottlenote-admin-feature-spec
description: >
  Create or update Bottlenote admin feature specifications in
  docs/features/{feature-slug}/spec.md from user intent, API documentation,
  response shapes, and existing dashboard behavior. Use before design,
  planning, or implementation for new admin pages, workflows, API-backed
  features, or substantial feature changes. Trigger on requests for feature
  definition, spec writing, requirements, acceptance criteria, or Korean
  requests like "기능 정의", "스펙 작성", "요구사항 정리".
---

# Bottlenote Admin Feature Spec

Use this skill to write the committed feature specification for a Bottlenote
admin feature. Do not design UI details or implementation steps here.

## Workflow

1. Choose the feature slug.
   - Use lowercase hyphen-case English, e.g. `notice-management`.
   - If the user supplies an existing feature doc path, use that path.
   - Create or update `docs/features/<feature-slug>/spec.md`.

2. Gather requirements.
   - Read `AGENTS.md`.
   - Inspect similar existing pages and API layers with `rg`.
   - If API docs or response shapes are involved, use `bottlenote-admin-api` to
     identify endpoints, fields, and contract assumptions.
   - Keep feature-related API analysis inside this `spec.md`; do not create a
     standalone API report by default.

3. Ask only blocker questions.
   - Ask if the target admin workflow, destructive behavior, user-visible
     labels, or backend semantics cannot be inferred.
   - Otherwise state assumptions in the spec.

4. Write `spec.md` with this shape:

```markdown
# <Feature Name> Spec

## Summary

<What this admin feature does and why it exists.>

## Source Inputs

- API docs/response shape:
- Existing UI/code references:
- User request:

## Admin Workflow

- <Primary list/detail/create/edit/delete/status flow.>

## Data Requirements

- <Endpoint or response field and how it affects the feature.>

## Acceptance Criteria

- [ ] <Observable admin behavior.>
- [ ] <Data/API behavior.>
- [ ] <Validation/navigation behavior.>

## In Scope

- <Included behavior.>

## Out of Scope

- <Excluded behavior.>

## Open Questions

- <Question or "None".>
```

## Guardrails

- Do not include component-level layout or Tailwind class decisions.
- Do not include implementation ordering.
- Keep speculative assumptions explicit.
- Use Korean for admin-facing labels and copy when known.

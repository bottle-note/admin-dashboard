---
name: bottlenote-admin-feature-plan
description: >
  Create or update decision-complete implementation plans in
  docs/features/{feature-slug}/plan.md from Bottlenote admin feature spec.md
  and design.md. Use before code implementation so another agent can implement
  without reinterpreting product requirements or UI design. Trigger on
  implementation plan, 개발 계획, 구현 계획, plan.md, or requests to prepare a
  feature for implementation.
---

# Bottlenote Admin Feature Plan

Use this skill to write an implementation plan that an implementation agent can
execute without making product, design, or architecture decisions.

## Workflow

1. Read required inputs.
   - Require `docs/features/<feature-slug>/spec.md`.
   - Require `docs/features/<feature-slug>/design.md`.
   - If either is missing, route to the missing stage skill first.

2. Inspect implementation anchors.
   - Read `AGENTS.md`.
   - Inspect matching API types, services, hooks, pages, schemas, routes, menu,
     tests, and MSW mocks.
   - Use `bottlenote-admin-api` if endpoint or field mapping needs contract
     confirmation.

3. Write or update `docs/features/<feature-slug>/plan.md`:

```markdown
# <Feature Name> Implementation Plan

## Summary

<What will be implemented.>

## Inputs

- Spec: `docs/features/<feature-slug>/spec.md`
- Design: `docs/features/<feature-slug>/design.md`
- API source:

## Data and API Mapping

- <API endpoint/field -> frontend type/service/hook/form/table mapping.>

## Implementation Steps

1. <Types/API layer work.>
2. <Service/query key work.>
3. <Hook/cache invalidation work.>
4. <Schema/form/page/component work.>
5. <Route/menu integration.>
6. <Tests/mocks.>

## Edge Cases

- <Concrete behavior to preserve or handle.>

## Verification Checklist

- [ ] `<test or lint command>`
- [ ] <Manual UI check from design.md>

## Implementation Notes

- <Constraints the implementer must not reinterpret.>
```

## Guardrails

- Make the plan decision-complete. Do not leave "decide later" items unless
  they are listed as blockers.
- Include API findings in this plan when they affect implementation.
- Do not implement code in this stage.
- Do not create separate verification docs by default.

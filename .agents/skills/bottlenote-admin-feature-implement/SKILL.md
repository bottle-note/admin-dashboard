---
name: bottlenote-admin-feature-implement
description: >
  Implement Bottlenote admin dashboard features strictly from an existing
  docs/features/{feature-slug}/plan.md. Use when spec.md, design.md, and plan.md
  already exist and Codex should make code changes, update tests/mocks, run
  verification, and hand off manual UI review points without redefining the
  feature. Trigger on "plan.md대로 구현", "구현해줘", "implement this plan", or
  requests that provide a docs/features/{feature-slug}/plan.md path.
---

# Bottlenote Admin Feature Implement

Use this skill to execute an existing feature plan. The implementation source of
truth is `docs/features/<feature-slug>/plan.md`.

## Workflow

1. Read the feature docs.
   - Read `plan.md` first.
   - Read linked `spec.md` and `design.md` only to clarify plan references.
   - Do not reinterpret product scope or UI design beyond the plan.

2. Validate plan completeness before editing.
   - If route placement, API mapping, required fields, destructive behavior, or
     test expectations are missing, stop and ask for a plan update.
   - If the plan is complete, implement it in the listed order.

3. Implement using repository patterns.
   - API-backed work: types -> service -> hook -> schema/form -> page ->
     route/menu -> tests.
   - Keep server data in TanStack Query.
   - Keep list search/filter/pagination in URL params.
   - For page grids and major layout columns, prefer ratio-, fraction-, and
     container-based responsive utilities over fixed pixel widths.
   - Reuse design-system tokens from `tailwind.config.js`, `src/index.css`,
     and shadcn CSS variables for colors, borders, backgrounds, and text. Avoid
     arbitrary hex Tailwind classes such as `border-[#d9d9d9]` unless the
     feature plan documents an explicit design exception and no suitable token
     exists.
   - Keep one React component per file for newly added or modified local
     components. Split shared subcomponents into their own files instead of
     colocating multiple component declarations in one file.
   - Do not modify `src/components/ui`.
   - Do not add barrel files unless required by an existing boundary.

4. Verify.
   - Run the commands from the plan's verification checklist when feasible.
   - For UI changes, start the dev server if needed and provide the local URL.
   - Use Playwright or manual inspection guidance when route-level behavior or
     visual layout risk exists.

5. Handoff.
   - Summarize implemented behavior, changed areas, tests run, skipped checks,
     and manual UI review points.
   - Do not create a PR unless the user asks; then use
     `bottlenote-admin-korean-pr`.

## Guardrails

- Do not change feature scope during implementation.
- Do not silently fill major gaps in `plan.md`.
- Preserve unrelated worktree changes.
- Never claim verification passed unless it was actually run successfully.

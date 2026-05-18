---
name: bottlenote-admin-feature-builder
description: >
  Route Bottlenote admin dashboard feature, bug, API, implementation,
  verification, and PR requests to the correct project-local skill workflow.
  Use when the user gives a vague or multi-stage admin request and Codex needs
  to decide whether to create a spec, design, implementation plan, implement
  from an existing plan, inspect API docs, or prepare a Korean PR. Trigger on
  "기능 개발", "버그 수정", "구체화", "어드민에 추가", "구현해줘",
  "PR 만들어줘", or similar admin workflow requests.
---

# Bottlenote Admin Feature Router

Use this skill only to choose the correct project-local workflow. Do not use it
to create feature docs or edit code directly.

## Workflow

1. Read `AGENTS.md` and classify the request.
   - New feature or page without docs: use
     `bottlenote-admin-feature-spec`.
   - Feature with `spec.md` but no `design.md`: use
     `bottlenote-admin-feature-design`.
   - Feature with `spec.md` and `design.md` but no `plan.md`: use
     `bottlenote-admin-feature-plan`.
   - Feature with a ready `plan.md`: use
     `bottlenote-admin-feature-implement`.
   - API docs, response shape, endpoint, or contract mismatch: use
     `bottlenote-admin-api` as a supporting skill.
   - Completed work that needs a Korean PR: use
     `bottlenote-admin-korean-pr`.

2. Preserve the stage order for new feature work.
   - Spec first: `docs/features/<feature-slug>/spec.md`.
   - Design second: `docs/features/<feature-slug>/design.md`.
   - Plan third: `docs/features/<feature-slug>/plan.md`.
   - Implementation last: code changes based on `plan.md`.

3. Keep outputs in repo docs by default.
   - Use `.context/` only for temporary scratch notes or handoff details that
     should not be committed.
   - Do not create feature briefs in `.context`.

## Routing Examples

- "어드민에 공지사항 관리 추가해줘" -> spec -> design -> plan -> implement.
- "이 `docs/features/notices/plan.md`대로 구현해줘" -> implement.
- "API 문서가 바뀌었는데 타입 맞춰줘" -> admin-api.
- "작업 끝났으니 PR 만들어줘" -> korean-pr.

## Guardrails

- Do not skip directly to implementation when feature docs are missing unless
  the user explicitly asks for a fast one-shot change.
- If multiple stage skills apply, use the earliest missing stage first.
- Keep API analysis inside the relevant feature docs unless the user explicitly
  asks for a broad API audit.

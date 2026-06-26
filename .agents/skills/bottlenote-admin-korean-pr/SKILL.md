---
name: bottlenote-admin-korean-pr
description: >
  Create Korean pull requests for Bottlenote admin dashboard changes. Use when
  Codex needs to prepare or create a PR after feature work, bug fixes, API
  contract work, tests, or documentation changes in this repository. Trigger on
  requests like "PR 만들어줘", "PR 생성", "pull request 만들어줘", "한글 PR",
  "작업 올려줘", or when implementation is complete and the user asks to open a
  PR.
---

# Bottlenote Admin Korean PR

Use this skill to prepare a concise Korean PR that matches this repository's
template and accurately reflects the actual diff.

## Workflow

1. Inspect the branch and diff.
   - Run `git status --short --untracked-files=all`.
   - Use `git diff origin/main...` for the change summary unless the user
     specifies another base.
   - Do not include unrelated existing worktree changes in the PR summary.
   - If unrelated changes are present, explicitly separate them from this work.

2. Check repository PR template.
   - Prefer `.github/PULL_REQUEST_TEMPLATE.md`.
   - Preserve its sections:
     `PR 제목`, `변경 사항`, `변경 이유`, `테스트 방법`, `참고 사항`.

3. Find related workspace issues.
   - Search `bottle-note/workspace` issues before writing the PR body when the
     branch, commits, user prompt, docs, or prior conversation mention an issue,
     QA item, feature request, or comment URL.
   - Prefer exact issue/comment URLs from the user prompt. Otherwise search by
     the feature keywords and changed domain, then inspect likely issue bodies
     and comments.
   - Add a `관련 이슈` section to the PR body when a related workspace issue is
     found. Include the workspace issue link and, when the work comes from a
     specific comment, the comment URL.
   - If no related workspace issue is found, omit the section rather than adding
     speculative links.

4. Write the title.
   - Format: `[type] Korean summary`.
   - Use one of: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
   - Keep it specific to the shipped behavior.

5. Write the body in Korean.
   - Keep technical terms such as API, React, TanStack Query, MSW, Playwright,
     route, hook, service in English when clearer.
   - In `변경 사항`, list concrete code/user-facing changes.
   - In `변경 이유`, explain why the change is needed.
   - In `테스트 방법`, include commands actually run and any manual checks.
   - In `참고 사항`, mention residual risks, skipped checks, required env vars,
     or user verification steps. Use `특이사항 없음` only when true.

6. Create the PR only when requested.
   - Use `gh pr create --base main` unless the user specifies a different base.
   - If the branch has not been pushed, push the current branch first only when
     the user asked to create the PR and the remote branch is missing.
   - Do not add AI attribution footers unless the user asks for them.

## PR Body Shape

```markdown
### PR 제목 (Title)

[type] <한글 요약>

### 관련 이슈

- bottle-note/workspace#<번호>
- 세부 요청: <댓글 URL>

### 변경 사항 (Changes)

- [ ] <구체적인 변경 사항>
- [ ] <구체적인 변경 사항>

### 변경 이유 (Reason for Changes)

<왜 필요한 변경인지>

### 테스트 방법 (Test Procedure)

- [ ] `<실행한 명령>`
- [ ] <수동 검증 내용>

### 참고 사항 (Additional Information)

<리뷰어가 알아야 할 내용>
```

## Guardrails

- Never claim tests passed unless the command was run successfully.
- Mention tests that could not be run.
- Keep the PR focused on changes in the current branch.
- Respect the target branch from the workspace instructions: `origin/main` for
  diffing and `main` as the PR base.

---
name: bottlenote-admin-api
description: >
  Check Bottlenote admin API documentation and apply frontend API contract
  updates for this dashboard. Use when Codex needs to inspect admin API specs,
  compare docs with code, add or update endpoints, fix request/response type
  mismatches, or support feature spec/plan work with API field analysis.
  Trigger on requests mentioning Bottlenote API, admin API docs, endpoint
  updates, response shape changes, or code/API inconsistencies.
---

# Bottlenote Admin API Contract

Use this skill to inspect Bottlenote admin API documentation and keep frontend
API contracts aligned with the dashboard code.

## Workflow

1. Confirm the target domain and operation.
   - If the user names a feature or bug, identify the relevant domain files in
     `src/types/api`, `src/services`, and `src/hooks`.
   - If the user asks for a broad API audit, scan all API domains and report
     changes by domain before editing.

2. Check the API source.
   - Treat the published admin API documentation as the source of truth when the
     user says the API was deployed, the spec changed, or a backend response
     shape is available.
   - Prefer the latest published API documentation:
     `https://bottle-note.github.io/bottle-note-api-server/bottle-note/admin-api/admin-api.html`
   - If the request specifically mentions dev, development, or behavior that is
     missing from the published docs, check the dev API server from
     `.env.local` (`VITE_API_BASE_URL`) before falling back to the local
     snapshot.
   - If dev documentation paths return 403/404 but API endpoints respond, use
     non-destructive endpoint probing to confirm the contract:
     - Authenticate with available local dev credentials when present.
     - Use `OPTIONS` to discover allowed methods.
     - Use safe `GET` requests for list/detail shapes.
     - Use malformed or empty-body mutation requests to discover validation,
       required fields, duplicate errors, and route existence.
     - For delete/update checks, prefer impossible IDs or invalid payloads. Do
       not create, update, or delete real records just to inspect a contract
       unless the user explicitly approves it.
     - Clearly label findings as "dev API behavior" when they come from probing
       instead of a published document.
   - If published docs and dev API behavior differ, report the difference and
     prefer the source the user asked for. For feature docs targeting imminent
     dev work, record dev API behavior and note that published docs may be
     stale.
   - If neither live docs nor dev API behavior can be checked, use
     `references/api-spec.md` as the local snapshot and explicitly say it may be
     stale.
   - When live docs differ from `references/api-spec.md`, update the snapshot
     only when the user explicitly wants the repo to record the new API
     contract snapshot.

3. Compare documentation with code.
   - `src/types/api/*.api.ts`: endpoint constants and request/response types.
   - `src/services/*.service.ts`: service functions, endpoint interpolation,
     query keys, response normalization.
   - `src/hooks/use*.ts`: TanStack Query hooks, mutation variables, cache
     invalidation, Korean toast messages.

4. Produce a concise diff report when the scope is not already obvious.
   - Missing endpoint: method and path exist in docs but not code.
   - Missing field: request/response field exists in docs but not types.
   - Changed field: type, requiredness, or name differs.
   - Removed endpoint: code has an endpoint that no longer exists in docs.
   - UI implication: list/detail/form/filter behavior needed by the frontend.

5. Apply changes in the project order.
   - Update `src/types/api/{domain}.api.ts`.
   - Update `src/types/api/index.ts` only when an existing export pattern
     requires it.
   - Update `src/services/{domain}.service.ts`.
   - Update `src/hooks/use{Domain}.ts`.
   - Add or update focused tests when behavior or contracts changed.

6. Record API findings in the feature docs when this supports feature work.
   - Put user-facing requirements and field meanings in
     `docs/features/<feature-slug>/spec.md`.
   - Put concrete frontend type/service/hook mapping in
     `docs/features/<feature-slug>/plan.md`.
   - Do not create a standalone API report unless the user explicitly asks for a
     broad API audit.

7. Verify with the narrowest useful commands.
   - Prefer targeted `pnpm test:run ...` when supported.
   - Run `pnpm lint` or `pnpm test:run` when changes touch shared contracts or
     multiple domains.

## Output Contract

For API contract work, leave the user with:

- API source used: published docs, dev API behavior, or local snapshot.
- Contract changes found: endpoint and field-level summary.
- Code changes applied: types, services, hooks, tests.
- Feature docs updated, when applicable.
- Verification result: exact commands run and pass/fail status.
- Follow-up needed: missing backend docs, ambiguous fields, or manual UI checks.

## References

- `references/api-spec.md`: Local snapshot of the admin API documentation. Use
  only as fallback or for quick orientation when live docs are not needed.
- `references/code-patterns.md`: Dashboard API layer examples and conventions.

## Rules

- Keep API types in `src/types/api`; do not duplicate them in components.
- Follow the three-layer order: types -> service -> hook.
- Do not edit `src/components/ui`.
- Do not create new barrel files unless the repo already requires one at that
  boundary.
- Treat pagination as 0-based.
- Preserve TanStack Query ownership of server data.
- Use Korean toast and validation messages for admin-facing UI.

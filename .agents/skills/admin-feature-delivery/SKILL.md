---
name: admin-feature-delivery
description: "Deliver new API-backed features in the Bottlenote Admin Dashboard through user-reviewed phases: inspect the API and domain, decide and document screens, build and verify the real request layer before UI, implement live-data routes and screens with the existing design system, then test. Use for new admin list/detail workflows or substantial API-backed admin screens. Do not use for small bug fixes, copy or style-only edits, or refactors of existing features."
---

# Admin Feature Delivery

Build new Bottlenote Admin features from the backend contract outward. Preserve the operator's workflow and make each phase independently reviewable.

## Start or Resume

1. Read the repository `AGENTS.md` and follow its API, architecture, UI, and test rules.
2. Inspect the current issue, feature documents, worktree, and related implementation before acting.
3. Determine the current phase from existing artifacts and the user's latest approval. Resume there; do not redo approved phases.
4. Keep the skill automatically applicable, but stop at every review gate. Continue only after the user approves the phase or explicitly asks to skip its gate.

When a request is a small change to an existing feature, handle it normally without forcing this workflow.

## Shared Rules

- Use the latest Admin OpenAPI JSON at `https://bottle-note.github.io/workspace/openapi.admin.json` as the published contract. Follow relevant `$ref` values through `components.schemas`.
- When OpenAPI omits required or nullable information, inspect the current `bottle-note/bottle-note-api-server` source instead of making every field optional. Follow controller → request/response DTO → mapper/service → entity column and state-transition code, then compare it with a safe dev API response.
- Compare the contract with safe live dev API responses when documentation is ambiguous. Never infer undocumented fields from names alone.
- Use safe read requests by default. Do not call mutation endpoints merely to probe them. Do not inspect, print, or expose browser tokens, cookies, or local storage.
- Preserve the repository's `src/types/api` → `src/services` → `src/hooks` data flow.
- Do not use mock data, fake services, or page fixtures as the primary UI runtime. Build the real read request layer first and render the UI from its states.
- A narrowly scoped test-only interception is allowed only for an otherwise unreachable loading, empty, or error state and must remain consistent with `AGENTS.md`.
- Use existing pages and `src/components/ui` as the design system. Do not edit generated shadcn files.
- Do not create GitHub issues, commit, push, or deploy unless the user explicitly requests that action.

## Phase 1: API and Domain Discovery

Understand the backend capability and the operator's purpose before selecting screens.

- Read the parent issue, related backend issues, and existing domain documents.
- Extract relevant paths, methods, parameters, response envelopes, schemas, enums, nullability, pagination, authentication, and errors from OpenAPI.
- Check route deployment with safe methods. Use authenticated GET responses when available to resolve unclear serialization, pagination metadata, missing/null fields, and real state values.
- Explain domain terms in plain Korean and distinguish source evidence, current state, candidates, and confirmed relations.
- Identify missing backend capabilities required by the product goal.

### Review Gate 1

Give the user:

- deployed endpoint inventory;
- plain-language domain model and data flow;
- confirmed facts versus unresolved contract gaps;
- backend additions or actual-response checks still needed.

Stop and wait for the user to confirm the understanding.

## Phase 2: Screen Decision and Specification

Turn the approved domain model into operator workflows and screens.

- Decide list, detail, supporting, and follow-up screens from the operator's questions, not from one endpoint per screen.
- Map every screen and operation to required API fields and permissions.
- Define navigation, routes, search, filters, pagination, state changes, dangerous actions, loading, empty, error, long text, and missing-value behavior.
- Separate the current delivery from later product or mutation work.
- Create or update `docs/features/<feature>/spec.md`. Read [the spec template](references/spec-template.md) before writing a new spec.
- Break implementation into vertical delivery slices that include data access, UI, and focused E2E rather than horizontal layer-only tickets.

### Review Gate 2

Give the user:

- screen and route list;
- screen-to-API/function mapping;
- scope, follow-ups, and open decisions;
- clickable specification file;
- proposed implementation slices.

Stop and wait for scope approval.

## Phase 3: Real Data Access Foundation

Build the smallest real request path needed by the approved screens before implementing their UI.

- Define API types from OpenAPI, backend DTO/domain source, and verified dev responses. Keep fields optional only when the request or response can actually omit them, and use nullable types when the response key is present with a null value.
- Add services with the exact paths and query serialization.
- Add TanStack Query hooks and stable, domain-specific query keys.
- Confirm the request against the dev API through the safest available authenticated environment.
- Record actual response shape, pagination metadata, state values, and contract mismatches in the feature spec.
- If authentication or representative data is unavailable, stop with the precise blocker and the exact response samples or access needed. Do not replace real verification with mock data.

### Review Gate 3

Give the user:

- types, services, and hooks added;
- live request result and representative response shape without sensitive or unnecessary record data;
- differences between OpenAPI and reality;
- decisions the UI must reflect.

Stop and wait for approval of the data foundation.

## Phase 4: Live-Data UI

Implement the approved screens directly on the real request layer.

- Add role-protected routes and menu entries according to the specification.
- Follow the closest existing list/detail patterns before creating a new pattern.
- Keep search, filters, cursor or page state in URL parameters.
- Render real query states: initial loading, refreshing or loading more, empty, filtered-empty, error with retry, missing optional data, and partial data.
- Use Korean labels and operationally meaningful status text. Keep raw backend values available when a translation could hide important meaning.
- Make source evidence, current relations, candidates, and confirmed relations visually distinct.
- Run the local app and inspect the actual screens at relevant viewport sizes. Use Product Design Audit only when a dedicated UX/accessibility audit materially helps.

### Review Gate 4

Give the user:

- routes and implemented workflows;
- screenshots or a live local verification summary;
- state matrix showing what was checked;
- remaining visual or contract decisions.

Stop and wait for UI approval.

## Phase 5: Verification and Handoff

- Add focused Playwright coverage for the changed operator flows. Prefer real integration; use minimal interception only for otherwise unreachable state branches.
- Run the related Playwright spec, `pnpm lint`, and `pnpm build`.
- Perform authenticated manual verification when the environment permits it.
- Update the feature spec when implementation resolved an open question or deliberately changed the agreed behavior.
- Report the result, visible behavior, checks completed, checks blocked, and follow-up work.

Do not commit, push, create tickets, or deploy unless the user explicitly asks.

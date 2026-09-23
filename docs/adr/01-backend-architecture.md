# ADR-001: Backend Architecture — Direct Drizzle Integration & Single Provider Pattern

**Status:** Accepted
**Date:** 2026-09-23
**Deciders:** Rakesh

---

## Context

The Odin AI-Assisted Work Intake System requires a NestJS backend with SQLite persistence,
AI-powered analysis, and a defined work-item state machine.


---

## Decisions

### Decision 1: Direct Drizzle + better-sqlite3 

**Chosen:** A small custom NestJS provider (`database.provider.ts`, ~20 lines) that creates
a Drizzle instance directly from `better-sqlite3`.

**Rationale:**
- Drizzle ORM natively supports `better-sqlite3` via `drizzle-orm/better-sqlite3`
- The community wrapper adds an unmaintained external dependency for ~20 lines of code
- Direct integration makes the database setup obvious to reviewers
- Fewer dependencies = fewer supply-chain risks and version conflicts

### Decision 2: Single AI provider selection (no cascade)

**Chosen:** A single provider selected via `AI_PROVIDER` environment variable
(`mock` | `openai`). The architecture uses an `AiProvider` interface.

**Rejected:** A Groq → OpenRouter cascade with automatic fallback.

**Rationale:**
- A cascade introduces duplicate API calls, unpredictable costs, and inconsistent outputs
- Debugging becomes harder — which provider produced which result?
- The `AiProvider` interface keeps the architecture open for extension
- Simpler to test: the mock provider is deterministic and configurable

### Decision 3: Domain-oriented workflow (not generic `common/`)

**Chosen:** Workflow logic lives in `work-items/workflow/` — `transitions.ts` (the whitelist
map) and `workflow.service.ts` (validation methods).

**Rejected:** A generic `common/state-machine.ts` that could become a dumping ground.

**Rationale:**
- The state machine is domain logic for work items, not generic infrastructure
- Colocating it with the work-items module makes the dependency graph obvious
- `WorkflowService` exposes explicit methods (`validateTransition`, `validateRetry`,
  `validateCanAnalyse`) — each method name documents the business rule

### Decision 4: Custom ZodValidationPipe (no nestjs-zod)

**Chosen:** A ~25-line custom `ZodValidationPipe` that wraps `schema.parse()` and returns
structured 400 errors.

**Rejected:** `nestjs-zod` — an additional dependency for trivial functionality.

**Key learning:** Applying `@UsePipes()` at the method level validates ALL parameters,
including `@Param()`. The fix was to apply the pipe directly to `@Body()`:

```typescript
// Before (broken — validates @Param('id') too)
@Patch(':id/status')
@UsePipes(new ZodValidationPipe(UpdateStatusRequestSchema))
async updateStatus(@Param('id') id: number, @Body() dto: UpdateStatusRequest) {}

// After (correct)
@Patch(':id/status')
async updateStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body(new ZodValidationPipe(UpdateStatusRequestSchema)) dto: UpdateStatusRequest,
) {}
```

### Decision 5: `nodenext` module resolution with `.js` extensions

All relative imports use explicit `.js` extensions (e.g., `'./ai.service.js'`). Required by
`"module": "nodenext"` in TypeScript 6 for ESM.

### Decision 6: Zod 4 migration (`error.errors` → `error.issues`)

Zod v4.6.5 changed `ZodError` — `error.errors` became `error.issues`. Updated both
`ai.service.ts` and `zod-validation.pipe.ts`.

### Decision 7: `import type` for decorated parameters

With `"isolatedModules": true` and `"emitDecoratorMetadata": true`, TypeScript requires
types used in decorated signatures to be imported with `import type`.

---

## Consequences

### Positive
- **Zero unnecessary dependencies** — no community Drizzle wrapper, no nestjs-zod, no cascade
- **Testable** — all 16 e2e tests pass with in-memory SQLite and configurable mock AI
- **Reviewable** — ~500 lines of source across 21 files
- **Extensible** — new AI provider = implement `AiProvider`; new status = update `ALLOWED_TRANSITIONS`

### Negative
- `.js` extensions on imports are verbose (but required by `nodenext`)
- Custom Drizzle provider is minimal (but sufficient for this scope)

---

## Test Coverage

16 e2e tests covering:
- CRUD + idempotent creation (duplicate `externalId`)
- All valid and invalid workflow transitions
- AI success, failure, timeout, and malformed output
- Retry logic (only `FAILED` items)
- Status filtering

All tests use in-memory SQLite — no external dependencies.

---

## References

- [Drizzle ORM — SQLite](https://orm.drizzle.team/docs/get-started/sqlite-new)
- [NestJS — Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
```

# ADR-001: Backend Architecture — Direct Drizzle Integration & Provider Registry

**Status:** Accepted (amended 2026-09-24)
**Date:** 2026-09-23
**Deciders:** Rakesh

---

## Context

The Odin AI-Assisted Work Intake System requires a NestJS backend with SQLite persistence,
AI-powered analysis via multiple LLM providers, and a defined work-item state machine.

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

### Decision 2: Provider Registry + Factory Pattern (amended 2026-09-24)

**Chosen:** An env-driven registry of AI providers where each provider registers a factory
function. Providers are constructed per-model, exposing multiple model options dynamically
via `GET /ai-config`.

**Original decision (2026-09-23):** A single provider selected via `AI_PROVIDER` env var.

**Why this changed:**
- Users need to switch between models (not just providers) at runtime
- Different models on the same provider (e.g., Groq) have different capabilities
- The UI should show available options dynamically, not hardcoded
- Adding a new provider (Anthropic, Bedrock) should require only adding a registry entry

**Architecture:**
```
.env env vars
  ├─ GROQ_API_KEY / GROQ_MODELS   →  groq:llama-3.1-8b-instant, groq:llama-3.3-70b, etc.
  ├─ OPENAI_API_KEY / OPENAI_MODELS →  openai:gpt-4o-mini, openai:gpt-4o, etc.
  └─ Always: mock

Provider Registry (provider.registry.ts)
  ├─ MOCK_DEFINITION  (always on, no key)
  ├─ Groq:    buildProviderDefinitions() checks GROQ_API_KEY → factory: (model) => new GroqProvider(model)
  └─ OpenAI:  checks OPENAI_API_KEY → factory: (model) => new OpenAiProvider(model)

AiConfigService
  └─ Iterates definitions → ProviderInfo[] + Map<string, AiProvider>

GET /ai-config → { selected: "groq:llama-3.1-8b-instant", available: [...] }
PUT /ai-config → { provider: "openai:gpt-4o" }
```

**Rejected:** Cascade / fallback (Groq → OpenAI → Mock). Adds unpredictable costs and
debugging complexity.

**Rationale:**
- Factory pattern makes the system open for extension, closed for modification
- Adding Anthropic = 1 registry entry + 1 provider class + 1 config field
- UI dropdown populates dynamically from the registry — no frontend changes needed
- Each provider model is independently selectable and testable

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
- **Testable** — 19 e2e tests pass with in-memory SQLite and configurable mock AI
- **Reviewable** — modular architecture with clear separation of concerns
- **Extensible** — new AI provider = implement `AiProvider` + add registry entry; new status = update `ALLOWED_TRANSITIONS`
- **Runtime-switchable** — providers and models can be changed via UI without restart

### Negative
- `.js` extensions on imports are verbose (but required by `nodenext`)
- Custom Drizzle provider is minimal (but sufficient for this scope)

---

## Test Coverage

19 e2e tests covering:
- CRUD + idempotent creation (duplicate `externalId`)
- All valid and invalid workflow transitions
- AI success, failure, timeout, and malformed output
- Retry logic (only `FAILED` items)
- Status filtering
- AI provider switching and config endpoints

All tests use in-memory SQLite — no external dependencies.

---

## References

- [Drizzle ORM — SQLite](https://orm.drizzle.team/docs/get-started/sqlite-new)
- [NestJS — Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [ADR-003: AI LLM Integration](03-ai-llm-integration.md) — provider registry and factory pattern
- [Groq SDK](https://github.com/groq/groq-typescript)
- [@nestjs/config](https://docs.nestjs.com/techniques/configuration)
```

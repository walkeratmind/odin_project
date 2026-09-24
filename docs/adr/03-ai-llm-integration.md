# ADR-003: AI LLM Integration — Provider Registry & Factory Pattern

**Status:** Accepted
**Date:** 2026-09-24
**Deciders:** Rakesh

---

## Context

The Odin system needs to support multiple AI LLM providers (Groq, OpenAI, Mock) with
per-model selection, runtime switching via UI, and easy future extensibility. The original
design used a single `AI_PROVIDER` env var with hardcoded provider names in both backend
and frontend.

---

## Decision

Use an **env-driven provider registry** with a **factory pattern** for provider instantiation.

### Architecture

```
┌────────────────────────────────────────────────────────┐
│                    .env                                │
│  GROQ_API_KEY=gsk_xxx     GROQ_MODELS=llama-3.1-8b... │
│  OPENAI_API_KEY=sk-xxx    OPENAI_MODELS=gpt-4o-mini   │
└──────────────┬─────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│           @nestjs/config (ConfigModule)                │
│  app.config.ts → typed AiProvidersConfig               │
└──────────────┬─────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│           provider.registry.ts                         │
│                                                        │
│  ProviderDefinition {                                  │
│    type: string        // 'groq', 'openai', 'mock'     │
│    displayName: string // 'Groq', 'OpenAI'             │
│    envApiKey: string   // which env var enables this   │
│    models: string      // comma-separated model list   │
│    factory: (model, apiKey) => AiProvider              │
│  }                                                     │
│                                                        │
│  MOCK_DEFINITION (always on, no key needed)            │
│  buildProviderDefinitions(groqModels, openaiModels...)  │
│    → ProviderDefinition[]                              │
└──────────────┬─────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│              AiConfigService                           │
│                                                        │
│  Iterates definitions → one entry per model:           │
│    groq:llama-3.1-8b-instant                           │
│    groq:llama-3.3-70b-versatile                        │
│    openai:gpt-4o-mini                                  │
│    mock                                                │
│                                                        │
│  Map<string, AiProvider> — provider instances          │
│  ProviderInfo[] — metadata for UI                      │
└──────────────┬─────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│              API Endpoints                             │
│                                                        │
│  GET /ai-config                                        │
│    → { selected: "groq:llama-3.1-8b-instant",          │
│        available: [{ id, name, provider, model }...] } │
│                                                        │
│  PUT /ai-config { provider: "openai:gpt-4o" }          │
│    → switches provider at runtime                      │
└────────────────────────────────────────────────────────┘
```

### Provider implementations

| Provider | SDK | Class | Config |
|----------|-----|-------|--------|
| Mock | N/A | `MockAiProvider` | Always available, deterministic |
| Groq | `groq-sdk` | `GroqProvider(model)` | `GROQ_API_KEY`, `GROQ_MODELS` |
| OpenAI | `fetch` (OpenAI-compatible API) | `OpenAiProvider(model)` | `OPENAI_API_KEY`, `OPENAI_MODELS` |

### Runtime switching

`AiService` injects `AiConfigService` and calls `getProvider()` on every analysis. No cached
provider instance — switching takes effect on the next request.

```ts
// ai.service.ts
async analyse(title: string, description: string): Promise<AiAnalysis> {
  const provider = this.aiConfig.getProvider();  // resolved fresh each call
  const config = this.aiConfig.getConfig();      // for logging
  // ...
}
```

---

## Alternatives Considered

### A. Single env var (`AI_PROVIDER=mock|groq|openai`)

**Rejected.** Doesn't support per-model selection. Adding a new model means code changes
in both backend and frontend. Hardcoded dropdown in UI.

### B. Cascade / fallback (Groq → OpenAI → Mock)

**Rejected.** Unpredictable costs (multiple API calls), inconsistent outputs, harder to
debug. The user should explicitly choose their provider.

### C. Database-stored provider config

**Rejected for now.** Adds persistence complexity for config that rarely changes at runtime.
Env vars + in-memory switch are simpler. Could be revisited if multi-instance deployments
need synchronized config.

---

## Extensibility

### Adding a new provider (e.g., Anthropic)

**Step 1:** Create `src/ai/providers/anthropic.provider.ts`

```ts
@Injectable()
export class AnthropicProvider implements AiProvider {
  constructor(private readonly model: string) {}

  async analyse(input: { title: string; description: string }): Promise<AiAnalysis> {
    // Implement using Anthropic SDK
  }
}
```

**Step 2:** Add config to `src/config/app.config.ts`

```ts
anthropic: {
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  models: process.env.ANTHROPIC_MODELS ?? 'claude-3-5-haiku-latest',
},
```

**Step 3:** Add entry to `provider.registry.ts`

```ts
if (anthropicApiKey) {
  definitions.push({
    type: 'anthropic',
    displayName: 'Anthropic',
    envApiKey: 'ANTHROPIC_API_KEY',
    models: anthropicModels,
    factory: (model, _apiKey) => new AnthropicProvider(model),
  });
}
```

No frontend changes needed — the UI dropdown populates dynamically from `GET /ai-config`.

---

## Consequences

### Positive
- **Extensible** — new provider = 3 files touched, no frontend changes
- **Dynamic UI** — dropdown renders from backend data, never hardcoded
- **Testable** — `AiConfigService` can be overridden in tests with mock config
- **Type-safe** — typed config via `@nestjs/config` + `registerAs`
- **Clean SDK usage** — Groq uses `groq-sdk` (official), OpenAI uses standard fetch

### Negative
- In-memory provider instances (not persisted) — switching providers restarts on deploy
- Each provider instance is constructed eagerly at startup (not lazy)

---

## References

- [@nestjs/config](https://docs.nestjs.com/techniques/configuration)
- [groq-sdk](https://github.com/groq/groq-typescript)
- [Provider Registry source](../../apps/api/src/ai/providers/provider.registry.ts)
- [AiConfigService source](../../apps/api/src/ai/ai-config.service.ts)
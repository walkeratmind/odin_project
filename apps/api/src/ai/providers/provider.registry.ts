import type { AiProvider } from '@odin/shared';
import { MockAiProvider } from './mock-ai.provider.js';
import { GroqProvider } from './groq.provider.js';
import { OpenAiProvider } from './openai.provider.js';

// ── Provider Definition ────────────────────────────────
//
// To add a new AI provider (e.g. Anthropic, Bedrock):
//   1. Implement AiProvider interface in a new class
//   2. Add an entry to PROVIDER_DEFINITIONS below
//   3. Add its config to app.config.ts
//
// ────────────────────────────────────────────────────────

export interface ProviderDefinition {
  /** Unique type key — 'groq', 'openai', 'mock' */
  type: string;
  /** Human-readable name shown in logs and UI */
  displayName: string;
  /** Env var that must be set for this provider to be available */
  envApiKey: string;
  /** Model IDs available for this provider */
  models: string[];
  /** Creates a provider instance for the given model */
  factory: (model: string, apiKey: string) => AiProvider;
}

/**
 * Registry of all available AI providers.
 *
 * Each entry maps a provider type to a factory function.
 * The `models` string is a comma-separated list of model IDs
 * that will be exposed as individual selectable options in the UI.
 *
 * Adding a new provider = adding one entry to this array.
 */
export function buildProviderDefinitions(
  groqModels: string[],
  groqApiKey: string,
  openaiModels: string[],
  openaiApiKey: string,
): ProviderDefinition[] {
  const definitions: ProviderDefinition[] = [];

  // Groq
  if (groqApiKey) {
    definitions.push({
      type: 'groq',
      displayName: 'Groq',
      envApiKey: 'GROQ_API_KEY',
      models: groqModels,
      factory: (model, _apiKey) => new GroqProvider(model),
    });
  }

  // OpenAI
  if (openaiApiKey) {
    definitions.push({
      type: 'openai',
      displayName: 'OpenAI',
      envApiKey: 'OPENAI_API_KEY',
      models: openaiModels,
      factory: (model, _apiKey) => new OpenAiProvider(model),
    });
  }

  return definitions;
}

/**
 * Always-available mock provider definition (no API key needed).
 */
export const MOCK_DEFINITION: ProviderDefinition = {
  type: 'mock',
  displayName: 'Mock',
  envApiKey: '',
  models: ['mock'],
  factory: () => new MockAiProvider(),
};

// ── Helpers ─────────────────────────────────────────────

export function modelDisplayName(model: string): string {
  return model
    .replace(/^.*\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
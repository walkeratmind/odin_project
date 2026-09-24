import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider } from '@odin/shared';
import type { AiProvidersConfig } from '../config/app.config.js';
import {
  buildProviderDefinitions,
  modelDisplayName,
  MOCK_DEFINITION,
  type ProviderDefinition,
} from './providers/provider.registry.js';

// ── Public types ───────────────────────────────────────

export interface ProviderInfo {
  id: string;
  name: string;
  provider: string;
  model: string;
}

export interface AiConfigResponse {
  selected: string;
  available: ProviderInfo[];
}

// ── Service ────────────────────────────────────────────

@Injectable()
export class AiConfigService {
  private currentId: string;
  private readonly providers = new Map<string, AiProvider>();
  private readonly infos: ProviderInfo[];
  private readonly logger = new Logger(AiConfigService.name);

  constructor(private readonly config: ConfigService) {
    const aiConfig = config.get<AiProvidersConfig>('aiProviders')!;

    // Build provider definitions from config
    const definitions = buildProviderDefinitions(
      aiConfig.groq.models,
      aiConfig.groq.apiKey,
      aiConfig.openai.models,
      aiConfig.openai.apiKey,
    );

    // Always include mock
    const allDefs = [MOCK_DEFINITION, ...definitions];

    // Build registry: for each definition, create an entry per model
    const infos: ProviderInfo[] = [];

    for (const def of allDefs) {
      for (const model of def.models) {
        const id = def.type === 'mock' ? 'mock' : `${def.type}:${model}`;
        const name =
          def.type === 'mock'
            ? 'Mock AI'
            : `${def.displayName} - ${modelDisplayName(model)}`;

        infos.push({ id, name, provider: def.type, model });

        // Only create provider instances for non-mock (mock uses shared singleton)
        if (def.type !== 'mock') {
          const apiKey = this.getApiKey(def);
          this.providers.set(id, def.factory(model, apiKey));
        } else {
          this.providers.set(id, def.factory(model, ''));
        }
      }
    }

    this.infos = infos;

    // Default: first real provider, fallback to mock
    const firstReal = infos.find(i => i.id !== 'mock');
    this.currentId = firstReal?.id ?? 'mock';

    this.logger.log(
      `AI providers: ${infos.map(i => i.id).join(', ')} — default: ${this.currentId}`,
    );
  }

  getConfig(): AiConfigResponse {
    return { selected: this.currentId, available: this.infos };
  }

  setProvider(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(
        `Unknown provider: ${id}. Available: ${this.infos.map(i => i.id).join(', ')}`,
      );
    }
    this.currentId = id;
    this.logger.log(`AI provider switched to: ${id}`);
  }

  getProvider(): AiProvider {
    const provider = this.providers.get(this.currentId);
    if (!provider) throw new Error(`Provider not found: ${this.currentId}`);
    return provider;
  }

  private getApiKey(def: ProviderDefinition): string {
    // Read from process.env directly (ConfigService already loaded .env)
    return process.env[def.envApiKey] ?? '';
  }
}
import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  databaseUrl: string;
}

export interface GroqConfig {
  apiKey: string;
  models: string[];
}

export interface OpenAiConfig {
  apiKey: string;
  models: string[];
}

export interface AiProvidersConfig {
  groq: GroqConfig;
  openai: OpenAiConfig;
}

function parseModels(env: string | undefined, fallback: string): string[] {
  return (env ?? fallback).split(',').map(s => s.trim()).filter(Boolean);
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    databaseUrl: process.env.DATABASE_URL ?? './data/odin.db',
  }),
);

export const aiProvidersConfig = registerAs(
  'aiProviders',
  (): AiProvidersConfig => ({
    groq: {
      apiKey: process.env.GROQ_API_KEY ?? '',
      models: parseModels(process.env.GROQ_MODELS, 'openai/gpt-oss-20b'),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      models: parseModels(process.env.OPENAI_MODELS, 'gpt-4o-mini'),
    },
  }),
);

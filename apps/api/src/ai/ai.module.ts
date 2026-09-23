import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { MockAiProvider } from './providers/mock-ai.provider.js';
import { OpenAiProvider } from './providers/openai.provider.js';

const aiProviderFactory = {
  provide: 'AI_PROVIDER',
  useFactory: () => {
    const provider = process.env.AI_PROVIDER ?? 'mock';
    if (provider === 'openai') {
      return new OpenAiProvider();
    }
    return new MockAiProvider();
  },
};

@Module({
  providers: [aiProviderFactory, AiService],
  exports: [AiService],
})
export class AiModule {}
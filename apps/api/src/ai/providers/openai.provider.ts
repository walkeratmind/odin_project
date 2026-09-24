import { Injectable, Logger } from '@nestjs/common';
import type { AiProvider, AiAnalysis } from '@odin/shared';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly model: string;

  constructor(model: string) {
    this.model = model;
  }

  async analyse(input: {
    title: string;
    description: string;
  }): Promise<AiAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;

    this.logger.log(`OpenAI request: model=${this.model}, title="${input.title}"`);

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `Analyze the following work item and provide a structured response in JSON format with these fields:
- category: a short category like DOCUMENT_REQUEST, INFORMATION_MISSING, etc.
- priority: LOW, MEDIUM, or HIGH
- summary: a concise summary of the issue
- recommendedAction: what action should be taken

Title: ${input.title}
Description: ${input.description}

Respond ONLY with valid JSON.`;

    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a work intake analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI API error ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      this.logger.error('OpenAI returned empty response');
      throw new Error('Empty response from OpenAI');
    }

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
    const jsonStr = (jsonMatch[1] ?? content).trim();

    try {
      const parsed = JSON.parse(jsonStr) as AiAnalysis;
      this.logger.log(`OpenAI response (${elapsed}ms): category=${parsed.category}, priority=${parsed.priority}`);
      return parsed;
    } catch {
      this.logger.error(`Failed to parse OpenAI response as JSON: ${jsonStr.substring(0, 200)}`);
      throw new Error(`Failed to parse AI response as JSON: ${jsonStr}`);
    }
  }
}
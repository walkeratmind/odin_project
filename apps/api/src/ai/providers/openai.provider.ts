import { Injectable, Logger } from '@nestjs/common';
import type { AiProvider, AiAnalysis } from '@odin/shared';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  async analyse(input: {
    title: string;
    description: string;
  }): Promise<AiAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a work intake analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Extract JSON from possible markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
    const jsonStr = (jsonMatch[1] ?? content).trim();

    try {
      return JSON.parse(jsonStr) as AiAnalysis;
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${jsonStr}`);
    }
  }
}
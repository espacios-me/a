import { describe, it, expect } from 'vitest';
import { invokeLLM } from './server/_core/llm';

describe('Gemini API Integration', () => {
  it('should successfully call Gemini API with valid key', async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: 'Say "Gemini API is working" in exactly those words.',
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toContain('Gemini API is working');
  }, { timeout: 30000 });

  it('should handle streaming responses', async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'List 3 features of an integration hub in one sentence.',
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].message.content.length).toBeGreaterThan(10);
  }, { timeout: 30000 });
});

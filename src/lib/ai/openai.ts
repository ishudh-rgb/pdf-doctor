import type { AIProvider, AIProviderResponse } from "./provider";

// TODO: Implement OpenAI adapter when needed.
// 1. Install openai package: npm install openai
// 2. Use ChatCompletion API with GPT-4o or GPT-4o-mini
// 3. Use the same JSON prompt format as the Gemini adapter
// 4. Parse response and map to AISummaryResult

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async summarize(_text: string): Promise<AIProviderResponse> {
    throw new Error(
      "OpenAI provider is not yet implemented. " +
        "Set up the openai package and provide OPENAI_API_KEY to enable this provider."
    );
  }
}

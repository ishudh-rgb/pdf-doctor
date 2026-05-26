export interface AISummaryResult {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  actionItems: string[];
  importantDates: string[];
  documentTitle?: string;
  topics?: string[];
}

export interface AIProviderUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
}

export interface AIProviderResponse {
  result: AISummaryResult;
  usage: AIProviderUsage;
}

export interface AIProvider {
  name: string;
  summarize(text: string): Promise<AIProviderResponse>;
}

export function getAIProvider(name: "gemini" | "openai"): AIProvider {
  switch (name) {
    case "gemini": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GeminiProvider } = require("./gemini");
      return new GeminiProvider();
    }
    case "openai": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OpenAIProvider } = require("./openai");
      return new OpenAIProvider();
    }
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}

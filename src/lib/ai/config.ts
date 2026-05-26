export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return (
    !!key &&
    key.length > 20 &&
    !key.includes("your_gemini") &&
    !key.includes("your_") &&
    key !== "placeholder"
  );
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return (
    !!key &&
    key.length > 20 &&
    !key.includes("your_openai") &&
    !key.includes("your_") &&
    key !== "placeholder"
  );
}

export function isAIProviderConfigured(provider: "gemini" | "openai"): boolean {
  return provider === "openai" ? isOpenAIConfigured() : isGeminiConfigured();
}

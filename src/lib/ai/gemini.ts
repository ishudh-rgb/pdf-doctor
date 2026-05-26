import { GoogleGenerativeAI } from "@google/generative-ai";

import type { AIProvider, AIProviderResponse, AISummaryResult } from "./provider";

import { sanitizeSummaryResult } from "./sanitize-summary";



const GEMINI_MODEL = "gemini-1.5-flash";



const SUMMARIZE_PROMPT = `You are a senior business analyst creating an executive briefing from a PDF document.



Return ONLY valid JSON with this exact shape:

{

  "documentTitle": "Clear professional title for the document (not file names or slide paths)",

  "shortSummary": "2-3 polished sentences. Executive-level overview only.",

  "detailedSummary": "2-4 short paragraphs separated by \\n\\n. Cover problem, solution, market, and recommendations.",

  "keyPoints": ["5-7 concise bullet insights. Each bullet max 25 words. No repetition."],

  "actionItems": ["Concrete next steps. Empty array if none."],

  "importantDates": ["Dates, deadlines, metrics with context. Empty array if none."],

  "topics": ["3-5 high-level topic labels, e.g. Market Gap, Product Strategy"]

}



Strict rules:

- Write in the same language as the source document (English, Hindi, or Hinglish), but keep tone professional.

- NEVER include navigation paths, slide titles chains, or strings like "Topic -> Subtopic -> Section".

- Ignore table-of-contents lines, page numbers, headers, footers, and repeated deck labels.

- Do not repeat the document title inside every field.

- Do not copy raw PDF text verbatim; synthesize and rewrite clearly.

- keyPoints must be distinct from shortSummary wording.

- Return ONLY JSON. No markdown fences.



Document text:

`;



export class GeminiProvider implements AIProvider {

  name = "gemini";



  async summarize(text: string): Promise<AIProviderResponse> {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {

      throw new Error("GEMINI_API_KEY environment variable is not set.");

    }



    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });



    const truncatedText = text.slice(0, 100_000);



    const result = await model.generateContent(SUMMARIZE_PROMPT + truncatedText);

    const response = result.response;

    const responseText = response.text();



    let parsed: AISummaryResult;

    try {

      const cleaned = responseText

        .replace(/```json\s*/g, "")

        .replace(/```\s*/g, "")

        .trim();

      parsed = JSON.parse(cleaned);

    } catch {

      parsed = {

        shortSummary: responseText.slice(0, 500),

        detailedSummary: responseText,

        keyPoints: [],

        actionItems: [],

        importantDates: [],

      };

    }



    const sanitized = sanitizeSummaryResult(

      {

        shortSummary: parsed.shortSummary ?? "",

        detailedSummary: parsed.detailedSummary ?? "",

        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],

        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],

        importantDates: Array.isArray(parsed.importantDates) ? parsed.importantDates : [],

        documentTitle: parsed.documentTitle,

        topics: Array.isArray(parsed.topics) ? parsed.topics : [],

      },

      text

    );



    const usage = response.usageMetadata;

    const inputTokens = usage?.promptTokenCount ?? 0;

    const outputTokens = usage?.candidatesTokenCount ?? 0;

    const estimatedCost =

      inputTokens * 0.000000075 + outputTokens * 0.0000003;



    return {

      result: sanitized,

      usage: {

        inputTokens,

        outputTokens,

        estimatedCost,

        model: GEMINI_MODEL,

      },

    };

  }

}



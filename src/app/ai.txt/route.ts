import { generateLlmsTxt } from "@/lib/seo/marketing-aeo";

export const dynamic = "force-static";
export const revalidate = 86400;

/** Machine-readable site guide for AI crawlers (ai.txt convention). */
export async function GET() {
  const body = [
    "# ai.txt — OnlyMyPDF",
    "# See also: /llms.txt",
    "",
    generateLlmsTxt(),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

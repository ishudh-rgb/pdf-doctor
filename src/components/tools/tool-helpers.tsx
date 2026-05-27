import { FileText } from "lucide-react";

export type SimpleRelatedTool = { name: string; href: string; color?: string };
export type SimpleFaq = { q: string; a: string };

export function mapRelatedTools(tools: SimpleRelatedTool[]) {
  return tools.map((tool) => ({
    name: tool.name,
    href: tool.href,
    icon: <FileText className="h-4 w-4" />,
    iconColor: "text-pd-brand bg-pd-brand-muted",
  }));
}

export function mapFaqs(faqs: SimpleFaq[]) {
  return faqs.map((faq) => ({
    question: faq.q,
    answer: faq.a,
  }));
}

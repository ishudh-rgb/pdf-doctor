import { FileText, type LucideIcon } from "lucide-react";
import {
  ICON_MAP,
  TOOL_KEYS,
} from "@/components/marketing/home/home-shared";

export type SimpleRelatedTool = { name: string; href: string; color?: string };
export type SimpleFaq = { q: string; a: string };

export type MappedRelatedTool = {
  name: string;
  href: string;
  slug: string;
  icon: LucideIcon;
};

export function slugFromToolHref(href: string): string {
  return href.replace(/^\//, "").split("?")[0];
}

export function resolveToolIcon(slug: string): LucideIcon {
  const toolMeta = TOOL_KEYS.find((t) => t.slug === slug);
  const iconKey = toolMeta?.icon ?? "FileText";
  return ICON_MAP[iconKey] ?? FileText;
}

export function mapRelatedTools(tools: SimpleRelatedTool[]): MappedRelatedTool[] {
  return tools.map((tool) => {
    const slug = slugFromToolHref(tool.href);
    return {
      name: tool.name,
      href: tool.href,
      slug,
      icon: resolveToolIcon(slug),
    };
  });
}

export function mapFaqs(faqs: SimpleFaq[]) {
  return faqs.map((faq) => ({
    question: faq.q,
    answer: faq.a,
  }));
}

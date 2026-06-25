import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildToolMetadata } from "@/lib/seo/metadata";
import { ToolJsonLd } from "@/lib/seo/json-ld";
import { getToolSEO } from "@/config/tools";
import { getToolAeo } from "@/config/tool-aeo";
import { ToolAeoBlock } from "@/components/seo/tool-aeo-block";
import { ToolLayoutClient } from "./tool-layout-client";

type Props = {
  children: React.ReactNode;
};

function slugFromPathname(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] ?? "";
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const slug = slugFromPathname(pathname);
  if (!slug) return {};
  return buildToolMetadata(slug);
}

export default async function ToolsLayout({ children }: Props) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const slug = slugFromPathname(pathname);

  return (
    <>
      {slug && getToolSEO(slug) ? <ToolJsonLd slug={slug} /> : null}
      <ToolLayoutClient>
        {children}
        {slug && getToolAeo(slug) ? <ToolAeoBlock slug={slug} /> : null}
      </ToolLayoutClient>
    </>
  );
}

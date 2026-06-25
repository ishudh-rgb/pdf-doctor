import type { Metadata } from "next";
import { APP_DESCRIPTION } from "@/config/constants";
import { HomePageContent } from "@/components/marketing/home-page-content";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { JsonLd, howToJsonLd, webApplicationJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";
import { SITE_AEO } from "@/lib/seo/marketing-aeo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Online PDF Tools — Merge, Split, Compress & Convert",
  description: APP_DESCRIPTION,
  path: "/",
  keywords: [
    "free PDF tools",
    "merge PDF online",
    "compress PDF",
    "PDF to Word",
    "online PDF editor",
  ],
});

export const revalidate = 3600;

export default function HomePage() {
  const homeHowTo = howToJsonLd("home", "OnlyMyPDF", [...SITE_AEO.howToGetStarted]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd("home", "OnlyMyPDF — Free Online PDF Tools", SITE_AEO.shortAnswer),
          webApplicationJsonLd(),
          ...(homeHowTo ? [homeHowTo] : []),
        ]}
      />
      <HomePageContent />
      <PageAeoSummary variant="home" />
    </>
  );
}

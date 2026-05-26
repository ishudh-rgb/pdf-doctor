"use client";

import { cn } from "@/lib/utils/cn";

type AdPosition = "below-upload" | "sidebar" | "below-result" | "footer";

interface AdBannerProps {
  position: AdPosition;
  isPro?: boolean;
  enabled?: boolean;
  className?: string;
  adSlot?: string;
  adClient?: string;
}

const dimensionMap: Record<AdPosition, string> = {
  "below-upload": "w-full max-w-xl h-[90px] mx-auto",
  sidebar: "w-[300px] h-[250px]",
  "below-result": "w-full max-w-xl h-[90px] mx-auto",
  footer: "w-full max-w-3xl h-[90px] mx-auto",
};

export function AdBanner({
  position,
  isPro = false,
  enabled = true,
  className,
  adSlot,
  adClient,
}: AdBannerProps) {
  if (isPro || !enabled) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400",
        dimensionMap[position],
        className
      )}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle block w-full h-full"
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {!adSlot && <span>Advertisement</span>}
    </div>
  );
}

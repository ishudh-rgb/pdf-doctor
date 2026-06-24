"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { APP_NAME } from "@/config/constants";
import { BRAND_LOGO } from "@/config/brand";
import {
  getLogoSlot,
  isSplitLogo,
  LOGO_VARIANTS,
  type LogoDisplaySlot,
  type LogoVariantConfig,
} from "@/config/brand-logos";
import { useLogoPreview } from "@/components/providers/logo-preview-provider";
import { LogoIconBox } from "@/components/common/logo-slot-preview";
import { LogoBrandText } from "@/components/common/logo-brand-text";

type LogoVariant = "full" | "icon" | "wordmark";

interface LogoProps {
  variant?: LogoVariant;
  withText?: boolean;
  className?: string;
  href?: string;
  link?: boolean;
}

function TextFallback({
  variant,
  className,
}: {
  variant: LogoVariant;
  className?: string;
}) {
  const showText = variant !== "icon";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--pd-radius-lg)] bg-pd-brand shadow-sm">
        <FileText className="h-5 w-5 text-white" />
      </span>
      {showText && (
        <span className="pd-logo-text text-xl font-bold text-pd-foreground">
          Only<span className="text-pd-brand">My</span>PDF
        </span>
      )}
    </span>
  );
}

function LogoImage({
  src,
  alt,
  slot,
  logoKey,
  className,
  placement,
  onBroken,
}: {
  src: string;
  alt: string;
  slot: LogoDisplaySlot;
  logoKey: string;
  className?: string;
  placement: "header" | "footer" | "icon";
  onBroken: () => void;
}) {
  return (
    <LogoIconBox
      src={src}
      alt={alt}
      slot={slot}
      className={cn(
        "pd-brand-logo",
        placement === "header" && "pd-brand-logo--header",
        placement === "footer" && "pd-brand-logo--footer",
        placement === "icon" && "pd-brand-logo--icon",
        className
      )}
      logoKey={logoKey}
      onError={onBroken}
    />
  );
}

function SplitLogo({
  config,
  placement,
  logoKey,
  className,
  onBroken,
}: {
  config: LogoVariantConfig & { layout: "split" };
  placement: "header" | "footer" | "icon";
  logoKey: string;
  className?: string;
  onBroken: () => void;
}) {
  const iconSlot =
    placement === "header"
      ? config.headerIcon
      : placement === "footer"
        ? config.icon
        : config.icon;

  const textSize =
    placement === "header" ? "header" : placement === "footer" ? "footer" : "icon";

  return (
    <span
      className={cn(
        "pd-split-logo inline-flex items-center overflow-visible",
        placement === "header" && "gap-[6.5px]",
        placement === "footer" && "gap-3",
        placement === "icon" && "flex-col gap-1",
        className
      )}
    >
      <LogoIconBox
        src={config.iconSrc}
        alt={APP_NAME}
        slot={iconSlot}
        logoKey={`${logoKey}-icon`}
        onError={onBroken}
      />
      <LogoBrandText wordmark={config.wordmark} size={textSize} />
    </span>
  );
}

function useActiveLogoConfig(variant: LogoVariant) {
  const { logoVariant } = useLogoPreview();
  const option = LOGO_VARIANTS[logoVariant];
  const useEnvOverride = Boolean(process.env.NEXT_PUBLIC_BRAND_LOGO?.trim());

  const placement =
    variant === "wordmark" || variant === "full" ? "header" : "icon";

  if (useEnvOverride) {
    const envSrc = variant === "icon" ? BRAND_LOGO.iconSrc : BRAND_LOGO.src;
    return {
      option,
      src: envSrc,
      slot: getLogoSlot(logoVariant, placement),
      placement,
      logoKey: `env-${envSrc}`,
      useSplit: false as const,
    };
  }

  const useSplit =
    option.layout === "split" && placement === "header";

  const src =
    option.layout === "split" && variant === "icon"
      ? option.iconSrc
      : option.src;

  return {
    option,
    src,
    slot: getLogoSlot(logoVariant, placement),
    placement,
    logoKey: logoVariant,
    useSplit: placement === "header" && option.layout === "split",
  };
}

export function Logo({
  variant = "full",
  withText,
  className,
  href = "/",
  link = false,
}: LogoProps) {
  const [broken, setBroken] = useState(false);
  const { option, src, slot, logoKey, placement, useSplit } =
    useActiveLogoConfig(variant);
  const { logoVariant } = useLogoPreview();

  useEffect(() => {
    setBroken(false);
  }, [logoVariant, src]);

  const showText =
    withText ?? (variant === "full" ? BRAND_LOGO.showTextWithIcon : false);
  const useWordmarkOnly =
    !useSplit && (variant === "wordmark" || (variant === "full" && !showText));

  const content = broken ? (
    <TextFallback variant={variant} className={className} />
  ) : useSplit && option.layout === "split" ? (
    <SplitLogo
      config={option}
      placement="header"
      logoKey={logoKey}
      className={className}
      onBroken={() => setBroken(true)}
    />
  ) : useWordmarkOnly ? (
    <LogoImage
      src={src}
      alt={BRAND_LOGO.alt}
      slot={slot}
      placement={placement}
      logoKey={logoKey}
      className={className}
      onBroken={() => setBroken(true)}
    />
  ) : (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoImage
        src={src}
        alt={BRAND_LOGO.alt}
        slot={slot}
        placement={placement}
        logoKey={logoKey}
        onBroken={() => setBroken(true)}
      />
      {showText && (
        <span className="pd-logo-text text-xl font-bold text-pd-foreground">
          Only<span className="text-pd-brand">My</span>PDF
        </span>
      )}
    </span>
  );

  if (!link) return content;

  return (
    <Link
      href={href}
      className="pd-site-logo-link inline-flex shrink-0 items-center"
    >
      {content}
    </Link>
  );
}

export function FooterLogo({ className }: { className?: string }) {
  const [broken, setBroken] = useState(false);
  const { logoVariant } = useLogoPreview();
  const option = LOGO_VARIANTS[logoVariant];
  const useEnvOverride = Boolean(process.env.NEXT_PUBLIC_BRAND_LOGO?.trim());

  useEffect(() => {
    setBroken(false);
  }, [logoVariant]);

  if (broken) {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200/50 ring-1 ring-white/20">
          <FileText className="h-5 w-5 text-white" />
        </span>
        <span className="text-xl font-bold text-gray-900">
          Only
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My
          </span>
          PDF
        </span>
      </span>
    );
  }

  if (!useEnvOverride && option.layout === "split") {
    return (
      <SplitLogo
        config={option}
        placement="footer"
        logoKey={logoVariant}
        className={className}
        onBroken={() => setBroken(true)}
      />
    );
  }

  const src = useEnvOverride ? BRAND_LOGO.src : option.src;
  const slot = getLogoSlot(logoVariant, "footer");

  return (
    <LogoImage
      src={src}
      alt={APP_NAME}
      slot={slot}
      placement="footer"
      logoKey={logoVariant}
      className={className}
      onBroken={() => setBroken(true)}
    />
  );
}

export { isSplitLogo };

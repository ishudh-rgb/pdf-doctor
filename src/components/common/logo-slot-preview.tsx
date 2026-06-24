import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";
import type { LogoDisplaySlot } from "@/config/brand-logos";

/**
 * Renders logo image inside a max-size box — img scales down via max-* only
 * so nothing is forced to fill height and clip against the header border.
 */
export function LogoIconBox({
  src,
  alt,
  slot,
  className,
  logoKey,
  onError,
}: {
  src: string;
  alt: string;
  slot: LogoDisplaySlot;
  className?: string;
  logoKey?: string;
  onError?: () => void;
}) {
  return (
    <span
      className={cn(
        "pd-logo-icon-box inline-flex shrink-0 items-center justify-center",
        className
      )}
      style={
        {
          "--pd-header-logo-max-h": `${slot.maxHeight}px`,
          "--pd-header-logo-max-w": `${slot.maxWidth}px`,
          maxHeight: slot.maxHeight,
          maxWidth: slot.maxWidth,
        } as CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={logoKey}
        src={src}
        alt={alt}
        className="block object-contain object-center"
        style={{
          maxHeight: slot.maxHeight,
          maxWidth: slot.maxWidth,
          width: "auto",
          height: "auto",
        }}
        onError={onError}
      />
    </span>
  );
}

/** Full wordmark image (non-split logos) */
export function LogoSlotPreview({
  src,
  alt,
  slot,
  className,
  logoKey,
  onError,
}: {
  src: string;
  alt: string;
  slot: LogoDisplaySlot;
  className?: string;
  logoKey?: string;
  onError?: () => void;
}) {
  return (
    <LogoIconBox
      src={src}
      alt={alt}
      slot={slot}
      className={cn("pd-brand-logo", className)}
      logoKey={logoKey}
      onError={onError}
    />
  );
}

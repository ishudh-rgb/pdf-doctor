import { cn } from "@/lib/utils/cn";
import type { LogoWordmarkStyle } from "@/config/brand-logos";

interface LogoBrandTextProps {
  wordmark: LogoWordmarkStyle;
  size?: "header" | "footer" | "icon";
  className?: string;
}

export function LogoBrandText({
  wordmark,
  size = "header",
  className,
}: LogoBrandTextProps) {
  const textSize =
    size === "header"
      ? "text-xl leading-snug tracking-tight"
      : size === "footer"
        ? "text-xl leading-snug tracking-tight"
        : "text-lg leading-snug";

  return (
    <span
      className={cn(
        "pd-logo-text inline-flex items-baseline select-none font-bold",
        textSize,
        size === "header" && "py-px",
        className
      )}
    >
      <span className={wordmark.primaryClass}>{wordmark.primary}</span>
      <span className={cn(wordmark.accentClass, "inline-block pb-px")}>
        {wordmark.accent}
      </span>
    </span>
  );
}

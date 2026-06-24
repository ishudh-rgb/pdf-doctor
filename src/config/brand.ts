import { APP_NAME } from "@/config/constants";
import { LOGO_VARIANTS, DEFAULT_LOGO_VARIANT } from "@/config/brand-logos";

const locked = LOGO_VARIANTS[DEFAULT_LOGO_VARIANT];

/** Permanent brand logo — Logo D (Stacked Gradient) */
export const BRAND_LOGO = {
  src: locked.src,
  iconSrc: "/logos/clean/logo-d-icon-header.png",
  alt: APP_NAME,
  showTextWithIcon: false,
} as const;

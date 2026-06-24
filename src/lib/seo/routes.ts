import { TOOLS } from "@/config/constants";

/** Public marketing routes (path without trailing slash; "" = home). */
export const MARKETING_ROUTES = [
  "",
  "/all-tools",
  "/about",
  "/faq",
  "/contact",
  "/pricing",
  "/convert",
  "/privacy",
  "/cookies",
  "/terms",
] as const;

export const TOOL_SLUGS = TOOLS.map((tool) => tool.slug);

/** edit-pdf exists as a route but is not listed in TOOLS. */
export const EXTRA_TOOL_SLUGS = ["edit-pdf"] as const;

export const ALL_PUBLIC_TOOL_SLUGS = [...TOOL_SLUGS, ...EXTRA_TOOL_SLUGS];

export const NOINDEX_ROUTE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

/** Map tool slug (merge-pdf) to i18n key (tools.mergePdf.name). */
export function slugToToolKey(slug: string): string {
  if (!slug.includes("-")) {
    return `tools.${slug}.name`;
  }
  const camel = slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  return `tools.${camel}.name`;
}

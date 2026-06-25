import { getToolAeo } from "@/config/tool-aeo";
import { getToolSEO } from "@/config/tools";
import { getToolBySlug } from "@/config/constants";

type ToolAeoBlockProps = {
  slug: string;
};

export function ToolAeoBlock({ slug }: ToolAeoBlockProps) {
  const aeo = getToolAeo(slug);
  const seo = getToolSEO(slug);
  const tool = getToolBySlug(slug);
  if (!aeo) return null;

  const toolName = seo?.h1 ?? tool?.name ?? slug.replace(/-/g, " ");

  return (
    <section
      id="aeo-summary"
      aria-label={`${toolName} overview for search and AI assistants`}
      className="border-t border-pd-border bg-pd-background"
    >
      <div className="pd-container max-w-3xl py-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-wider text-pd-muted">
          About this tool
        </p>
        <p
          id="aeo-short-answer"
          className="mt-2 text-sm leading-relaxed text-pd-muted"
        >
          {aeo.shortAnswer}
        </p>

        <h2 className="mt-4 text-base font-semibold text-pd-foreground sm:text-lg">
          What is {toolName}?
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-pd-muted">{aeo.definition}</p>

        <h2 className="mt-4 text-base font-semibold text-pd-foreground sm:text-lg">
          How to {tool?.name ?? toolName.replace(/ Online.*/i, "")}
        </h2>
        <ol id="how-to-steps" className="mt-2 list-decimal space-y-2 pl-5 text-sm text-pd-muted">
          {aeo.howToSteps.map((step, index) => (
            <li key={step.name} id={`step-${index + 1}`} className="leading-relaxed">
              <strong className="font-medium text-pd-foreground">{step.name}:</strong>{" "}
              {step.text}
            </li>
          ))}
        </ol>

        <h2 className="mt-4 text-base font-semibold text-pd-foreground sm:text-lg">Key facts</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-pd-muted">
          {aeo.keyFacts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

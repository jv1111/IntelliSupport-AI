import { articleScopeLabels } from "@/components/knowledge-base/data";
import type { KnowledgeBaseFilter } from "@/lib/knowledge-base/types";

interface ArticleScopeFilterProps {
  value: KnowledgeBaseFilter;
  onChange: (value: KnowledgeBaseFilter) => void;
}

const scopeOptions: { label: string; value: KnowledgeBaseFilter }[] = [
  { label: "All Articles", value: "all" },
  { label: articleScopeLabels.generic, value: "generic" },
  { label: articleScopeLabels.specific, value: "specific" },
];

const optionStyles =
  "rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15";

const optionStateStyles = {
  active: "border-primary/30 bg-primary/5 text-primary",
  inactive:
    "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground",
};

export function ArticleScopeFilter({
  value,
  onChange,
}: ArticleScopeFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter articles by scope"
      className="flex flex-wrap items-center gap-2"
    >
      {scopeOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`${optionStyles} ${
              isActive ? optionStateStyles.active : optionStateStyles.inactive
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

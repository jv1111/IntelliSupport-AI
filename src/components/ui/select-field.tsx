import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { fieldControlStyles } from "@/components/ui/field";

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  options: readonly SelectFieldOption[];
}

export function SelectField({
  id,
  options,
  required = false,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        required={required}
        className={`${fieldControlStyles} appearance-none py-2.5 ps-3.5 pe-10 font-semibold ${className}`.trim()}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

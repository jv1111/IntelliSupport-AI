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
    <select
      id={id}
      required={required}
      className={`${fieldControlStyles} px-3.5 py-2.5 font-semibold ${className}`.trim()}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = "", ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        className={`bg-surface pl-10 ${className}`.trim()}
        {...props}
      />
    </div>
  );
}

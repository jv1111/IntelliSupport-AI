import type { InputHTMLAttributes } from "react";
import { fieldControlStyles } from "@/components/ui/field";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const inputStyles = `${fieldControlStyles} py-3 font-medium duration-300`;

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`${inputStyles} ${className}`.trim()} {...props} />;
}

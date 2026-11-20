import type { InputHTMLAttributes } from "react";
import { fieldControlStyles } from "@/components/ui/field";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const inputStyles = `${fieldControlStyles} px-3.5 py-2.5 font-medium duration-300`;

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`${inputStyles} ${className}`.trim()} {...props} />;
}

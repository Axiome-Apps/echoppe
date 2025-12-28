import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border px-4 py-2 text-base transition-colors",
          "bg-white dark:bg-zinc-900",
          "border-zinc-300 dark:border-zinc-700",
          "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
          "focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {error && error.trim() && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

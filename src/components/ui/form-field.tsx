import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
}

export function FormField({ error, className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-red-600 animate-in fade-in-50">
          {error}
        </p>
      )}
    </div>
  );
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({ required, className, children, ...props }: FormLabelProps) {
  return (
    <label
      className={cn("block text-xs font-medium text-stone-700 select-none", className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

export function FormDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[11px] text-stone-500 leading-normal", className)} {...props}>
      {children}
    </p>
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn("text-[11px] font-medium text-red-600 animate-in fade-in-50", className)}
      {...props}
    >
      {children}
    </p>
  );
}

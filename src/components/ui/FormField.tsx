"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FORM_STYLES } from "@/lib/form-styles";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      containerClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        <Label
          htmlFor={id}
          className={FORM_STYLES.label}
        >
          {label}
        </Label>
        <Input
          ref={ref}
          id={id}
          className={`${FORM_STYLES.input} ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {helperText && (
          <p className="text-xs text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

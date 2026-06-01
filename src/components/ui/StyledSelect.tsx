"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FORM_STYLES } from "@/lib/form-styles";

export interface StyledSelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  error?: string;
  containerClassName?: string;
  disabled?: boolean;
}

export const StyledSelect = React.forwardRef<
  HTMLButtonElement,
  StyledSelectProps
>(
  (
    {
      label,
      value,
      onValueChange,
      placeholder,
      children,
      error,
      containerClassName = "",
      disabled = false,
    },
    ref
  ) => {
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <Label className={FORM_STYLES.label}>
            {label}
          </Label>
        )}
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            className={`${FORM_STYLES.select} ${
              error ? "border-red-500" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={FORM_STYLES.selectContent}>
            {children}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

StyledSelect.displayName = "StyledSelect";

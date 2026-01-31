"use client";

import { Input } from "@/components/ui/Input";

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 4);

export function PinInput({
  value,
  onChange,
  name,
  id,
  placeholder,
  disabled,
  className = "",
}: PinInputProps) {
  return (
    <Input
      name={name}
      id={id}
      value={value}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      maxLength={4}
      onChange={(event) => onChange(sanitizePin(event.target.value))}
      disabled={disabled}
      className={className}
    />
  );
}

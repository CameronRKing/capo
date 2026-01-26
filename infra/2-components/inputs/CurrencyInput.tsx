'use client';

import { InputNumber } from 'primereact/inputnumber';
import type { ValidationError } from '@m/ajv';

export interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  valid?: ValidationError[];
  disabled?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  valid: errors = [],
  disabled = false,
}: CurrencyInputProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="field">
      <label className="block mb-2">{label}</label>
      <InputNumber
        value={value}
        onValueChange={(e) => onChange(e.value ?? 0)}
        mode="currency"
        currency="USD"
        locale="en-US"
        disabled={disabled}
        className={hasErrors ? 'p-invalid' : ''}
      />
      {hasErrors && (
        <small className="p-error block mt-1">
          {errors.map((err) => err.message).join(', ')}
        </small>
      )}
    </div>
  );
}

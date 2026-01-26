'use client';

import { InputNumber } from 'primereact/inputnumber';
import type { ValidationError } from '@m/ajv';

export interface PercentageInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  valid?: ValidationError[];
  disabled?: boolean;
}

export function PercentageInput({
  label,
  value,
  onChange,
  valid: errors = [],
  disabled = false,
}: PercentageInputProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="field">
      <label className="block mb-2">{label}</label>
      <InputNumber
        value={value}
        onValueChange={(e) => onChange(e.value ?? 0)}
        mode="decimal"
        minFractionDigits={0}
        maxFractionDigits={0}
        min={0}
        max={100}
        step={1}
        suffix="%"
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

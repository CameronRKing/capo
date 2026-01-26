import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  valid?: Array<{ path: string; message: string }>;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  valid: errors = [],
  disabled = false,
  min,
  max,
  step = 1,
  placeholder = 'Enter a number...',
}: NumberInputProps) {
  const hasError = errors.length > 0;
  const errorMessage = errors.find(v => v.path.includes('value'))?.message;

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <InputNumber
        value={value}
        onChange={(e) => onChange(e.value || 0)}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={classNames('w-full', { 'p-invalid': hasError })}
      />
      {hasError && (
        <small className="p-error block mt-1">{errorMessage}</small>
      )}
    </div>
  );
}

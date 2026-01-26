import React from 'react';
import { RadioButton } from 'primereact/radiobutton';
import { classNames } from 'primereact/utils';

interface RadioInputProps {
  label: string;
  value: string | number | null;
  options: Array<{ label: string; value: string | number }>;
  onChange: (value: string | number | null) => void;
  valid?: Array<{ path: string; message: string }>;
  disabled?: boolean;
}

export function RadioInput({
  label,
  value,
  options,
  onChange,
  valid: validation = [],
  disabled = false,
}: RadioInputProps) {
  const hasError = validation.length > 0;
  const errorMessage = validation.find(v => v.path.includes('value'))?.message;

  return (
    <div className="field">
      <label className="field-label block mb-3">{label}</label>
      <div className="flex flex-column gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex align-items-center gap-2">
            <RadioButton
              inputId={`${label}-${option.value}`}
              name={label}
              value={option.value}
              onChange={(e) => onChange(e.value)}
              checked={value === option.value}
              disabled={disabled}
              className={classNames({ 'p-invalid': hasError })}
            />
            <label htmlFor={`${label}-${option.value}`} className="cursor-pointer">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {hasError && (
        <small className="p-error block mt-1">{errorMessage}</small>
      )}
    </div>
  );
}

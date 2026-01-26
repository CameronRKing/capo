import React from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import { classNames } from 'primereact/utils';

interface ToggleInputProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  valid?: Array<{ path: string; message: string }>;
  disabled?: boolean;
}

export function ToggleInput({
  label,
  value,
  onChange,
  valid: validation = [],
  disabled = false,
}: ToggleInputProps) {
  const hasError = validation.length > 0;
  const errorMessage = validation.find(v => v.path.includes('value'))?.message;

  return (
    <div className="field">
      <div className="flex align-items-center gap-3">
        <label className="field-label m-0">{label}</label>
        <InputSwitch
          checked={value}
          onChange={(e) => onChange(e.value || false)}
          disabled={disabled}
          className={classNames({ 'p-invalid': hasError })}
        />
      </div>
      {hasError && (
        <small className="p-error block mt-1">{errorMessage}</small>
      )}
    </div>
  );
}

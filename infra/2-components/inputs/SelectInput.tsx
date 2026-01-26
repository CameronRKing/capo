import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

interface SelectInputProps {
  label: string;
  value: string | null;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string | null) => void;
  valid?: Array<{ path: string; message: string }>;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
  valid: validation = [],
  placeholder = 'Select an option...',
  disabled = false,
}: SelectInputProps) {
  const hasError = validation.length > 0;
  const errorMessage = validation.find(v => v.path.includes('value'))?.message;

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <Dropdown
        value={value}
        options={options}
        onChange={(e) => onChange(e.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        className={classNames('w-full', { 'p-invalid': hasError })}
      />
      {hasError && (
        <small className="p-error">{errorMessage}</small>
      )}
    </div>
  );
}

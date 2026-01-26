import React, { useEffect, useState } from 'react';
import { PercentageInput } from './PercentageInput';
import { classNames } from 'primereact/utils';
import { humanizeKey } from '../domain-specific/utils';

interface AllocatorInputProps {
  label: string;
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  valid?: Array<{ path: string; message: string }>;
  disabled?: boolean;
  fields: Array<{
    key: string;
    value: any;
  }>;
  description?: string;
  mapSchema: Function
}

export function AllocatorInput({
  label,
  value,
  onChange,
  valid: errors = [],
  disabled = false,
  fields,
  description,
  mapSchema
}: AllocatorInputProps) {
  const hasError = errors.length > 0;
  
  // Calculate total for validation display
  const [total, setTotal] = useState(0);
  // I couldn't get this to react appropriately; I assume it has something to do with using nested objects that RxDB-hooks doesn't catch
  const updateTotal = React.useCallback((newVal: any) => {
    // @ts-ignore
    const tt = Object.values(newVal).reduce((sum, val) => sum + (val || 0), 0);
    // @ts-ignore
    setTotal(tt);
    if (newVal !== value) onChange(newVal);
  }, [value]);
  const isTotalValid = Math.abs(total - 100) <= 0.01; // Allow for floating point precision

  // set the total on initialization; otherwise it gets left at 0 no matter what
  useEffect(() => {
    updateTotal(value);
  }, []);

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {description && (
        <small className="text-gray-600 block mb-2">{description}</small>
      )}
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <div className="flex align-items-center gap-2">
              <div className="flex-1">
                {/* I know this level of indirection looks a little scary, but here's the gist:
                    we're letting each property of the allocator choose how it wants to be rendered,
                    so this component doesn't have to know anythig about it
                    ...
                    Ahh, but there's an issue: using nested objects is messing up RxDB/React
                    -- sums aren't updating correctly, logic is wonky,
                        the DB keeps throwing an error (I think React is wrapping the nested object in a proxy somewhere)
                    My options, as I see them, are:
                      (1) Move the allocators into their own schemas
                      (2) Un-nest the allocators & map their inputs by hand
                    I'm drawn to #2, but I'm going to leave it for now.
                    ...
                    Given some time to ruminate, a third option appeared: remove the indirection
                      I ended up refactoring the individual hours data schema, so I wired it together manually
                      I only need to support two inputs, then--and both are percentages.

                    Here's the old, indirect way for reference
                    {mapSchema(field.value, field.key, value[field.key], (newValue: any) => updateTotal({ ...value, [field.key]: newValue }), errors.filter(err => err.path.includes(field.key), value))}
                  */}
                  <PercentageInput
                    label={humanizeKey(field.key)}
                    value={field.value}
                    valid={errors.filter(err => err.path.includes(field.key), value)}
                    onChange={(newValue: any) => updateTotal({ ...value, [field.key]: newValue })}
                  />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total validation display */}
      <div className="mt-3 p-2 bg-gray-50 rounded border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total:</span>
          <span className={classNames("text-sm font-bold", {
            "text-green-600": isTotalValid,
            "text-red-600": !isTotalValid,
          })}>
            {total.toFixed(1)}%
          </span>
        </div>
        {!isTotalValid && (
          <small className="text-red-600 block mt-1">
            Must sum to 100%
          </small>
        )}
      </div>
      
      {hasError && errors.map((error, index) => (
        <small key={index} className="p-error block mt-1">
          {error.message}
        </small>
      ))}
    </div>
  );
}

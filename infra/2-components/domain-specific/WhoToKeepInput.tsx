import React from 'react';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';
import { useModelContext } from '@c/contexts/ModelContext';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  errors?: Array<{ path: string; message: string }>;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

// 2-components/domain-specific/FiringInput.tsx
export const WhoToKeepInput = () => {
  const { model } = useModelContext();
  const currentTeam = model.currentTeam || [];

  const validateUpdate = React.useCallback((repId: string) => (checked: boolean) => {
    if (checked) {
        model.patch({
            hiringList: model.hiringList.filter((id: string) => id !== rep.id)
        });
    } else {
        model.patch({
            hiringList: [...model.hiringList, rep.id]
        });
    }
  }, [model]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-3">Current Team</h3>
      <div className="space-y-2">
        {currentTeam.map((rep, index) => (
            <>
                <label>{rep.name}</label>
                <Checkbox
                    key={rep.id}
                    checked={model.hiringList.includes(rep.id)}
                    onChange={validateUpdate(rep.id)}
                    validation={useFieldValidation('hiringList', {
                        minRemaining: 3
                    })}
                />
            </>
        ))}
      </div>
    </div>
  );
};
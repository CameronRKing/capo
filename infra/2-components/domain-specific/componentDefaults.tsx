import { CurrencyInput } from '../inputs/CurrencyInput';
import { PercentageInput } from '../inputs/PercentageInput';
import { SelectInput } from '../inputs/SelectInput';
import { ToggleInput } from '../inputs/ToggleInput';
import { RadioInput } from '../inputs/RadioInput';
import { NumberInput } from '../inputs/NumberInput';


// triple-nested functions look a little complicated, but what we're doing is this:
//   + capturing *shared* context among the 3rd-level functions via the top-level fn (props)
//   + overriding *specific* context via the mid-level fn (label, enumValues)
const lookupFactory = (label: string, props: any, enumValues?: Array<string>) => {

    return (overrides?: { label?: string, enumValues?: Array<string> }) => {
    
        if (overrides) {
            if (overrides.label) label = overrides.label;
            if (overrides.enumValues) enumValues = overrides.enumValues;
        }

         return {
            format: {
                percentage: () => <PercentageInput label={label} {...props} />,
                currency: () => <CurrencyInput label={label} {...props} />,
            },
            type: {
                boolean: () => <ToggleInput label={label} {...props} />,
                integer: () =>  <NumberInput label={label} {...props} />,
                number: () =>  <NumberInput label={label} {...props} />
            },
            misc: {
                radio: () => {
                    const options = enumValues!.map((val: string) => ({
                        label: ('' + val).charAt(0).toUpperCase() + ('' + val).slice(1),
                        value: val
                    }));
                    
                    return (
                        <RadioInput
                            label={label}
                            options={options}
                            {...props}
                        />
                    );
                },
                select: () => {
                    const options = enumValues!.map((val: string) => ({
                        label: val.charAt(0).toUpperCase() + val.slice(1), // Capitalize
                        value: val
                    }));
                    
                    return (
                        <SelectInput
                            label={label}
                            options={options}
                            placeholder={`Select ${label}...`}
                            {...props}
                        />
                    );
                }
            }
        }
    }
};

export default lookupFactory;
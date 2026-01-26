'use client';

import { useState, useMemo, useCallback } from 'react';
import lookupFactory from './componentDefaults';
import overrides from './componentOverrides';
import { AllocatorInput } from '../inputs/AllocatorInput';
import { useModelContext } from '../contexts/ModelContext';
import { ajv, formatValidationErrors, type ValidationError } from '@m/ajv';
import { humanizeKey } from './utils';


interface SchemaInputProps {
  field: string;
  schema: any;  // JSON Schema
  label?: string
}

// Map schema format/type to input component
function mapSchemaToInput(modelName: string, label: string, propertySchema: any, value: any, onChange: (v: any) => void, feedback: ValidationError[], allModelData: any) {
  let { type, format, enum: enumValues } = propertySchema;

  const props = { value, onChange, valid: feedback };

  const overrideLookup = lookupFactory(label, props, enumValues);

  // todo: fix/improve typing
  try {
    // @ts-ignore
    const model = overrides[modelName];
    if (model && model[label]) return model[label](allModelData, overrideLookup);
  } catch (err) {
    debugger;
  }

  // if no overrides, use default lookups
  const lookup = overrideLookup(); // override nothing; use all defaults
  // @ts-ignore
  if (lookup.format[format]) return lookup.format[format]();
  // @ts-ignore
  if (lookup.type[type]) return lookup.type[type]();
  if (enumValues) return lookup.misc.select();
  
  // special case: the allocator input, identified by a custom keyword
  // we could move it to the overrides file, but I'm okay with this one special case for now
  if (propertySchema.mustSumTo) {
    return (
      <AllocatorInput
        label={propertySchema.description || label}
        fields={Object.entries(propertySchema.properties).map(([key]) => ({ key, value: value[key] }))}
        description={propertySchema.helpText}
        {...props}
        mapSchema={mapSchemaToInput}
      />
    );
  }


  
  // TODO: Add more mappings as we build more input types
  // - type: 'string' -> TextInput
  
  throw new Error(`No input mapping found for type=${type}, format=${format}, enum=${enumValues}`);
}

export function SchemaInput({ label, field, schema }: SchemaInputProps) {
  const { model, config } = useModelContext();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  // Get property schema
  const propertySchema = schema.properties[field];
  if (!propertySchema) {
    throw new Error(`Field "${field}" not found in schema`);
  }
  
  // Derive label from field name
  label = label || field || '';
  label = humanizeKey(label);
  
  // Compile validator
  // it's not efficient for each input to compile their own validator on component mount, but it'll work for now
    // at least with memoization it's only once per mount, not once per render
  const validate = useMemo(() => {
    // removing RxDB-specific fields; Ajv throws errors on encounter
    const sschema = Object.assign({}, schema);
    delete sschema['version'];
    delete sschema['primaryKey'];
    
    const validate = ajv.compile(sschema);
    return validate;
  }, [schema])
  
  const updateValidation = useCallback((updatedData: any) => {
    console.log({ updatedData });
    const isValid = validate(updatedData);
    const validationErrors = isValid ? [] : formatValidationErrors(validate.errors || []);
    if (!isValid) console.log(validationErrors);

    setErrors(validationErrors.filter(err => err.path === field));
    return isValid;
  }, [validate]);

  const syncData = useCallback((isValid: boolean, newValue: any) => {
    console.log('handling change', config, isValid)
    if (config.live && (isValid || config.syncOnInvalid)) {
      console.log('  patching...', model._rev, newValue);
      if (typeof newValue === 'object') newValue = Object.assign({}, newValue);
      return model.patch({ [field]: newValue });
    }
  }, [model, config, field]);
  
  const handleChange = async (newValue: any) => {
    const updatedData = { ...model.toJSON(), [field]: newValue };
    
    const isValid = updateValidation(updatedData);
    
    syncData(isValid, newValue);
  };
  
  // @ts-ignore
  return mapSchemaToInput(schema.title, label, propertySchema, model[field], handleChange, errors, model.toJSON());
}

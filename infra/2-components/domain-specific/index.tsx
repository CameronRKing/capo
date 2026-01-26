'use client';

import React from 'react';
import { SchemaInput } from './SchemaInput';
import type { RxCollection } from 'rxdb';

/**
 * Extends an RxDB collection with field-specific input components
 * Usage: db.hiring_decisions.salary.Input
 */
export function extendCollectionWithInputs<T>(
  collection: RxCollection<T>,
  schema: any
): RxCollection<T> & Record<string, { Input: () => React.ReactElement }> {
  const extended = collection as any;
  
  // For each property in the schema, create a field object with an Input component
  Object.keys(schema.properties).forEach((field) => {
    // Skip metadata fields (id, companyId, quarter - these aren't user-editable inputs)
    if (['id', 'companyId', 'quarter'].includes(field)) {
      return;
    }
    
    extended[field] = {
      Input: () => <SchemaInput field={field} schema={schema} />
    };
  });
  
  return extended;
}

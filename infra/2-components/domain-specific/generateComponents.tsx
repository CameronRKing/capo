'use client';

import React from 'react';
import { SchemaInput } from './SchemaInput';

// // Type definitions for better TypeScript support
// interface ComponentNamespace {
//   Input: React.ComponentType<{ field?: string; schema?: any }>;
// }

// interface GeneratedComponents<T> {
//   [key: string]: ComponentNamespace;
// }

type ExtractProperties<T> = T extends Record<string, any> 
  ? keyof T['properties'] 
  : never;

type RemoveMetadata<T> = T extends string 
  ? T extends 'id' | 'companyId' | 'quarter' 
    ? never 
    : T 
  : never;

type ComponentNamespace<T> = {
  Input: React.ComponentType<{ label?: string }>;
};

type GeneratedComponents<T> = {
  [K in ExtractProperties<T> as RemoveMetadata<K> extends never ? never : K]: ComponentNamespace<K>;
};

// export function generateComponents<TSchema extends Record<string, any>>(
//   schema: TSchema
// ): GenerateComponents<TSchema> {
//   // Implementation stays the same
// }

/**
 * Generates a typed component namespace from a JSON schema
 * Creates nested objects like: { Salary: { Input: Component } }
 * Provides TypeScript autocomplete like: <Hiring.salary.Input />
 */
export function generateComponents<TSchema extends Record<string, any>>(
  schema: TSchema
): GeneratedComponents<TSchema> {
  // @ts-ignore
  const components: GeneratedComponents<TSchema> = {};
  
  // For each property in schema
  Object.keys(schema.properties || {}).forEach((field) => {
    // Skip metadata fields
    if (['id', 'companyId', 'quarter'].includes(field)) {
      return;
    }
    
    // Create a capitalized field name for namespace
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    
    // Create the field namespace with a typed Input component
    // @ts-ignore
    components[field] = {
      Input: ({ label }: { label?: string }) => <SchemaInput label={label} field={field} schema={schema} />
    };
  });
  
  return components;
}
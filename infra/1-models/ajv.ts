import { getAjv } from 'rxdb/plugins/validate-ajv';
const ajv = getAjv();

// Custom format: currency (for salary field)
ajv.addFormat('currency', {
  type: 'number',
  validate: (value: number) => {
    return typeof value === 'number' && Number.isFinite(value);
  },
});

ajv.addFormat('percentage', {
  type: 'number',
  validate: (value: number) => {
    return typeof value === 'number';
  },
});

// Custom keyword: mustSumTo
// Validates that all numeric properties in an object sum to a specific value
ajv.addKeyword({
  keyword: 'mustSumTo',
  type: 'object',
  schemaType: 'number',
  error: {
    message(ctx) {
      return 'Values must sum to ' + ctx.schemaValue;
    }
  },
  compile: (schemaVal: number) => {
    return function validate(data: any) {
      if (typeof data !== 'object' || data === null) {
        return true; // Not applicable to non-objects
      }

      const sum = Object.values(data)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
        .reduce((acc: number, val: number) => acc + val, 0);

      if (Math.abs(sum - schemaVal) > 0.01) { // Allow for floating point precision
        return false;
      }

      return true;
    };
  },
});

export { ajv };

// Helper to format validation errors for display
export interface ValidationError {
  path: string;
  message: string;
}

export function formatValidationErrors(errors: any[]): ValidationError[] {
  if (!errors) return [];
  
  return errors.map((error) => ({
    path: error.instancePath.replace(/^\//, '').replace(/\//g, '.') || 'root',
    message: error.message || 'Validation failed',
  }));
}

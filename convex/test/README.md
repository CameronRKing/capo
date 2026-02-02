# Test Helpers for Capo Project

This directory contains test helper utilities for the Capo business simulation project.

## Overview

The test helpers provide convenient functions for setting up test data in your Convex tests. They work with the `convex-test` library to create a mock backend environment.

## Usage

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { setupTestSchema, setupTestAttribute, setupTestAction } from "../test/testHelpers";

test("example test", async () => {
  const t = convexTest(schema);

  // Create test data using helpers
  const attr = await setupTestAttribute(t, {
    name: "test-attr",
    type: "string",
    default: "default-value",
  });

  const action = await setupTestAction(t, {
    name: "test-action",
    fn: "console.log('hello')",
  });

  const testSchema = await setupTestSchema(t, {
    name: "test-schema",
    version: "1.0.0",
    attrs: [attr],
    actions: [action],
  });

  // Query and verify
  const result = await t.run(async (ctx) => {
    return await ctx.db.get(testSchema);
  });

  expect(result).toMatchObject({
    name: "test-schema",
    version: "1.0.0",
  });
});
```

## Available Helper Functions

### Schema Helpers

- **`setupTestSchema(t, schemaData)`** - Creates a schema entry with attributes, actions, and layouts
- **`setupTestAttribute(t, attrData)`** - Creates an attribute definition
- **`setupTestAction(t, actionData)`** - Creates an action definition
- **`setupTestReaction(t, reactionData)`** - Creates a reaction definition

### Layout Helpers

- **`setupTestLayoutElement(t, elementData)`** - Creates a layout element (UI component)
- **`setupTestLayout(t, layoutData)`** - Creates a layout with props, state, and render element

### EAVT Helpers

The project uses an Entity-Attribute-Value-Timestamp (EAVT) data model:

- **`setupTestEAVT(t, eavtData)`** - Creates an EAVT entry
- **`getEntityEAVTs(t, entityId)`** - Queries all EAVT entries for an entity
- **`getAttributeEAVTs(t, attrName)`** - Queries all EAVT entries for an attribute
- **`setupTestTransaction(t, txData)`** - Creates a transaction record

### General Helpers

- **`setupTestNumber(t, value)`** - Creates a number entry (for simple tests)
- **`setupTestNumbers(t, values)`** - Bulk creates multiple numbers
- **`clearTable(t, tableName)`** - Clears all entries from a table

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run all tests once
npm run test:once

# Run only Convex tests
npm run test:once convex/

# Run with coverage
npm run test:coverage

# Debug tests
npm run test:debug
```

## Test Files

- **`convex/schema.test.ts`** - Comprehensive tests demonstrating schema helpers
- **`convex/myFunctions.test.ts`** - Example tests for Convex functions

## Type Safety

All helper functions are fully typed with TypeScript. The `TestContext` type is exported for advanced use cases:

```typescript
import type { TestContext } from "../test/testHelpers";

function myCustomHelper(t: TestContext) {
  // Your custom test logic here
}
```

## Best Practices

1. **Use helpers for setup**: Keep your test code clean by using helpers instead of direct `t.run()` calls
2. **Query helpers for verification**: Use the query helpers to verify data was created correctly
3. **Clean up between tests**: Each test gets a fresh database, so no manual cleanup is needed
4. **Test types match schema**: Ensure your test data matches the Convex schema types

## Example: Complete Integration Test

```typescript
test("create complete schema with all components", async () => {
  const t = convexTest(schema);

  // Create attributes
  const nameAttr = await setupTestAttribute(t, {
    name: "name",
    type: "string",
    default: "",
  });

  // Create actions
  const action = await setupTestAction(t, {
    name: "increment",
    fn: "count + 1",
  });

  // Create layout
  const renderEl = await setupTestLayoutElement(t, {
    tag: "div",
  });

  const layout = await setupTestLayout(t, {
    props: [{ name: "name", def: nameAttr }],
    render: renderEl,
  });

  // Create complete schema
  const schemaId = await setupTestSchema(t, {
    name: "counter-schema",
    version: "1.0.0",
    attrs: [nameAttr],
    actions: [action],
    layouts: [{ name: "default", layout: layout }],
  });

  // Verify
  const testSchema = await t.run(async (ctx) => {
    return await ctx.db.get(schemaId);
  });

  expect(testSchema?.attrs).toHaveLength(1);
  expect(testSchema?.actions).toHaveLength(1);
  expect(testSchema?.layouts).toHaveLength(1);
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [convex-test Documentation](https://docs.convex.dev/testing/convex-test)
- [Testing Guide](/.claude/docs/testing/vitest-convex-test.md)

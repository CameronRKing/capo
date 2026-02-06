import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import {
  setupTestSchema,
  setupTestAttribute,
  setupTestAction,
  setupTestLayoutElement,
  setupTestLayout,
  setupTestEAVT,
  setupTestTransaction,
  setupTestReaction,
  setupTestNumber,
  setupTestNumbers,
  getEntityEAVTs,
  getAttributeEAVTs,
  clearTable,
} from "./test/testHelpers";

test("schema helpers - create and retrieve attribute", async () => {
  const t = convexTest(schema);

  // Create a test attribute
  const attrId = await setupTestAttribute(t, {
    name: "test-attr",
    type: "string",
    default: "default-value",
  });

  // Query it back
  const attr = await t.run(async (ctx) => {
    return await ctx.db.get(attrId);
  });

  expect(attr).toMatchObject({
    name: "test-attr",
    type: "string",
    default: "default-value",
  });
});

test("schema helpers - create schema with attributes", async () => {
  const t = convexTest(schema);

  // Create test attributes
  const attr1 = await setupTestAttribute(t, {
    name: "attr1",
    type: "number",
    default: "0",
  });

  const attr2 = await setupTestAttribute(t, {
    name: "attr2",
    type: "boolean",
    default: "false",
  });

  // Create schema with attributes
  const schemaId = await setupTestSchema(t, {
    name: "test-schema",
    version: "1.0.0",
    attrs: [attr1, attr2],
  });

  // Query it back
  const testSchema = await t.run(async (ctx) => {
    return await ctx.db.get(schemaId);
  });

  expect(testSchema).toMatchObject({
    name: "test-schema",
    version: "1.0.0",
  });
  expect(testSchema?.attrs).toHaveLength(2);
});

test("schema helpers - create action with self-reference ID", async () => {
  const t = convexTest(schema);

  // Create a test action
  const actionId = await setupTestAction(t, {
    name: "test-action",
    fn: "console.log('hello')",
    args: { foo: "bar" },
  });

  // Query it back
  const action = await t.run(async (ctx) => {
    return await ctx.db.get(actionId);
  });

  expect(action).toMatchObject({
    name: "test-action",
    fn: "console.log('hello')",
    args: { foo: "bar" },
  });
  // Verify self-reference ID
  expect(action?.id).toEqual(actionId);
});

test("schema helpers - create layout with element hierarchy", async () => {
  const t = convexTest(schema);

  // Create child elements
  const child1 = await setupTestLayoutElement(t, {
    tag: "span",
    attrs: [{ key: "class", val: "text-red" }],
  });

  const child2 = await setupTestLayoutElement(t, {
    tag: "span",
    attrs: [{ key: "class", val: "text-blue" }],
  });

  // Create parent element
  const parent = await setupTestLayoutElement(t, {
    tag: "div",
    children: [child1, child2],
  });

  // Query parent back
  const element = await t.run(async (ctx) => {
    return await ctx.db.get(parent);
  });

  expect(element).toMatchObject({
    tag: "div",
  });
  expect(element?.children).toHaveLength(2);
});

test("schema helpers - create EAVT entries and query by entity", async () => {
  const t = convexTest(schema);

  // Create EAVT entries for entity 123
  await setupTestEAVT(t, {
    id: 123,
    attr: "name",
    value: "Test Entity",
    tx: 1,
  });

  await setupTestEAVT(t, {
    id: 123,
    attr: "status",
    value: "active",
    tx: 2,
  });

  // Create EAVT entry for different entity
  await setupTestEAVT(t, {
    id: 456,
    attr: "name",
    value: "Another Entity",
    tx: 3,
  });

  // Query entity 123's attributes
  const entityAttrs = await getEntityEAVTs(t, 123);

  expect(entityAttrs).toHaveLength(2);
  expect(entityAttrs[0]).toMatchObject({
    id: 123,
    attr: "name",
    value: "Test Entity",
  });
  expect(entityAttrs[1]).toMatchObject({
    id: 123,
    attr: "status",
    value: "active",
  });
});

test("schema helpers - create EAVT entries and query by attribute", async () => {
  const t = convexTest(schema);

  // Create EAVT entries with same attribute
  await setupTestEAVT(t, {
    id: 1,
    attr: "status",
    value: "active",
    tx: 1,
  });

  await setupTestEAVT(t, {
    id: 2,
    attr: "status",
    value: "inactive",
    tx: 2,
  });

  // Create EAVT entry with different attribute
  await setupTestEAVT(t, {
    id: 3,
    attr: "name",
    value: "Test",
    tx: 3,
  });

  // Query by attribute name
  const statusAttrs = await getAttributeEAVTs(t, "status");

  expect(statusAttrs).toHaveLength(2);
  expect(statusAttrs[0]).toMatchObject({
    attr: "status",
    value: "active",
  });
  expect(statusAttrs[1]).toMatchObject({
    attr: "status",
    value: "inactive",
  });
});

test("schema helpers - create transaction", async () => {
  const t = convexTest(schema);

  // Create a transaction
  const txId = await setupTestTransaction(t, {
    ms: Date.now(),
    evt: "test-event",
    usr: "test-user",
  });

  // Query it back
  const tx = await t.run(async (ctx) => {
    return await ctx.db.get(txId);
  });

  expect(tx).toMatchObject({
    evt: "test-event",
    usr: "test-user",
  });
});

test("schema helpers - create reaction", async () => {
  const t = convexTest(schema);

  // Create a reaction
  const reactionId = await setupTestReaction(t, {
    name: "test-reaction",
    desc: "A test reaction",
    given: { entity: 123 },
    when: { status: "active" },
    then: { action: "notify" },
  });

  // Query it back
  const reaction = await t.run(async (ctx) => {
    return await ctx.db.get(reactionId);
  });

  expect(reaction).toMatchObject({
    name: "test-reaction",
    desc: "A test reaction",
  });
});

test("schema helpers - create complete layout with render element", async () => {
  const t = convexTest(schema);

  // Create render element
  const renderElement = await setupTestLayoutElement(t, {
    tag: "div",
    attrs: [{ key: "class", val: "container" }],
  });

  // Create layout
  const layoutId = await setupTestLayout(t, {
    props: [{ name: "title", def: "attr1" }],
    state: [{ name: "count", def: "attr2" }],
    render: renderElement,
  });

  // Query layout back
  const layout = await t.run(async (ctx) => {
    return await ctx.db.get(layoutId);
  });

  expect(layout).toMatchObject({
    props: [{ name: "title", def: "attr1" }],
    state: [{ name: "count", def: "attr2" }],
  });
});

test("number helpers - create single number", async () => {
  const t = convexTest(schema);

  // Create a test number
  const numberId = await setupTestNumber(t, 42);

  // Query it back
  const number = await t.run(async (ctx) => {
    return await ctx.db.get(numberId);
  });

  expect(number).toMatchObject({
    value: 42,
  });
});

test("number helpers - bulk create numbers", async () => {
  const t = convexTest(schema);

  // Create multiple test numbers
  const values = [10, 20, 30, 40, 50];
  const numberIds = await setupTestNumbers(t, values);

  expect(numberIds).toHaveLength(5);

  // Query all numbers back
  const allNumbers = await t.run(async (ctx) => {
    return await ctx.db.query("numbers").collect();
  });

  expect(allNumbers).toHaveLength(5);
  expect(allNumbers.map((n) => n.value)).toEqual(values);
});

test("table helpers - clear table", async () => {
  const t = convexTest(schema);

  // Create some test numbers
  await setupTestNumbers(t, [1, 2, 3, 4, 5]);

  // Verify they exist
  const beforeClear = await t.run(async (ctx) => {
    return await ctx.db.query("numbers").collect();
  });
  expect(beforeClear).toHaveLength(5);

  // Clear the table
  await clearTable(t, "numbers");

  // Verify they're gone
  const afterClear = await t.run(async (ctx) => {
    return await ctx.db.query("numbers").collect();
  });
  expect(afterClear).toHaveLength(0);
});

test("integration - create schema with actions, attributes, and layout", async () => {
  const t = convexTest(schema);

  // Create attributes
  const nameAttr = await setupTestAttribute(t, {
    name: "name",
    type: "string",
    default: "",
  });

  const countAttr = await setupTestAttribute(t, {
    name: "count",
    type: "number",
    default: "0",
  });

  // Create actions
  const incrementAction = await setupTestAction(t, {
    name: "increment",
    fn: "count + 1",
    args: { count: "number" },
  });

  // Create render element
  const renderEl = await setupTestLayoutElement(t, {
    tag: "div",
    logic: [{ op: "text", payload: { bind: "name" } }],
  });

  // Create layout
  const layout = await setupTestLayout(t, {
    props: [{ name: "name", def: nameAttr }],
    state: [{ name: "count", def: countAttr }],
    derived: [{ name: "doubled", fn: incrementAction }],
    render: renderEl,
  });

  // Create schema with all components
  const schemaId = await setupTestSchema(t, {
    name: "counter-schema",
    version: "1.0.0",
    attrs: [nameAttr, countAttr],
    actions: [incrementAction],
    layouts: [{ name: "default", layout: layout }],
  });

  // Query and verify complete schema
  const testSchema = await t.run(async (ctx) => {
    return await ctx.db.get(schemaId);
  });

  expect(testSchema).toMatchObject({
    name: "counter-schema",
    version: "1.0.0",
  });
  expect(testSchema?.attrs).toHaveLength(2);
  expect(testSchema?.actions).toHaveLength(1);
  expect(testSchema?.layouts).toHaveLength(1);
});

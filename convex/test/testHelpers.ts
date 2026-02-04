import { convexTest } from "convex-test";
import type { GenericMutationCtx, GenericActionCtx, GenericDataModel } from "convex/server";
import schema from "../schema";

/**
 * Test helper context type
 *
 * The test context provides access to both mutation and action capabilities
 * via the `run` method. We extract the DataModel from our schema definition.
 */
type DataModel = GenericDataModel;

export type TestContext = {
  query: ReturnType<typeof convexTest>["query"];
  mutation: ReturnType<typeof convexTest>["mutation"];
  action: ReturnType<typeof convexTest>["action"];
  run: <Output>(
    func: (ctx: GenericMutationCtx<DataModel> & Pick<GenericActionCtx<DataModel>, "storage">) => Promise<Output>
  ) => Promise<Output>;
  fetch: ReturnType<typeof convexTest>["fetch"];
};

/**
 * Setup helper that creates a test schema entry
 * Useful for testing schema-driven functionality
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created schema ID
 */
export async function setupTestSchema(
  t: TestContext,
  schemaData: {
    name: string;
    version: string;
    attrs?: Array<string>;
    actions?: Array<string>;
    layouts?: Array<{ name: string; layout: string }>;
  }
) {
  return await t.run(async (ctx) => {
    const attrIds = schemaData.attrs ?? [];
    const actionIds = schemaData.actions ?? [];
    const layouts = schemaData.layouts ?? [];

    return await ctx.db.insert("schemas", {
      name: schemaData.name,
      version: schemaData.version,
      attrs: attrIds as any,
      actions: actionIds as any,
      layouts: layouts as any,
    });
  });
}

/**
 * Setup helper that creates a test attribute
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created attribute ID
 */
export async function setupTestAttribute(
  t: TestContext,
  attrData: {
    name: string;
    type: string;
    default?: string;
  }
) {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert("attrs", {
      name: attrData.name,
      type: attrData.type,
      default: attrData.default ?? "",
    });

    // Patch with the ID as a self-reference (common pattern in this schema)
    await ctx.db.patch(id, { id });

    return id;
  });
}

/**
 * Setup helper that creates a test action
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created action ID
 */
export async function setupTestAction(
  t: TestContext,
  actionData: {
    name: string;
    fn: string;
    args?: any;
  }
) {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert("actions", {
      name: actionData.name,
      fn: actionData.fn,
      args: actionData.args ?? null,
    });

    // Patch with the ID as a self-reference
    await ctx.db.patch(id, { id });

    return id;
  });
}

/**
 * Setup helper that creates a test layout element
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created layout element ID
 */
export async function setupTestLayoutElement(
  t: TestContext,
  elementData: {
    tag: string;
    logic?: Array<{ op: string; payload: any }>;
    attrs?: Array<{ key: string; val: any }>;
    children?: Array<string>;
  }
) {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert("layoutEl", {
      tag: elementData.tag,
      logic: elementData.logic ?? [],
      attrs: elementData.attrs ?? [],
      children: elementData.children ?? [] as any,
    });

    // Patch with the ID as a self-reference
    await ctx.db.patch(id, { id });

    return id;
  });
}

/**
 * Setup helper that creates a test layout
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created layout ID
 */
export async function setupTestLayout(
  t: TestContext,
  layoutData: {
    props?: Array<{ name: string; def: string }>;
    state?: Array<{ name: string; def: string }>;
    derived?: Array<{ name: string; fn: string }>;
    ctx?: Array<{ name: string; def: string }>;
    hooks?: Array<{ name: string; def: string }>;
    render: string;
  }
) {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert("layouts", {
      props: layoutData.props ?? [],
      state: layoutData.state ?? [],
      derived: layoutData.derived ?? [],
      ctx: layoutData.ctx ?? [],
      hooks: layoutData.hooks ?? [],
      render: layoutData.render as any,
    });

    // Patch with the ID as a self-reference
    await ctx.db.patch(id, { id });

    return id;
  });
}

/**
 * Setup helper that creates an EAVT (Entity-Attribute-Value-Timestamp) entry
 * This is the core data pattern for this schema
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created EAVT entry ID
 */
export async function setupTestEAVT(
  t: TestContext,
  eavtData: {
    id: number;
    attr: string;
    value: any;
    tx: number;
    w?: number;
  }
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("eavts", {
      id: eavtData.id,
      attr: eavtData.attr,
      value: eavtData.value,
      tx: eavtData.tx,
      w: eavtData.w ?? 1,
    });
  });
}

/**
 * Setup helper that creates a test transaction
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created transaction ID
 */
export async function setupTestTransaction(
  t: TestContext,
  txData: {
    ms: number;
    evt?: string;
    usr?: string;
  }
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("txs", {
      ms: txData.ms,
      evt: txData.evt,
      usr: txData.usr,
    });
  });
}

/**
 * Setup helper that creates a complete test reaction
 * 
 * @param t - The test context from convexTest(schema)
 * @returns The created reaction ID
 */
export async function setupTestReaction(
  t: TestContext,
  reactionData: {
    name: string;
    desc: string;
    given: any;
    when: any;
    then: any;
  }
) {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert("reactions", {
      name: reactionData.name,
      desc: reactionData.desc,
      given: reactionData.given,
      when: reactionData.when,
      then: reactionData.then,
    });

    // Patch with the ID as a self-reference
    await ctx.db.patch(id, { id });

    return id;
  });
}

/**
 * Creates a simple test number entry
 * Based on the existing example in myFunctions.test.ts
 * 
 * @param t - The test context from convexTest(schema)
 * @param value - The number value to insert
 * @returns The created number ID
 */
export async function setupTestNumber(t: TestContext, value: number) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("numbers", { value });
  });
}

/**
 * Bulk setup helper that creates multiple test numbers
 * 
 * @param t - The test context from convexTest(schema)
 * @param values - Array of number values to insert
 * @returns Array of created number IDs
 */
export async function setupTestNumbers(t: TestContext, values: number[]) {
  return await t.run(async (ctx) => {
    const ids = [];
    for (const value of values) {
      const id = await ctx.db.insert("numbers", { value });
      ids.push(id);
    }
    return ids;
  });
}

/**
 * Helper to query all EAVT entries for a specific entity ID
 * 
 * @param t - The test context from convexTest(schema)
 * @param entityId - The entity ID to query
 * @returns Array of EAVT entries
 */
export async function getEntityEAVTs(t: TestContext, entityId: number) {
  return await t.run(async (ctx) => {
    return await ctx.db
      .query("eavts")
      .filter((q) => q.eq(q.field("id"), entityId))
      .collect();
  });
}

/**
 * Helper to query all EAVT entries for a specific attribute
 * 
 * @param t - The test context from convexTest(schema)
 * @param attrName - The attribute name to query
 * @returns Array of EAVT entries
 */
export async function getAttributeEAVTs(t: TestContext, attrName: string) {
  return await t.run(async (ctx) => {
    return await ctx.db
      .query("eavts")
      .filter((q) => q.eq(q.field("attr"), attrName))
      .collect();
  });
}

/**
 * Cleans up test data by removing all entries from a table
 * Useful for test isolation
 * 
 * @param t - The test context from convexTest(schema)
 * @param tableName - The table name to clear
 */
export async function clearTable(t: TestContext, tableName: string) {
  return await t.run(async (ctx) => {
    const entries = await ctx.db.query(tableName as any).collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id as any);
    }
  });
}

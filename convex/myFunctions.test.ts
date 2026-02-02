import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("addNumber and listNumbers", async () => {
  const t = convexTest(schema);

  // Add some numbers to the database
  await t.mutation(api.myFunctions.addNumber, { value: 42 });
  await t.mutation(api.myFunctions.addNumber, { value: 100 });
  await t.mutation(api.myFunctions.addNumber, { value: -5 });

  // Query the numbers back
  const result = await t.query(api.myFunctions.listNumbers, { count: 10 });

  // Assert the result matches what we expect
  expect(result).toEqual({
    viewer: "Anonymous",
    numbers: [42, 100, -5],
  });
});

test("listNumbers returns empty array initially", async () => {
  const t = convexTest(schema);

  const result = await t.query(api.myFunctions.listNumbers, { count: 10 });

  expect(result).toEqual({
    viewer: "Anonymous",
    numbers: [],
  });
});

test("listNumbers respects count argument", async () => {
  const t = convexTest(schema);

  // Add 5 numbers
  for (let i = 1; i <= 5; i++) {
    await t.mutation(api.myFunctions.addNumber, { value: i });
  }

  // Request only 3
  // The query orders by _creationTime desc, then reverses
  // So we get the last 3 values: [3, 4, 5]
  const result = await t.query(api.myFunctions.listNumbers, { count: 3 });

  expect(result.numbers).toHaveLength(3);
  expect(result.numbers).toEqual([3, 4, 5]);
});

test("direct database access with t.run", async () => {
  const t = convexTest(schema);

  // Directly insert into the database
  const id = await t.run(async (ctx) => {
    return await ctx.db.insert("numbers", { value: 999 });
  });

  // Query it back
  const doc = await t.run(async (ctx) => {
    return await ctx.db.get(id);
  });

  expect(doc).toMatchObject({
    value: 999,
  });
});

test("querying all numbers from database", async () => {
  const t = convexTest(schema);

  // Add numbers via mutation
  await t.mutation(api.myFunctions.addNumber, { value: 10 });
  await t.mutation(api.myFunctions.addNumber, { value: 20 });

  // Query directly from database
  const allNumbers = await t.run(async (ctx) => {
    return await ctx.db.query("numbers").collect();
  });

  expect(allNumbers).toHaveLength(2);
  expect(allNumbers[0]).toMatchObject({ value: 10 });
  expect(allNumbers[1]).toMatchObject({ value: 20 });
});

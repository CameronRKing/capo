import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  eavts: defineTable({
    id: v.number(),
    attr: v.string(),
    value: v.any(),
    tx: v.number(),
    w: v.number()
  }),
  txs: defineTable({
    ms: v.number(),
    evt: v.optional(v.string()),
    usr: v.optional(v.string())
  }),
  attrs: defineTable({
    id: v.id('attrs'),
    name: v.string(),
    type: v.string(),
    default: v.string(),

  }),
  schemas: defineTable({
    name: v.string(),
    version: v.string(),
    attrs: v.array(v.id('attrs')),
    actions: v.array(v.id('actions')),
    layouts: v.array(v.object({ name: v.string(), layout: v.id('layouts') }))
  }),
  actions: defineTable({
    id: v.id('actions'),
    name: v.string(),
    fn: v.string(),
    args: v.any(),
  }),
  reactions: defineTable({
    id: v.id('reactions'),
    name: v.string(),
    desc: v.string(),
    given: v.any(),
    when: v.any(),
    then: v.any()
  }),
  migrations: defineTable({

  }),
  layouts: defineTable({
    id: v.id('layouts'),
    props: v.array(v.object({ name: v.string(), def: v.id('attrs') })),
    state: v.array(v.object({ name: v.string(), def: v.id('attrs') })),
    derived: v.array(v.object({ name: v.string(), fn: v.id('actions') })),
    ctx: v.array(v.object({ name: v.string(), def: v.id('attrs') })),
    hooks: v.array(v.object({ name: v.string(), def: v.id('actions') })),
    render: v.id('layoutEl')
  }),
  layoutEl: defineTable({
    id: v.id('layoutEl'),
    tag: v.string(),
    logic: v.array(v.object({ op: v.string(), payload: v.any() })),
    attrs: v.array(v.object({ key: v.string(), val: v.any() })),
    children: v.array(v.id('layoutEl'))
  }),
});

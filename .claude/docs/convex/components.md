# Convex Components Documentation Index

This document indexes documentation for the Convex components installed in this project.

---

## @convex-dev/presence (v0.3.0)

**Purpose**: Real-time user presence management for "rooms" with live-updating online status.

**Installation**: `npm install @convex-dev/presence`

### Quick Setup

1. **Add to convex.config.ts**:
```ts
import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";

const app = defineApp();
app.use(presence);
export default app;
```

2. **Create convex/presence.ts**:
```ts
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
```

3. **Use in React**:
```tsx
import { api } from "../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import FacePile from "@convex-dev/presence/facepile";

export default function App(): React.ReactElement {
  const [name] = useState(() => "User " + Math.floor(Math.random() * 10000));
  const presenceState = usePresence(api.presence, "my-chat-room", name);

  return (
    <main>
      <FacePile presenceState={presenceState ?? []} />
    </main>
  );
}
```

**React Native**: Use `@convex-dev/presence/react-native` instead and install `react-native` and `expo-crypto`.

### Key Features
- Efficient presence via scheduled functions (no polling)
- Clients only receive updates when users join/leave
- Includes `FacePile` UI component or build your own with `usePresence` hook

### Resources
- [Official Component Page](https://www.convex.dev/components/presence)
- [Implementation Guide](https://stack.convex.dev/presence-with-convex)
- [GitHub Repository](https://github.com/get-convex/convex-presence)

---

## @convex-dev/stripe (v0.1.1)

**Purpose**: Integrate Stripe payments, subscriptions, and billing into Convex applications.

**Installation**: `npm install @convex-dev/stripe`

### Quick Setup

1. **Add to convex.config.ts**:
```ts
import { defineApp } from "convex/server";
import stripe from "@convex-dev/stripe/convex.config.js";

const app = defineApp();
app.use(stripe);
export default app;
```

2. **Set Environment Variables** (in Convex Dashboard → Settings):
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (`sk_test_...` or `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (`whsec_...`)

3. **Configure Stripe Webhooks**:
   - URL: `https://<deployment>.convex.site/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.*`, `customer.subscription.*`, `invoice.*`, `payment_intent.*`

4. **Create convex/http.ts**:
```ts
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();
registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
});
export default http;
```

5. **Create convex/stripe.ts**:
```ts
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";

const stripeClient = new StripeSubscriptions(components.stripe, {});

export const createSubscriptionCheckout = action({
  args: { priceId: v.string() },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    return await stripeClient.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: "http://localhost:5173/?success=true",
      cancelUrl: "http://localhost:5173/?canceled=true",
      subscriptionMetadata: { userId: identity.subject },
    });
  },
});
```

### Key Features
- Checkout sessions (one-time & subscription)
- Customer & subscription management
- Customer portal integration
- Seat-based pricing (subscription quantities)
- User/org linking
- Automatic webhook handling
- Real-time payment/subscription/invoice queries

### Database Tables Created
- `customers` - Stripe customer data
- `subscriptions` - Active/past subscriptions
- `checkout_sessions` - Checkout session records
- `payments` - Payment intents
- `invoices` - Invoice records

### Public Query Examples
```ts
// List subscriptions for a user
await ctx.runQuery(components.stripe.public.listSubscriptionsByUserId, { userId });

// List payments
await ctx.runQuery(components.stripe.public.listPaymentsByUserId, { userId });
```

### Resources
- [Official Component Page](https://www.convex.dev/components/stripe)
- [Stripe Starter Template](https://www.convex.dev/templates/stripe)
- [GitHub Repository](https://github.com/get-convex/stripe)
- [Integration Tutorial](https://stack.convex.dev/stripe-with-convex)

---

## @convex-dev/prosemirror-sync (v0.2.0)

**Purpose**: Collaborative document editing sync for ProseMirror/Tiptap/BlockNote editors.

**Installation**: `npm install @convex-dev/prosemirror-sync`

### Quick Setup

1. **Add to convex.config.ts**:
```ts
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";

const app = defineApp();
app.use(prosemirrorSync);
export default app;
```

2. **Create convex/example.ts**:
```ts
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);
export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({});
```

3. **Use with BlockNote**:
```tsx
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { BlockNoteView } from "@blocknote/mantine";
import { api } from "../convex/_generated/api";
import { BlockNoteEditor } from "@blocknote/core";

export function MyComponent() {
  const sync = useBlockNoteSync<BlockNoteEditor>(api.example, "some-id");
  return sync.isLoading ? (
    <p>Loading...</p>
  ) : sync.editor ? (
    <BlockNoteView editor={sync.editor} />
  ) : (
    <button onClick={() => sync.create({ type: "doc", content: [] })}>
      Create document
    </button>
  );
}
```

4. **Use with Tiptap**:
```tsx
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorContent, EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function MyComponent() {
  const sync = useTiptapSync(api.example, "some-id");
  return sync.isLoading ? (
    <p>Loading...</p>
  ) : sync.initialContent !== null ? (
    <EditorProvider
      content={sync.initialContent}
      extensions={[StarterKit, sync.extension]}
    >
      <EditorContent editor={null} />
    </EditorProvider>
  ) : (
    <button onClick={() => sync.create({ type: "doc", content: [] })}>
      Create document
    </button>
  );
}
```

### Key Features
- Operational transformation (OT) for safe merges
- React hooks for Tiptap and BlockNote
- Server-side entrypoints for auth/reads/writes
- Debounced snapshots for faster client loads
- Deletion API for old snapshots
- Server-side document transformation (AI interoperation)

### Notes
- BlockNote requires removing React `<StrictMode>` in React 19
- Snapshot debounce: 1 second default (configurable via `snapshotDebounceMs`)
- Document creation: `sync.create(content)` or `prosemirrorSync.create(ctx, id, content)`
- Content format: `{ type: "doc", content: [] }` (ProseMirror JSON)

### Server-side Transform Example
```ts
import { getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

export const transformExample = action({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const schema = getSchema(extensions);
    await prosemirrorSync.transform(ctx, id, schema, (doc) => {
      const tr = EditorState.create({ doc }).tr;
      tr.insertText("Hello, world!", 0);
      return tr;
    });
  },
});
```

### Resources
- [Official Component Page](https://www.convex.dev/components/prosemirror-sync)
- [GitHub Repository](https://github.com/get-convex/prosemirror-sync)
- [Stack Post: Add Collaborative Editor](https://stack.convex.dev/add-a-collaborative-document-editor-to-your-app)

---

## convex-helpers (v0.1.109)

**Purpose**: Collection of utilities and helpers to complement official Convex packages.

**Installation**: `npm install convex-helpers`

### Key Helpers

#### Custom Functions
Build customized versions of `query`, `mutation`, `action` with custom behavior:
```ts
import { customQuery } from "convex-helpers/server/customFunctions";

const myQueryBuilder = customQuery(query, {
  args: { apiToken: v.id("api_tokens") },
  input: async (ctx, args) => {
    const apiUser = await getApiUser(args.apiToken);
    return { ctx: { ...ctx, apiUser }, args: {} };
  },
});
```

#### Relationship Helpers
Traverse database relationships without boilerplate:
```ts
import { getOneFromOrThrow, getManyFrom, getManyViaOrThrow } from "convex-helpers/server/relationships";

const author = await getOneFromOrThrow(db, "authors", "userId", user._id);
const posts = await getManyFrom(db, "posts", "authorId", author._id);
const categories = await getManyViaOrThrow(db, "postCategories", "categoryId", "postId", post._id);
```

#### Richer useQuery
Enhanced query hook with status tracking:
```ts
import { makeUseQueryWithStatus } from "convex-helpers/react";

const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
const { status, data, error, isSuccess, isPending, isError } = useQueryWithStatus(api.foo.bar, { myArg: 123 });
```

#### Row-Level Security
Add per-document access checks:
```ts
import { wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";

const db = wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx), { defaultPolicy: "deny" });
```

#### Filter Helper
Apply TypeScript/JavaScript filters to queries:
```ts
import { filter } from "convex-helpers/server/filter";

return await filter(ctx.db.query("counter_table"), (c) => c.counter % 2 === 0).collect();
```

#### Query Streams
Merge and compose multiple queries (UNION ALL, WHERE, JOIN):
```ts
import { stream, mergedStream } from "convex-helpers/server/stream";

const authorStreams = authors.map(author =>
  stream(ctx.db, schema).query("messages").withIndex("by_author", (q) => q.eq("author", author))
);
const allMessages = mergedStream(authorStreams, ["_creationTime"]);
return await allMessages.paginate(opts);
```

#### Manual Pagination
Alternative to `.paginate()` with familiar syntax:
```ts
import { paginator } from "convex-helpers/server/pagination";

return await paginator(ctx.db, schema).query("messages").paginate(opts);
```

#### Validator Utilities
Enhanced validators for schema and arguments:
```ts
import { literals, nullable, brandedString, typedV, doc } from "convex-helpers/validators";

export const emailValidator = brandedString("email");
const vv = typedV(schema);
// Use vv.id("table"), vv.doc("table"), etc.
```

#### Zod Validation
Use Zod for argument validation:
```ts
import { zCustomQuery } from "convex-helpers/server/zod4";
import * as z from "zod";

const zodQuery = zCustomQuery(query, NoOp);
export const myQuery = zodQuery({
  args: { email: z.string().email(), age: z.number().min(0) },
  handler: async (ctx, args) => { /* ... */ },
});
```

#### CRUD Utilities
Generate basic CRUD functions:
```ts
import { crud } from "convex-helpers/server/crud";
export const { create, read, update, destroy } = crud(schema, "users");
```

#### Triggers
Run functions on data changes:
```ts
import { Triggers } from "convex-helpers/server/triggers";

const triggers = new Triggers<DataModel>();
triggers.register("users", async (ctx, change) => {
  if (change.newDoc) {
    await ctx.db.patch(change.id, { fullName: `${change.newDoc.firstName} ${change.newDoc.lastName}` });
  }
});
```

#### Hono Integration
Use Hono for HTTP endpoints:
```ts
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";

const app: HonoWithConvex<ActionCtx> = new Hono();
app.get("/", async (c) => c.json("Hello world!"));
export default new HttpRouterWithHono(app);
```

#### Query Caching
Persist subscriptions for faster reloads:
```tsx
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { useQuery } from "convex-helpers/react/cache";

// Wrap app with ConvexQueryCacheProvider inside ConvexProvider
const data = useQuery(api.todos.getAll);
```

#### CORS Support
Add CORS to HTTP routes:
```ts
import { corsRouter } from "convex-helpers/server/cors";

const cors = corsRouter(http, {
  allowedOrigins: ["http://localhost:8080"],
  allowedMethods: ["GET", "POST"],
});
cors.route({ path: "/foo", method: "GET", handler: httpAction(async () => new Response("ok")) });
```

### Other Helpers
- **Action retries**: `makeActionRetrier` (consider `@convex-dev/action-retrier` instead)
- **Stateful migrations**: `migration` (consider `@convex-dev/migrations` instead)
- **Rate limiting**: `rateLimit` (consider `@convex-dev/rate-limiter` instead)
- **Session tracking**: Track anonymous users via session IDs

### Resources
- [GitHub Repository](https://github.com/get-convex/convex-helpers)
- [Official README](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md)
- [Relationship Helpers Guide](https://stack.convex.dev/functional-relationships-helpers)
- [10 Convex Helpers Video](https://www.youtube.com/watch?v=lSw2Z_ra3XE)

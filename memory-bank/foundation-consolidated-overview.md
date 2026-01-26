# Level 1: Foundation - Consolidated Overview

**Last Updated:** 2026-01-26
**Status:** DRAFT v11 - Dependency Fixed (Model Security → Component Derivation), Cleanup Applied

## Purpose

From a declarative model definition, automatically derive all CRUD UI components with security, validation, and presence. A developer defines a schema → gets a fully functional, collaborative web application layer.

**Web-First:** This framework is designed for web applications (running on desktop, mobile, or browser). Real-time collaboration, presence tracking, and UI view synchronization assume a web interface. Non-web interfaces (CLI, API-only) would not use these capabilities.

## Core Thesis

**Terseness:** Define a model once → get everything (storage, validation, UI, security, presence, reactions, undo/redo).

**Simplicity:** The mental model is "schema → components" with no hidden magic. Focus on domains with structured data and CRUD operations (e.g., project management, inventory, CRM).

**Efficiency:** Framework handles complex logic so developers can express complex concepts concisely.

**Legibility:** Code expressed in terms of the domain model is readable and intent-clear.

**Auth-Agnostic:** Authentication is an implementation detail chosen by the consumer. Identity context is provided as a parameter.

---

## Capability Map

| # | Capability | Input | Output | Dependencies |
|---|------------|-------|--------|--------------|
| 1 | Schema Declaration | Type definitions | Introspectable schema | None |
| 2 | Domain Graph | Registration calls | Discoverable models, relationship graph | Schema Declaration |
| 3 | Persistence Layer | Schema + data | Storage, retrieval | Schema Declaration |
| 4 | Working Documents | Relaxed data | Draft persistence | Schema Declaration, Persistence Layer |
| 5 | Schema Migration | Schema changes | Versioned evolution | Schema Declaration, Persistence Layer |
| 6 | Validation Engine | Schema + data | Valid/invalid + errors | Schema Declaration |
| 7 | User Context | Auth provider | User identity, roles, groups | None (external) |
| 8 | Model Security | Policy functions | Allow/deny decisions | Domain Graph, User Context |
| 9 | CRUD Generation | Model + security | Create, read, update, delete | Model Security |
| 10 | Event Reactions | Data changes | Reactions, triggers, workflows | Schema Declaration, CRUD Generation |
| 11 | Undo/Redo | Mutations | Mutation history, time travel | Schema Declaration, Persistence Layer |
| 12 | Presence Tracking | User focus events | Presence indicators, rooms | Domain Graph, Model Security |
| 13 | Component Derivation | Introspected schema | Inputs, presenters, forms, cards, tables | Model Security, Presence Tracking |

---

## Cross-Cutting Concepts

### Out of Scope (Deferred)

The following capabilities are **explicitly out of scope** for Foundation Level 1:

- **Query Building** — Query construction API is implementation-specific to the CRUD surface (GraphQL, REST, etc.). The framework provides eager-loading configuration in CRUD Generation, but query builders are provided by the CRUD implementation.

- **Real-Time Subscriptions** — Subscription lifecycle management is taken for granted. The implementation target will include a sync engine that handles collaboration + client/server state management.

- **Error Handling Framework** — Coordinated error handling across capabilities is deferred to higher levels. Each capability defines its own error behavior.

- **Client State Management** — Local vs server state synchronization is handled by the sync engine provided by the implementation target.

- **User Preferences** — User-specific configuration (theme, dashboard, notifications) is a convention that framework consumers can easily build on top.

### Schema Reuse (Deferred)

How to reuse schema fragments across models? **Deferred to implementation.**

Until we have lived experiences that inform us as to the real composition boundaries of reusable pieces of the domain, we leave it entirely up to the framework consumer to organize their schema code. Later, we can build in conveniences based on actual usage patterns.

### Terminology Conventions

- **Model** and **Instance** are interchangeable (both refer to data/entity)
- **Model** and **Schema** are NOT interchangeable (schema = definition, model = data/instance)
- **Relationship** = schema-level connection between models
- **Reference** = instance-level pointer from one entity to another

### Room Concept

**Definition:** A room is an **access-controlled bus for real-time collaboration information** — presence events, focus updates, UI view synchronization, and mutation broadcasts. Rooms are secured by Model Security policies. The data that flows through a room depends on the access permissions that its members have.

**Initial Approach:** Rooms can be explicitly configured OR implicitly organized by user groups. Each user group that a user has a role in has its own "room" that the user can "enter" as its own "workspace." Any given UI tree tab can be in only one room at a time.

**Privacy:** Users control room membership — they can simply not join a room to keep their activity private. Detailed room lifecycle and additional organization patterns will be explored as we implement concrete Presence systems.

---

## Capability 1: Schema Declaration

### What It Is
Declarative definition of entity shapes — types, constraints, and introspection.

### What It Provides
- Type system (primitives: string, number, boolean, datetime, etc.)
- Constraints (required, optional, min/max, patterns)
- Refinements (arbitrary validation functions: `.min()`, `.max()`, `.refine(data => data % 2 == 0)`)
- Schema introspection (machine-readable representation for component generation)
- Schema evolution support (add/remove/modify fields)

**Refinement Definition:** Refinements are arbitrary validation functions that run over data to determine if it's valid. They can be simple (`.min()`, `.max()`) or complex (`.refine(data => data % 2 == 0)`, business rules, cross-field validation). Refinements are raw code functions — the framework provides helpers for database access and network calls to enforce safety, but does not constrain what refinements can do. The requirements taxonomy (sync vs async, storage-aware vs pure) is emergent and will be shaped by implementation experience.

**Note:** Relationships are wired separately in Domain Graph. This represents an evolution from implementation-specific thinking (Zod via convex-helpers) to implementation-agnostic abstraction.

### Key Requirements
1. **Type Definition** — Declare property types with constraints
2. **Refinement Support** — Arbitrary validation functions (simple or complex)
3. **Introspection** — Generate machine-readable schema for component mapping (types, constraints, property names, display names)
4. **Schema Evolution** — Add/remove/modify fields with migration paths

### Scenarios
- Define model with string, number, boolean properties
- Define model with custom refinements (email format, string length)
- Evolve schema (add field) and prepare for migration

---

## Capability 2: Domain Graph

### What It Is
The wiring specification for all models and relationships in the domain. You register models and wire them together.

**Analogy:** Think of it like HR — you register yourself as an employee, and couples register their relationship with HR. The domain graph is the registry of all entities and their connections.

### What It Provides
- Model registration API (declare model to framework)
- Relationship wiring API (wire relationships between models)
- Discovery API (list all models, find by name/type)
- Introspection API (get schema, metadata, relationships)
- Type-safe access (for generated code)
- Bidirectional relationship definitions (wire in one place)

### Key Requirements
1. **Model Registration** — Register schema with framework
2. **Relationship Wiring** — Wire relationships between models (one-to-one, one-to-many, many-to-many)
3. **Bidirectional Support** — Declare relationships once (e.g., User.hasMany(Posts)) and framework automatically generates the reverse relationship (Post.belongsTo(User)) in type system and queries
4. **Cascade Configuration** — Event hooks for cascading behavior (e.g., `deleting`)
5. **Model Discovery** — List and query available models
6. **Schema Introspection** — Retrieve schema for component generation
7. **Relationship Introspection** — Query relationship graph
8. **Type Generation** — Generate types for registered models and relationships

### Scenarios
- Register a model schema with the framework
- Wire one-to-many relationship: User has many Posts
- Configure cascade delete: when User is deleted, delete their Posts
- List all available models in the application
- Retrieve schema for a specific model
- Query models by relationship dependency

### Design Decisions
- **Type safety improvement:** By centralizing model registration, the relationship wirer knows what models are available (unlike ad-hoc schema systems where type systems can't know what models can be referenced)
- **Relationships as wiring:** Relationships are wired like electrical connections — they tell the framework how two models are connected

---

## Capability 3: Persistence Layer

### What It Is
Storage and retrieval of model data. Separates storage mechanism from access patterns.

**Design Decision:** How data is **accessed** (API shape: GraphQL, REST, etc.) may be defined quite differently from how data is **stored** (storage substrate: SQL, EAVT, etc.). The Persistence Layer is about **storage**, not **access**.

### What It Provides
- Automatic storage instantiation from schema
- Primitive storage operations (low-level create, read, update, delete)
- Explicit transaction support (consumer-defined boundaries)
- Query optimization (indexes based on schema structure)

### Key Requirements
1. **Storage Instantiation** — Create storage from schema (platform-specific: tables, collections, indices, etc.)
2. **Primitive Operations** — Low-level storage operations (internal-only, never called directly by application code)
3. **Explicit Transactions** — Consumer-defined transaction boundaries with rollback
4. **Query Optimization** — Indexes based on schema structure

### Scenarios
- Create storage from schema definition (e.g., SQL table, EAVT indices)
- Insert, update, delete model instances
- Execute explicit transaction with multiple operations (consumer-defined)

---

## Capability 4: Working Documents

### What It Is
Separate persistence space with relaxed validation constraints for safe collaboration on incomplete data.

**Design Decision:** Working documents are a separate concern from core persistence because they require different validation semantics, promotion logic, and potentially a different storage substrate (more volatile data). An implementation might choose a specialized storage mechanism for working documents.

### What It Provides
- Separate storage space (isolated from "real" documents)
- Relaxed constraint enforcement (see definition below)
- Promotion to "real" documents on validation
- Diff tracking (working vs. live version)

### Key Requirements
1. **Separate Storage** — Working documents stored in separate space (possibly different storage substrate)
2. **Relaxed Constraints** — Refinements and required fields are NOT enforced (types are still enforced)
3. **Promotion** — Validate and promote working document to "real" status
4. **Diff Tracking** — Track differences between working and live versions
5. **Collision Resolution** — Handle simultaneous edits (implementation detail of collaboration substrate)
6. **Validation Reporting** — Validation still occurs and is reported for progress tracking (doesn't gate persistence)

### Scenarios
- Create working document (refinements and required fields not enforced)
- Collaborate on working document with others
- Submit working document for validation
- Promote valid working document to real document
- View diff between working and live versions
- Working document violates validation → validation errors reported but doesn't block persistence

### Design Decisions
- **Relaxed constraints definition:** Working documents enforce type safety and basic structure, but skip business logic validation (refinements) and database constraints (required fields, uniqueness, referential integrity) until promotion
- **Separate concern:** Working documents are a distinct concept from core persistence, requiring different validation, promotion, and potentially different storage

---

## Capability 5: Schema Migration

### What It Is
Versioned evolution of schema and data across storage, including working documents.

**Design Decision:** Schema migration is a framework concern because we need to track schema evolution from the beginning. An implementation may provide migration tools, but the framework must define the migration contract and leave freedom to implement if not available.

### What It Provides
- Migration generation from schema changes
- Versioned migration history
- Forward and rollback support
- Data migration support
- Working document migration awareness

### Key Requirements
1. **Migration Generation** — Generate migrations from schema changes
2. **Versioned History** — Track all schema migrations
3. **Rollback Support** — Revert migrations if needed
4. **Data Migration** — Support transforming data during schema changes
5. **Working Document Awareness** — Migrate working documents alongside "real" documents
6. **Migration Permissiveness** — Working documents don't need to pass new schema until promotion. They should follow migration as best they can (add/drop columns, run data updaters) without throwing on failures, though failures should be recorded on the working doc

### Scenarios
- Add field to schema → generate migration to add storage field
- Remove field from schema → generate migration to drop storage field
- Run migrations in production (migrates both real and working documents)
- Working document has data violating new schema → migration follows best effort, failures recorded on working doc
- Rollback failed migration

---

## Capability 6: Validation Engine

### What It Is
Cross-boundary validation ensuring data integrity on client and server, with async support.

### What It Provides
- Client-side validation (immediate feedback)
- Server-side validation (all mutations, data integrity)
- Async validators (storage-aware: uniqueness, referential integrity)
- Clear error messages with context
- Framework handles complexity of crossing client/server boundaries securely

### Key Requirements
1. **Client-Side Validation** — Immediate feedback on input
2. **Server-Side Validation** — Enforce all constraints on mutations
3. **Async Validators** — Support storage-aware validation (uniqueness across all records, referential integrity)
4. **Validation Consistency** — Identical behavior client/server
5. **Error Reporting** — Clear, actionable error messages
6. **Boundary Abstraction** — Framework handles cross-boundary complexity securely

### Scenarios
- User types in form field → client validates immediately
- User submits mutation → server validates before persisting
- Async validator checks uniqueness across all records (email uniqueness)
- Async validator checks referential integrity (foreign key exists)
- Validation error → clear message indicating what failed and why

---

## Capability 7: User Context

### What It Is
Auth-agnostic abstraction for user identity: ID, roles, groups, and permissions.

**Design Decision:** User Context provides "knowledge of the user" that must be passed to security policies and operations. User preferences (theme, dashboard, notifications) are NOT included — they are a convention that framework consumers can easily build on top.

### What It Provides
- Identity context interface (user ID, roles, groups)
- Context parameter passing to security operations
- Auth provider integration points (consumer-configured)

### Key Requirements
1. **Identity Interface** — Define shape of user identity (ID, roles, groups)
2. **Context Parameter** — Pass user context to operations requiring security evaluation
3. **Auth Provider Integration** — Integration points for consumer's auth system (framework consumes auth, doesn't provide it)

### Scenarios
- Configure auth provider (Clerk, Auth0, enterprise SSO, etc.)
- Framework receives user context from auth provider
- Pass user context to query/mutation for policy evaluation
- Update user roles/groups via auth provider

---

## Capability 8: Model Security

### What It Is
Per-row and per-property access control policies that reactively enforce permissions, with reference censoring.

### What It Provides
- Policy definition (read, write per model/property/room)
- Reactive enforcement (data disappears immediately when access revoked)
- Property-level visibility (hides schema/components/IDs for unauthorized properties)
- Reference censoring (unauthorized row references return "403 FORBIDDEN" indicator)
- Room-level security (policies for presence rooms)
- Service account escape hatch

**Security Pipeline:** Schema → Security Filter → Introspection → Component Generation. Security filtering happens BEFORE component derivation so components are never generated for unauthorized properties.

### Key Requirements
1. **Policy Definition** — Declare read/write policies per model, property, and room
2. **Row-Level Enforcement** — Data disappears when row access revoked
3. **Property-Level Enforcement** — Client never sees schema/component/ID for unauthorized properties
4. **Reference Censoring** — Unauthorized row references return "403 FORBIDDEN" indicator (UI renders "Access Restricted" placeholder, reference unusable in queries/operations)
5. **Room Security** — Secure presence rooms using same mechanism as model security (reuse policy infrastructure, leverage existing testing utilities)
6. **Reactive Enforcement** — All enforcement happens reactively and immediately
7. **Policy Evaluation** — Efficient evaluation with caching
8. **Policy Testing** — Test policies with mock user contexts
9. **Service Account Escape Hatch** — Server-side credentials that bypass security with warnings

### Scenarios
- Define read policy: users can only read instances they own
- Define write policy: users can only edit instances they own
- Define property policy: users cannot see "salary" property (schema hidden, no component)
- User's access is revoked → data immediately disappears from UI
- Query references unauthorized instance → receives "403 FORBIDDEN" placeholder instead of ID
- Secure a presence room: only certain users can see/join
- Service account bypasses security for admin operations (with clear warnings)

---

## Capability 9: CRUD Generation

### What It Is
Auto-generated, secure CRUD operations that enforce security policies. The access layer that sits on top of storage.

**Design Decision:** CRUD Generation is separate from Model Security because:
1. Access API shape (SQL, GraphQL, REST, etc.) is separate from security policy shape
2. CRUD operations can be customized (logging, soft deletes) without rewriting security logic
3. Security implementations can be swapped without changing CRUD operations
4. CRUD Generation **enforces** access policies but how CRUD is configured has nothing to do with security itself

### What It Provides
- Generic CRUD (create, read, update, delete) with security
- Bulk operations (bulk create, bulk update, bulk delete)
- Custom query/mutation support with security
- Relationship eager-loading (based on query patterns and component usage)
- Automatic policy application
- Service account escape hatch

### Key Requirements
1. **Generic CRUD** — Auto-generate secure operations
2. **Security Integration** — All operations enforce policies
3. **Custom Operations** — Support custom queries/mutations with security
4. **Bulk Operations** — Efficient bulk operations
5. **Relationship Eager-Loading** — Automatically load related models based on query patterns and component usage (e.g., if a Table displays User.name, eager-load the User relationship)
6. **Service Account Support** — Bypass security for server-side operations (with warnings)

### Scenarios
- Use CRUD helper → get create, read, update, delete with security
- Create custom query → read policies applied automatically
- Create custom mutation → write policies applied automatically
- Bulk update 1000 rows → all policies enforced
- Table displays User.name → framework eager-loads User relationship
- Service account bypasses security for background job (with warning logged)

---

## Capability 10: Event Reactions

### What It Is
Change detection and reaction system. Keeps mutations clean/simple by exposing cross-concept dependencies explicitly.

**Design Decision:** Event reactions are essential for clean architecture. The projectbrief explicitly describes reactions as "keep[ing] mutations clean/simple by exposing cross-concept dependencies explicitly & keep[ing] mutations clean/simple." Without this, every mutation would need to know about side effects.

### What It Provides
- Change event detection (insert, update, delete events)
- Strict reactions (transactional, part of same mutation)
- Loose reactions (async, eventually consistent)
- Cross-concept dependency orchestration
- Integration with CRUD operations

### Key Requirements
1. **Change Detection** — Detect data changes (insert, update, delete)
2. **Strict Reactions** — Synchronous reactions that fail the mutation if they fail (transactional)
3. **Loose Reactions** — Asynchronous reactions that run after mutation succeeds (eventually consistent)
4. **Reaction Definition** — Define reactions per model (triggers, workflows, automations)
5. **Cross-Concept Orchestration** — Reactions can trigger other mutations, call external services, etc.
6. **Reaction Testing** — Test reactions with mock data

### Scenarios
- User creates document → trigger sends welcome email (loose reaction)
- User updates status → trigger moves document to different folder (strict reaction)
- User deletes document → trigger archives related documents (loose reaction)
- Reaction fails → strict reaction fails mutation, loose reaction logs error
- Test reaction with mock document

---

## Capability 11: Undo/Redo

### What It Is
Mutation history and time travel system for collaborative applications.

**Design Decision:** Undo/redo is foundational and essential for collaborative UX. The projectbrief discusses this extensively: user-specific undo (my last action, not everyone's), workspace-level undo (last action in this context), domain-level undo. This is reasonably complex but necessary.

### What It Provides
- User-specific undo stack (my last action)
- Workspace-level undo (last action in this context)
- Mutation history tracking
- Time travel (view and restore previous states)
- Integration with working documents
- Integration with event reactions

### Key Requirements
1. **Mutation History** — Track all mutations with user context
2. **User-Specific Undo** — Each user has their own undo stack
3. **Workspace-Level Undo** — Scoped to a context/workspace
4. **Redo Support** — Redo undone actions
5. **Time Travel** — View state at any point in history
6. **Working Document Integration** — Undo/redo for working document changes
7. **Event Reaction Integration** — Undo/redo for triggered reactions

### Scenarios
- User makes change → can undo their change (without affecting others)
- User undoes → can redo to restore
- View document state from 10 changes ago
- Working document change → undo/redo supported
- Reaction triggers → included in mutation history for undo/redo

---

## Capability 12: Presence Tracking

### What It Is
Domain-based user focus indication with room-based presence. Required by Component Derivation.

**Design Decision:** Presence Tracking is required for Component Derivation because components must track and display presence information. All derived components are collaborative by default. Non-collaborative applications can disable presence tracking at configuration time, but the component derivation layer assumes presence is available.

### What It Provides
- Room concept (who are the people around whose presence I see, and who can see me?)
- Focus representation (model, property, intent: hover/focus/edit)
- UI view tracking (URL, element path/id for "follow screen" collaborative viewing)
- Broadcast mechanism (user focus + view → other users in room)
- Presence indicators (user avatars, activity feed, cursor position)
- Cross-view collaboration (focus follows the data, view follows the UI)
- Room security (integrated with Model Security)

**Dual Representation:** Presence tracks BOTH domain focus (what data: model, property, intent) AND UI view (where in UI: URL, element path/id). This enables Figma-esque "follow screen" functionality—watching over a collaborator's shoulder by seeing exactly what they're looking at in their UI.

**Room Concept:** A room is an **access-controlled bus for real-time collaboration information** (presence events, focus updates, UI view synchronization, mutation broadcasts). Rooms can be explicitly configured OR implicitly organized by user groups. **Starting approach:** Each user group that a user has a role in has its own "room" that the user can "enter" as its own "workspace." Any given UI tree tab can be in only one room at a time. Rooms are secured by Model Security. The data that flows through a room depends on the access permissions that its members have.

**Privacy:** Users control room membership — they can simply not join a room to keep their activity private.

### Key Requirements
1. **Room Concept** — Define presence rooms (access-controlled collaboration buses)
2. **Domain Focus Representation** — Express focus as domain reference (model, property, intent: hover/focus/edit)
3. **UI View Representation** — Express view as UI reference (URL, element path/id for screen following)
4. **Broadcast Mechanism** — Broadcast focus + view events to other users in room
5. **Presence Indicators** — Display user avatars, activity feed, cursor position
6. **Cross-View Sync** — Focus visible across all views of same data
7. **Screen Following** — Enable "follow mode" where one user's UI view is mirrored by others
8. **Room Security** — Secure rooms using Model Security policies (reuse policy infrastructure)
9. **Component Integration** — All derived components track and display presence

### Scenarios
- Define presence room for a document (only authorized users can see/join)
- User focuses on property input → other users in room see focus indicator
- Multiple users in room view same model → avatars show all active users
- User hovers over property → other users in room see hover indicator
- User edits property → all clients in room see change
- User without room access cannot see presence or join
- Component automatically tracks and displays presence
- User A clicks "follow" on User B → User A's UI mirrors User B's view (URL, element focus, scroll position)

---

## Capability 13: Component Derivation

### What It Is
Dynamic generation of UI components from introspected schemas, with required presence tracking integration.

### What It Provides
- Property inputs (block, inline, cell variants)
- Property presenters (value-only, key/value pair)
- Model utilities (Card, Form with modes, Table)
- Component customization via overrides pattern
- Validation integration in all components
- Presence tracking integration (required)
- Performance targets

**Override Behavior:** If override returns null/undefined → framework falls back to default component. If override throws error → error boundary displays error message and default component as fallback.

### Key Requirements
1. **Property Inputs** — Generate block, inline, cell inputs for each property
2. **Property Presenters** — Generate value-only and key/value presenters
3. **Model Card** — Display all properties using presenters
4. **Model Form** — Generate form with Live, Working, Patch modes
5. **Model Table** — Generate table with sorting, filtering, inline editing
6. **Validation Integration** — All components display validation errors
7. **Presence Integration** — All components track and display presence
8. **Component Overrides** — Customize components via overrides pattern (defaults + per-model/property)
9. **Performance Targets** — Schema introspection, tables render efficiently

### Scenarios
- Render Card component → displays all properties with presenters
- Render Form in Live mode → every change triggers mutation
- Render Form in Working mode → refinements/required not enforced, submit to promote
- Render Form in Patch mode → local-first, submit on button
- Render Table → displays all instances with inline editing
- Table with 1000 rows → virtualization maintains performance
- Custom property type via overrides → custom component for specific property
- Override returns null → default component used
- Override throws error → error message shown, default component fallback

---

## Removed from Foundation (Moved to Other Levels)

| Item | Moved To | Reason |
|------|----------|--------|
| Command Palette | Level 2 (Block-Editor) | Higher-level concern: domain explorer component |
| Action Components | Level 2/3 (Command Palette/Extensibility) | Command invocation layer |
| Block Editor Integration | Level 2 (Block-Editor) | Document composition, not component derivation |
| Security Baseline (auth, TLS, rate limiting) | Platform | Infrastructure concern, not framework |
| Schema Reuse | Implementation | Framework consumer organizes schema code |

---

## Design Patterns from Prototype

### Component Overrides Pattern
```typescript
// componentDefaults.tsx - Default mappings
export default function lookupFactory(label, props, enumValues) {
  return {
    format: { currency: () => <CurrencyInput {...props} /> },
    type: { integer: () => <NumberInput {...props} /> },
    misc: { radio: () => <RadioInput {...props} /> }
  };
}

// componentOverrides.tsx - Per-model/property customizations
export default {
  HiringDecision: {
    perDiem: (allModelData, lookup) =>
      allModelData.travel === 'monthly_per_diem'
        ? lookup().format.currency()
        : null
  }
};

// Resolution logic
function mapSchemaToInput(...) {
  const overrideLookup = lookupFactory(label, props, enumValues);

  // Check overrides first
  const model = overrides[modelName];
  if (model && model[label]) {
    const result = model[label](allModelData, overrideLookup);
    if (result !== null && result !== undefined) return result;
  }

  // Fall back to defaults
  const lookup = overrideLookup();
  if (lookup.format[format]) return lookup.format[format]();
  if (lookup.type[type]) return lookup.type[type]();
}
```

This pattern enables:
- **Default mappings** for common types/formats
- **Per-model overrides** for specific properties
- **Context-aware customization** (access to all model data)
- **Extensibility** without modifying core framework
- **Null fallback** to defaults when override returns null

---

## Known Tensions

### Tension 1: Terseness vs Explicitness
**Framework promises:** "Define a model once → get everything" (terseness)
**Reality:** Advanced scenarios require explicit configuration (service accounts, custom transactions, overrides)
**Resolution:** This is **progressive disclosure** — terseness for happy path (simple CRUD apps), explicitness for edge cases (complex scenarios)

### Tension 2: Working Documents vs Schema Evolution
**Working documents:** Relax constraints (refinements & required not enforced)
**Schema evolution:** Changes constraints over time
**Collision:** What happens to working document when schema evolves?
**Resolution:** Working documents don't need to pass new schema until promotion. They follow migration as best they can (add/drop columns, run data updaters) without throwing on failures, though failures are recorded on the working doc.

### Tension 3: Domain-Based Focus vs Room-Based Presence
**Presence Tracking:** "Focus follows the data, not the UI" (domain-based, property-level)
**Rooms:** "Presence is always scoped to a room" (room-based, coarser)
**Question:** If I focus on a property, which room am I in? Document room? Property room?
**Resolution:** Deferred for detailed discussion after reviewing concrete Presence implementations. The exact relationship between domain focus granularity and room organization needs exploration.

### Tension 4: Security Filtering vs Component Derivation
**Model Security:** "Client never sees schema/component/ID for unauthorized properties"
**Component Derivation:** Generate components from introspected schemas
**Question:** When does security censoring happen in the component generation pipeline?
**Resolution:** Security filtering happens BEFORE component derivation: Schema → Security Filter → Introspection → Component Generation. Components are never generated for unauthorized properties.

---

## OpenSpec Structure Proposal

Based on this consolidation, I propose the following OpenSpec capabilities for Level 1:

| Current Spec | Proposed Change | Rationale |
|--------------|-----------------|-----------|
| `schema-definition` | Rename to `schema-declaration` | Implementation independence |
| `domain-expansion` | Rename to `component-derivation` | Focus on UI generation |
| `rbac-security` | Rename to `model-security` | Broader scope (row + property + rooms) |
| *(new)* | **Add: `domain-graph`** | Model registration + relationship wiring |
| *(new)* | **Add: `persistence-layer`** | Storage substrate, separate from access |
| *(new)* | **Add: `working-documents`** | Separate persistence with relaxed constraints |
| *(new)* | **Add: `schema-migration`** | Versioned evolution, framework concern |
| *(new)* | **Add: `validation-engine`** | Cross-boundary validation |
| *(new)* | **Add: `user-context`** | Identity + settings unified |
| *(new)* | **Add: `crud-generation`** | Access layer, separate from security |
| *(new)* | **Add: `event-reactions`** | Change detection and reactions |
| *(new)* | **Add: `undo-redo`** | Mutation history and time travel |
| *(new)* | **Add: `presence-tracking`** | Domain-based focus with rooms |

This gives us **13 tightly-focused capabilities**:
1. schema-declaration
2. domain-graph
3. persistence-layer
4. working-documents
5. schema-migration
6. validation-engine
7. user-context
8. model-security
9. crud-generation
10. event-reactions
11. undo-redo
12. presence-tracking
13. component-derivation

---

## Next Steps

1. **Review this document v11** — Confirm all feedback integrated
2. **Resolve Room Tension** — After reviewing concrete Presence implementations
3. **Begin OpenSpec conversion** — Write spec.md files one at a time for review

## Feedback Requested

- Are all subagent insights addressed?
- Is the CRUD vs Persistence distinction clear?
- Are the design decisions well-justified?
- Is the tension resolution section clear?

## Sources

- [Prisma: Managing schema changes in a team](https://www.prisma.io/docs/guides/implementing-schema-changes)
- [Prisma: Mental model for Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model)
- [Prisma: Expand and contract pattern](https://www.prisma.io/docs/guides/data-migration)
- [InstantDB: Modeling data](https://www.instantdb.com/docs/modeling-data)
- [EnterpriseDB: Column and Row level security in PostgreSQL](https://www.enterprisedb.com/postgres-tutorials/how-implement-column-and-row-level-security-postgresql)
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase: Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [StackOverflow: Combining RLS with column grants](https://stackoverflow.com/questions/49261452/combining-row-level-security-with-column-grants)
- [Datomic: Cloud Architecture](https://docs.datomic.com/operation/architecture.html)
- [Datomic: Information Model](https://www.infoq.com/articles/Datomic-Information-Model/)
- [Datomic: Database Filters](https://docs.datomic.com/reference/filters.html)
- [Datomic: Access Control](https://docs.datomic.com/operation/access-control.html)

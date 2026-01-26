# Framework Requirements Planning

**Last Updated:** 2026-01-26

## Status: Level 1 - Foundation Evaluation ✅ COMPLETE

## Evaluation Summary

### Completeness
**Missing:**
- Command Palette (explicitly mentioned as fallen away)
- Model Registration/Discovery
- Relationship Modeling (foreign keys, references)
- Identity Context (how "current user" is accessed)
- Transaction Semantics

**Extraneous (wrong level):**
- TipTap Integration → Level 2
- Action Components → Level 2/3
- Column-Level Security → Level 3/4
- Security Baseline → Platform concern

**Redundant:**
- Validation Integration (duplicate of schema-definition)

### Coherence
**Boundary issues:**
- domain-expansion includes TipTap (belongs in Level 2)
- rbac-security mixes framework + platform concerns
- Model relationships referenced but undefined

### Clarity
**Implementation-specific (needs abstraction):**
- "Zod Schema Definition" → "Schema Declaration"
- "Database Table Instantiation" → "Persistence Layer"
- "TipTap Integration" → "Block Editor Integration"

### Consolidated Foundation Capabilities
1. Schema Declaration (types, constraints, relationships)
2. Model Registry (discovery, introspection)
3. Persistence Layer (storage, evolution)
4. Validation Engine (cross-boundary)
5. Row-Level Security (policies, enforcement)
6. CRUD Generation (secure operations)
7. Component Derivation (inputs, presenters, forms, cards, tables)
8. Presence Tracking (domain-based focus)

## Framework Capability Levels (Ordered)

| Level | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | Foundation | 🔄 EVALUATION COMPLETE | Schema, persistence, validation, security, components |
| 2 | Block-Editor Integration | ⏳ TODO | Command palette, model lookup, embedding |
| 3 | Runtime Extensibility | ⏳ TODO | Fixed schema, configurable behavior |
| 4 | Cross-App Composition | ⏳ TODO | Apps as libraries, runtime composition |
| 5 | Full Runtime Malleability | ⏳ TODO | Meta-circular, schema as data |

## Design Principles (Core Values)

- **Terseness**: Concise definitions, minimal boilerplate
- **Simplicity**: Easy to understand, mental-model friendly
- **Efficiency**: Fast execution, minimal overhead
- **Legibility**: Readable code, clear intent

## Current Phase Details

### Level 1: Foundation

**Goal:** From a declarative model definition, derive all CRUD UI components with security, validation, and presence.

**Consolidated Capabilities:**
1. Schema Declaration (types, constraints, introspection)
2. Domain Graph (model registration + relationship wiring, "HR for models")
3. Persistence Layer (storage substrate, separate from access)
4. Working Documents (separate persistence, relaxed constraints)
5. Schema Migration (versioned evolution, framework concern)
6. Validation Engine (cross-boundary, async)
7. User Context (identity + settings unified, "knowledge of the user")
8. Model Security (row + property + room policies, reference censoring, security pipeline)
9. CRUD Generation (access layer, enforces security, separate from security)
10. Event Reactions (change detection, strict/loose, cross-concept orchestration)
11. Undo/Redo (mutation history, time travel, user-specific)
12. Presence Tracking (domain-based focus, rooms)
13. Component Derivation (inputs, presenters, forms, cards, tables, presence required)

**Working Documents:**
- ✅ `/memory-bank/foundation-consolidated-overview.md` v11 (13 capabilities, dependency fixed, cleanup applied, ready for OpenSpec conversion)

**OpenSpec Changes:**
- None yet (awaiting user direction)

**Pending Decisions:**
- Working Documents implementation: A) separate space, B) flag on document, C) fork/snapshot

## Key Decisions Made

- [x] 2026-01-26: Reordered levels - Cross-app composition before runtime malleability
- [x] 2026-01-26: Added command palette as bridge between foundation and notebook
- [x] 2026-01-26: Confirmed incremental approach - one doc at a time
- [x] 2026-01-26: Completed foundation evaluation - identified missing/extraneous items
- [x] 2026-01-26: Clarified Presence Tracking dual representation (domain focus + UI view for "follow screen")
- [x] 2026-01-26: Clarified web-first scope (URL, element, follow screen terminology is valid)
- [x] 2026-01-26: Defined "Room" concept (access-controlled bus for collaboration info)
- [x] 2026-01-26: Defined "Refinement" concept (arbitrary validation functions)
- [x] 2026-01-26: Documented out-of-scope items (query building, real-time subscriptions, error handling, client state)
- [x] 2026-01-26: Added eager-loading configuration to Domain Graph
- [x] 2026-01-26: Moved eager-loading from Domain Graph to CRUD Generation (where it belongs)
- [x] 2026-01-26: Removed user preferences from User Context (convention, not built-in)
- [x] 2026-01-26: Fixed room definition (removed "domain-scoped", rooms are access-controlled buses)
- [x] 2026-01-26: Clarified refinement safety (helpers for DB/network, but raw code)
- [x] 2026-01-26: Changed Persistence Layer from "CRUD" to "primitives" for clarity
- [x] 2026-01-26: Fixed Component Derivation dependency (added Model Security per security pipeline)
- [x] 2026-01-26: Cleaned up typos and version references (v11)

## Open Questions

- ✅ Schema Reuse: Deferred to implementation (RESOLVED)
- ✅ Working Documents: Separate capability with relaxed constraints (RESOLVED)
- ✅ Relationship Modeling: Part of Domain Graph as "wiring" (RESOLVED)
- ✅ User Context: Identity-only (preferences are convention, not built-in) (RESOLVED)
- ✅ Transaction Semantics: Explicit, consumer-defined (RESOLVED)
- ✅ RLS vs CLS: Unified as Model Security, implementation-agnostic (RESOLVED)
- ✅ CRUD Generation: Separate from Persistence (access vs storage) (RESOLVED)
- ✅ Event Reactions: Added as capability (RESOLVED)
- ✅ Undo/Redo: Added as capability (RESOLVED)
- ✅ Command Palette: Moved to Level 2 (RESOLVED)
- ✅ **Room Concept**: Initial approach defined (explicit config OR implicit by user groups), further refinement after concrete Presence implementations (INITIALLY RESOLVED)

## Next Steps

1. ✓ Create tracking file
2. ✓ Evaluate foundation requirements (completeness, coherence, clarity)
3. ✓ **RESOLVED**: All major questions (schema reuse, working docs, relationships, identity, transactions, security, CRUD, rooms)
4. ✓ **UPDATED**: Consolidated overview v11 (13 capabilities, all feedback integrated, subagent-approved)
5. ✓ **COMPLETED**: Subagent review - all agents approved for detailed specification phase
6. [ ] Begin OpenSpec conversion - Write spec.md files one-by-one for review (13 capabilities)
7. [ ] Resolve Room Tension (after concrete Presence implementations)

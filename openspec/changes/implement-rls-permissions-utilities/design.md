## Context

The business simulation platform requires role-based access control (RBAC) to ensure that students, teachers, and administrators can only access data appropriate to their role. This is a multi-tenant system where:

- **Admins** need platform-wide access for management
- **Teachers** need access to all companies within their assigned game(s)
- **Students** need access only to their assigned company

The platform uses `@convex-dev/auth` for authentication, which provides identity information through `ctx.auth.getUserIdentity()`. The users table (from schema.ts) stores role assignments and game/company associations.

Current state:
- Schema defines users table with role, gameId, and companyId fields
- Auth system configured but no permission utilities exist
- No RLS layer implemented yet

## Goals / Non-Goals

**Goals:**
- Provide type-safe permission checking utilities
- Integrate with existing Convex auth system
- Support game-level and company-level access control
- Enable efficient permission checks for RLS rules
- Handle authentication errors gracefully

**Non-Goals:**
- RLS rule enforcement (handled by rowLevelSecurity.ts)
- Business logic validation (e.g., deadline checks)
- UI permission helpers (React hooks to be built later)
- Permission caching (Convex handles this via subscriptions)

## Decisions

### Decision 1: Function-based utilities vs class-based approach
**Chosen**: Function-based utilities exported from a single module

**Rationale**:
- Simpler to test and mock
- Aligns with Convex's functional programming model
- Easier to tree-shake in production
- No instance state to manage

**Alternatives considered**:
- Class-based PermissionService: More object-oriented but requires instantiation, adds complexity

### Decision 2: Error handling strategy
**Chosen**: Throw descriptive errors for auth failures

**Rationale**:
- Fails fast - prevents unauthorized access at the source
- Clear error messages aid debugging
- Consistent with Convex best practices
- Errors can be caught and transformed at HTTP layer if needed

**Alternatives considered**:
- Return null/undefined: Would require null checks everywhere, less type-safe
- Return Result type: Adds complexity, not idiomatic in TypeScript/Convex

### Decision 3: Database lookup strategy
**Chosen**: Use indexed query on users.by_email for getCurrentUser

**Rationale**:
- Email is unique identifier from auth identity
- Index already exists in schema
- Efficient O(log n) lookup
- Consistent with how auth links to users table

**Code pattern**:
```typescript
const user = await ctx.db
  .query("users")
  .withIndex("by_email", q => q.eq("email", identity.email ?? ""))
  .first();
```

### Decision 4: Type definitions placement
**Chosen**: Export Role and User types from permissions.ts

**Rationale**:
- Types co-located with functions that use them
- Single import: `import { getCurrentUser, type User, type Role } from "./permissions"`
- Prevents circular dependencies
- Types can be re-exported from index.ts if needed

### Decision 5: canAccessCompany implementation
**Chosen**: Direct companyId comparison for students/teachers (requires caller to fetch company first)

**Rationale**:
- Simpler implementation - no async lookup in utility
- More flexible - caller can optimize with batch queries
- Clearer separation - permission check vs data fetching
- Teachers verify gameId when they fetch the company object

**Alternatives considered**:
- Async lookup in utility: Would require database call, less flexible, couples permission logic to data access

## Risks / Trade-offs

### Risk 1: Email changes break auth-linking
**Risk**: If user's email changes in auth provider but not in users table, getCurrentUser fails

**Mitigation**:
- Document that email changes require updating users table
- Consider adding user.subject lookup as alternative (future enhancement)
- Add error handling to guide admins to fix mismatched records

### Risk 2: Performance impact of repeated user lookups
**Risk**: getCurrentUser queries database on every function call

**Mitigation**:
- Indexed query is efficient (O(log n))
- RLS rules cache user object per function invocation
- Convex's architecture minimizes cold starts
- Can add memoization later if profiling shows need

### Risk 3: Role explosion
**Risk**: Adding new roles (e.g., "ta", "observer") requires updating all permission checks

**Mitigation**:
- Role type is a union - compiler will catch missing cases
- hasRole() accepts array for flexible checking
- Document role hierarchy clearly
- Consider role inheritance if roles proliferate (future enhancement)

## Migration Plan

No migration required - this is new functionality.

Deployment steps:
1. Deploy permissions.ts to Convex
2. Update existing functions to use new utilities (if any)
3. Monitor error logs for auth failures
4. Add to API documentation

Rollback strategy:
- Remove imports and delete file
- No data changes to revert

## Open Questions

None - the requirements are clear and dependencies are satisfied (@convex-dev/auth is configured).

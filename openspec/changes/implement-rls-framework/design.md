## Context

The business simulation platform requires database-level access control to enforce multi-tenant isolation. The platform has three user roles (admin, teacher, student) with hierarchical access patterns:

- **Admins**: Platform-wide access for management
- **Teachers**: Game-level access to all companies in their assigned game
- **Students**: Company-level access to only their assigned company

Current state:
- Schema defines 13 tables with hierarchical relationships
- Permission utilities (getCurrentUser, hasRole, etc.) completed in Task 2.1
- No RLS layer exists - all access control would be manual
- convex-helpers package installed and ready to use

## Goals / Non-Goals

**Goals:**
- Automatic RLS enforcement on all database operations
- Defense-in-depth with `defaultPolicy: "deny"`
- Type-safe custom function builders (queryWithRLS, mutationWithRLS)
- Comprehensive coverage of all 13 tables in schema
- Integration tests for each role's access patterns

**Non-Goals:**
- Business logic validation (e.g., deadline checks)
- UI permission helpers (React hooks)
- Permission caching (Convex handles subscriptions)
- Fine-grained field-level security (row-level only)

## Decisions

### Decision 1: Use convex-helpers RLS vs custom implementation
**Chosen**: convex-helpers built-in RLS utilities

**Rationale**:
- Battle-tested library with proven security model
- Type-safe rules integrated with DataModel
- Automatic enforcement via wrapped database clients
- Default-deny policy prevents accidental exposure
- No reinventing the wheel

**Alternatives considered**:
- Custom middleware: More control but higher risk of security bugs
- Application-level checks: Easy to forget, not defense-in-depth

### Decision 2: RLS rule granularity
**Chosen**: Table-level rules with per-document evaluation

**Rationale**:
- Matches convex-helpers RLS model
- Sufficient for current access patterns (game/company hierarchy)
- Rules are evaluated per-document, enabling fine-grained control
- Simpler than field-level rules

**Trade-offs**:
- Per-document overhead vs batch filtering
- Mitigation: Convex queries are already efficient, overhead acceptable

### Decision 3: Rule implementation approach
**Chosen**: Single rlsRules function with rules object for all tables

**Rationale**:
- Centralized access control logic
- Easy to audit and maintain
- Type-safe against DataModel
- Consistent with convex-helpers examples

**Code structure**:
```typescript
async function rlsRules(ctx: QueryCtx, user: User): Promise<Rules<QueryCtx, DataModel>> {
  return {
    games: { read, insert, modify },
    companies: { read, insert, modify },
    // ... all 13 tables
  };
}
```

### Decision 4: Cross-table lookups in RLS rules
**Chosen**: Allow async database lookups in RLS rules when needed

**Rationale**:
- Some access checks require traversing relationships (e.g., teacher checking if company is in their game)
- Rules can await ctx.db.get() to fetch related documents
- Performance impact minimal for single-document lookups

**Example**:
```typescript
read: async (ctx, decision) => {
  if (user.role === "teacher") {
    const company = await ctx.db.get(decision.companyId);
    return company?.gameId === user.gameId;
  }
}
```

**Trade-offs**:
- More complex rules vs performance
- Mitigation: Lookups are indexed and efficient

### Decision 5: Custom function builders
**Chosen**: Export queryWithRLS and mutationWithRLS from rowLevelSecurity.ts

**Rationale**:
- Provides drop-in replacements for standard query/mutation
- Wraps ctx.db with RLS enforcement automatically
- Includes user object in context for convenience
- Type-safe and ergonomic API

**Usage pattern**:
```typescript
export const getMyDecisions = queryWithRLS({
  args: { quarter: v.number() },
  handler: async (ctx, { quarter }) => {
    // ctx.db is wrapped - RLS filters automatically
    // ctx.user is available for business logic
    return await ctx.db.query("hiringDecisions")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", ctx.user.companyId).eq("quarter", quarter)
      )
      .collect();
  },
});
```

### Decision 6: Testing strategy
**Chosen**: Integration tests with realistic multi-tenant scenarios

**Rationale**:
- RLS rules are complex - need real database to verify
- Test each role's access patterns across tables
- Verify both positive (allow) and negative (deny) cases
- Use convex-test for isolated test environments

**Test coverage**:
- Admin: Can read/write everything
- Teacher: Can read/write game-scoped data
- Student: Can read/write company-scoped data
- Cross-role: Students cannot access other companies

## Risks / Trade-offs

### Risk 1: Performance impact of per-document RLS checks
**Risk**: RLS rules run for every document accessed, adding overhead

**Mitigation**:
- Convex's architecture minimizes per-document cost
- Rules are simple boolean checks, not complex queries
- Indexed lookups for cross-table references
- Can optimize hot paths if profiling shows need

### Risk 2: Complex rules become hard to maintain
**Risk**: 13 tables with 3 roles each = 39+ access rules to maintain

**Mitigation**:
- Centralized rules function is easy to audit
- TypeScript validates rule structure against DataModel
- Clear comments explain each rule's business logic
- Tests catch regressions when rules change

### Risk 3: Forgotten RLS wrapper exposes data
**Risk**: Developer uses standard query/mutation instead of queryWithRLS

**Mitigation**:
- Code review checklist to verify RLS usage
- Linter rule (future) to enforce queryWithRLS
- Document RLS pattern in developer guidelines
- Audit existing functions periodically

### Risk 4: Rule bugs cause data leaks
**Risk**: Incorrect RLS rule allows unauthorized access

**Mitigation**:
- Default-deny policy means bugs deny, not allow
- Comprehensive integration tests catch logic errors
- Security review of RLS rules before deployment
- Gradual rollout: test with staging data first

## Migration Plan

No data migration required - this is new infrastructure.

Deployment steps:
1. Deploy rowLevelSecurity.ts to Convex
2. Run integration tests in development
3. Gradually migrate existing functions to use RLS builders
4. Monitor error logs for RLS denials
5. Document RLS pattern for future functions

Rollback strategy:
- Functions can revert to standard query/mutation
- Delete rowLevelSecurity.ts file
- No data changes to revert

## Open Questions

None - the architecture document provides complete RLS specification (lines 512-765), and convex-helpers RLS is well-documented with examples.

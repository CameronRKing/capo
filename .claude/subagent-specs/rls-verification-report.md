# RLS Rules Verification Report for Hiring Decisions

## Summary
The RLS (Row-Level Security) rules for `hiringDecisions` table are **CORRECT** and match the requirements from the proposal.

## Requirements from Proposal
- Students can read/write their company's working decisions
- Students can read submitted decisions
- No write access to submitted decisions (handled at business logic layer)

## Implementation Status

### Read Access ✅
```typescript
read: async (ctx, decision) => {
  if (user.role === "admin") return true;
  // Teachers read decisions for all their game's companies
  if (user.role === "teacher") {
    const company = await ctx.db.get(decision.companyId);
    return company?.gameId === user.gameId;
  }
  // Students read only their company's decisions
  return user.companyId === decision.companyId;
}
```

**Verification:**
- ✅ Admins can read all decisions
- ✅ Teachers can read all decisions in their game
- ✅ Students can read their company's decisions (both working and submitted)

### Insert Access ✅
```typescript
insert: async (ctx, decision) => {
  // Students can create decisions for their company
  if (user.role === "student") return decision.companyId === user.companyId;
  // Admins and teachers can create decisions
  return user.role === "admin" || user.role === "teacher";
}
```

**Verification:**
- ✅ Students can create decisions for their company only
- ✅ Admins and teachers can create decisions

### Modify Access ✅
```typescript
modify: async (ctx, decision) => {
  // Students can modify their company's decisions
  if (user.role === "student" && decision.companyId === user.companyId) return true;
  // Teachers can read but not modify student decisions
  if (user.role === "teacher") return false;
  // Admins can modify all decisions
  return user.role === "admin";
}
```

**Verification:**
- ✅ Students can modify their company's decisions
- ✅ Teachers cannot modify student decisions (read-only access)
- ✅ Admins can modify all decisions

## Submitted Decision Protection

The business logic layer in `/data/projects/capo/convex/domain/decisions/persistence.ts` provides additional protection:

```typescript
// Don't allow modifying submitted decisions
if (existing && existing.isSubmitted) {
  throw new Error(
    "Cannot modify submitted decision. Create a new quarter or contact admin."
  );
}
```

**Verification:**
- ✅ Submitted decisions are immutable at the business logic layer
- ✅ Students cannot overwrite submitted decisions
- ✅ Submit action sets `isSubmitted: true` with audit trail

## Conclusion

All RLS rules are correctly implemented and provide defense-in-depth security:

1. **Database Layer (RLS)**: Enforces company-level access control
2. **Business Logic Layer**: Enforces immutability of submitted decisions
3. **API Layer**: Uses RLS-wrapped queries/mutations (`queryWithRLS`, `mutationWithRLS`)

No changes required to RLS rules.

**Status**: ✅ VERIFIED - Ready for production

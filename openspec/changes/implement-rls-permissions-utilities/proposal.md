## Why

The Row-Level Security (RLS) framework requires foundational permission utilities to support role-based access control across the business simulation platform. Without these utilities, we cannot implement the security layer that ensures students, teachers, and admins only access appropriate data. This is a critical dependency for Task 2.2 (RLS Framework) and must be implemented before RLS rules can be enforced.

## What Changes

- **New file**: `convex/services/permissions.ts` containing:
  - `getCurrentUser(ctx)` - Retrieves authenticated user from Convex context
  - `hasRole(user, roles)` - Checks if user has one of the specified roles
  - `canAccessGame(user, gameId)` - Validates game-level access permissions
  - `canAccessCompany(user, companyId)` - Validates company-level access permissions
  - TypeScript types: `Role`, `User` interface
- **Integration**: Works with `@convex-dev/auth` identity system and existing `users` table schema
- **No breaking changes** - This is new functionality, not modifying existing code

## Capabilities

### New Capabilities
- `rls-permissions`: Core permission checking utilities for role-based access control. Provides authentication context retrieval and authorization helpers for game/company-level access control.

### Modified Capabilities
- None - This is foundational infrastructure that enables future capabilities

## Impact

- **Dependencies**: Requires `@convex-dev/auth` to be configured (Task 2.1 dependency)
- **Used by**: `rowLevelSecurity.ts` (to be created in same task)
- **Testing**: Requires integration tests with mock Convex auth context
- **Type safety**: All utilities fully typed against existing DataModel

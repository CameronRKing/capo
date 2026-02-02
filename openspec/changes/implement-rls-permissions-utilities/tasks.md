## 1. Implementation

- [x] 1.1 Create convex/services/permissions.ts file
- [x] 1.2 Export Role type as union of "admin" | "teacher" | "student"
- [x] 1.3 Export User interface with all required fields
- [x] 1.4 Implement getCurrentUser(ctx) function with auth lookup
- [x] 1.5 Implement hasRole(user, roles) function
- [x] 1.6 Implement canAccessGame(user, gameId) function
- [x] 1.7 Implement canAccessCompany(user, companyId) function

## 2. Testing

- [x] 2.1 Create test file convex/services/permissions.test.ts
- [x] 2.2 Write test for getCurrentUser with valid identity
- [x] 2.3 Write test for getCurrentUser with no identity (throws error)
- [x] 2.4 Write test for getCurrentUser with missing user record (throws error)
- [x] 2.5 Write test for hasRole with matching role
- [x] 2.6 Write test for hasRole with non-matching role
- [x] 2.7 Write test for hasRole with multiple roles
- [x] 2.8 Write test for canAccessGame for admin (always true)
- [x] 2.9 Write test for canAccessGame for teacher with matching gameId
- [x] 2.10 Write test for canAccessGame for teacher with different gameId (false)
- [x] 2.11 Write test for canAccessGame for student with matching gameId
- [x] 2.12 Write test for canAccessGame for student with different gameId (false)
- [x] 2.13 Write test for canAccessCompany for admin (always true)
- [x] 2.14 Write test for canAccessCompany for student with matching companyId
- [x] 2.15 Write test for canAccessCompany for student with different companyId (false)

## 3. Verification

- [x] 3.1 Run all tests and verify they pass
- [x] 3.2 Check TypeScript compilation
- [x] 3.3 Verify exports are correct

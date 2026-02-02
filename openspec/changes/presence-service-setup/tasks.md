## 1. Core Presence Service Implementation

- [ ] 1.1 Create `convex/services/presence.ts` with @convex-dev/presence integration
- [ ] 1.2 Implement `heartbeat` mutation with roomId, userId, sessionId, interval args
- [ ] 1.3 Implement `list` query to return presence data for a room token
- [ ] 1.4 Implement `disconnect` mutation to cleanup sessions
- [ ] 1.5 Integrate with auth - extract user identity from ctx.auth.getUserIdentity()
- [ ] 1.6 Add proper error handling for unauthenticated users

## 2. Room Token Structure

- [ ] 2.1 Define room token format: `company:<companyId>` (stringified ID)
- [ ] 2.2 Add helper function to construct room tokens from company IDs
- [ ] 2.3 Add validation to ensure users only access their company's presence
- [ ] 2.4 Document room token format in code comments

## 3. Focus Tracking Service

- [ ] 3.1 Create `convex/services/presenceFocus.ts` for input focus tracking
- [ ] 3.2 Add `presenceFocus` table to schema with fields: fieldId, userId, timestamp
- [ ] 3.3 Implement `updateFocus` mutation to record user focus on field
- [ ] 3.4 Implement `getFocusByField` query to return users focused on specific field
- [ ] 3.5 Implement `getFocusByUser` query to return all fields user is focused on
- [ ] 3.6 Define field ID format: `<companyId>:<entity>:<fieldPath>` (e.g., "company123:hiring:salary")

## 4. Last Edited Metadata

- [ ] 4.1 Implement last edited tracking in presenceFocus service
- [ ] 4.2 Add `updateLastEdited` mutation to record field modifications
- [ ] 4.3 Implement `getLastEdited` query to retrieve metadata for field(s)
- [ ] 4.4 Decide on storage strategy (embedded in docs vs separate table)
- [ ] 4.5 Format timestamps for human-readable display (e.g., "Last edited by John at 2:30 PM")

## 5. Integration Testing

- [ ] 5.1 Create `convex/services/presence.test.ts` with convex-test setup
- [ ] 5.2 Test: User joins company room via heartbeat
- [ ] 5.3 Test: Multiple users in same company room
- [ ] 5.4 Test: Heartbeat refreshes presence timestamp
- [ ] 5.5 Test: Disconnect removes user from presence
- [ ] 5.6 Test: Presence timeout for inactive users (simulate 10s timeout)
- [ ] 5.7 Test: User cannot see other companies' presence (authorization)
- [ ] 5.8 Test: Focus tracking - single user focuses field
- [ ] 5.9 Test: Focus tracking - multiple users focus same field
- [ ] 5.10 Test: Focus updates overwrite previous focus for same user
- [ ] 5.11 Test: Last edited updates on field change
- [ ] 5.12 Test: Multiple simulated users with different auth contexts

## 6. Type Safety and Validation

- [ ] 6.1 Ensure all mutations use proper v.* validators from Convex
- [ ] 6.2 Add TypeScript types for presence data structures
- [ ] 6.3 Export types for frontend consumption
- [ ] 6.4 Run `npx convex dev` to generate types after schema changes
- [ ] 6.5 Verify no TypeScript errors in generated types

## 7. Documentation

- [ ] 7.1 Add JSDoc comments to all public functions
- [ ] 7.2 Document room token format and usage examples
- [ ] 7.3 Document field ID format for focus tracking
- [ ] 7.4 Add usage examples in code comments (how to call from frontend)

## 8. Verification and Cleanup

- [ ] 8.1 Run all tests: `npm test` to verify presence functionality
- [ ] 8.2 Test with real Convex dev deployment (not just convex-test)
- [ ] 8.3 Verify FacePile component can consume presence data format
- [ ] 8.4 Check for memory leaks or data accumulation issues
- [ ] 8.5 Verify cleanup: disconnect mutation properly removes sessions
- [ ] 8.6 Review code for consistency with project architecture
- [ ] 8.7 Ensure no hardcoded values (use constants for timeouts, formats)

## Context

**Current State**: @convex-dev/presence (v0.3.0) is already installed and registered in `convex.config.ts`. The project has authentication configured via @convex-dev/auth with user identity accessible through `ctx.auth.getUserIdentity()`. The schema defines companies and users with established relationships.

**Constraints**:
- Must integrate with existing auth system (user identities from ctx.auth)
- Room structure must align with company-based access control
- Frontend will use React with TanStack Router and Convex React hooks
- Need to support both MVP presence features (online/offline) and future cursor tracking

**Stakeholders**:
- Students: Need to see teammates' online status and what they're editing
- Teachers: Monitor student activity in real-time (future requirement)
- Frontend developers: Will consume presence API for UI components

## Goals / Non-Goals

**Goals:**
1. Implement company-room-based presence tracking where each company ID is a unique room
2. Provide heartbeat, list, and disconnect mutations for session management
3. Track input focus with support for multiple users focusing same input
4. Include "last edited by user at time" metadata for collaborative awareness
5. Create integration tests demonstrating multi-user presence scenarios
6. Design API surface compatible with @convex-dev/presence React hooks and FacePile component

**Non-Goals:**
1. Custom cursor position tracking (out of scope for MVP)
2. Real-time document collaboration (deferred to @convex-dev/prosemirror-sync)
3. Teacher monitoring dashboard (future phase)
4. Offline/online presence history or analytics
5. Push notifications for presence changes

## Decisions

### 1. Room Token Structure

**Decision**: Room tokens use format `company:<companyId>` where companyId is the stringified Convex ID.

**Rationale**:
- Simple and predictable
- Enables easy filtering and querying
- Aligns with existing company-based access control
- Scalable to future room types (e.g., `game:<gameId>` for teacher rooms)

**Alternatives Considered**:
- **Use raw companyId**: Less explicit about room type, harder to extend
- **Include game ID**: Redundant since company already references game
- **Hash-based tokens**: Unnecessary complexity for MVP

### 2. Storage Strategy for Focus Tracking

**Decision**: Store presence focus data in a separate `presenceFocus` table rather than @convex-dev/presence's user data.

**Rationale**:
- @convex-dev/presence user data is optimized for simple key-value pairs
- Focus tracking requires structured data (fieldId, userId, timestamp)
- Separate table enables efficient queries like "who is focused on field X"
- Aligns with domain-driven design (focus is a business concept, not generic presence)

**Alternatives Considered**:
- **Use presence user data**: Would need JSON serialization, less queryable
- **Embed in decision documents**: Violates separation of concerns (presence vs. business logic)

### 3. Last Edited Tracking

**Decision**: Implement last edited as part of focus tracking service, not presence core.

**Rationale**:
- "Last edited" is business logic related to field changes, not presence
- Presence tracks current state (who's here now), while last edited tracks history
- Separate service allows independent evolution and testing
- Can be extended to include edit history, conflict resolution, etc.

**Alternatives Considered**:
- **Include in presence mutations**: Would conflate real-time state with historical tracking
- **Trigger-based updates**: Adds complexity; explicit updates are clearer and more testable

### 4. Session Management

**Decision**: Use client-generated UUID for session identification with server-side session tokens from @convex-dev/presence.

**Rationale**:
- @convex-dev/presence returns a sessionToken from heartbeat mutation
- Client maintains both sessionId (local UUID) and sessionToken (server)
- SessionToken enables proper disconnect cleanup via @convex-dev/presence
- UUID ensures unique sessions across browser tabs/devices

**Alternatives Considered**:
- **Server-generated session IDs**: Requires additional round-trip during initialization
- **Browser tab ID only**: Not unique across devices for same user

### 5. Auth Integration Pattern

**Decision**: Presence functions extract user identity from ctx.auth and pass to @convex-dev/presence as userId.

**Rationale**:
- Maintains consistency with existing auth pattern (getCurrentUser)
- Leverages Convex's built-in auth validation
- userId in presence maps 1:1 with users table _id
- Enables role-based filtering (e.g., students only see their company's presence)

**Alternatives Considered**:
- **Pass email as userId**: Less efficient (requires query), breaks if email changes
- **Anonymous users**: Violates MVP requirement for authenticated collaboration

## Risks / Trade-offs

### Risk 1: Presence Update Latency
**Risk**: @convex-dev/presence uses scheduled functions with 10-second intervals, may feel slow for real-time collaboration.

**Mitigation**: 10 seconds is industry standard for presence (used by Slack, Discord). Focus updates (input field changes) will be instant via direct mutations.

### Risk 2: Multi-Tab Session Conflicts
**Risk**: Same user opening multiple tabs may create conflicting sessions.

**Mitigation**: Each tab generates unique sessionId, allowing one user to be "present" multiple times. This is actually desired behavior (student can have decision form open on laptop and tablet).

### Risk 3: Focus Data Accumulation
**Risk**: presenceFocus table may grow unbounded if focus events aren't cleaned up.

**Mitigation**:
1. Focus updates overwrite previous focus for same user-field combination
2. Presence component can include cleanup mutation for old focus records
3. Future: Add TTL index or scheduled cleanup job

### Risk 4: Test Complexity
**Risk**: Integration tests with multiple simulated users require careful setup.

**Mitigation**: Use convex-test's ability to run mutations/queries with different auth contexts. Create test helpers that simulate user sessions.

### Trade-off 1: Separate Focus Table vs. Embedded Data
**Chosen**: Separate table (see Decision 2)
**Trade-off**: Additional query/join overhead vs. queryability and separation of concerns. Acceptable for MVP scale.

### Trade-off 2: Real-Time vs. Eventual Consistency
**Chosen**: Presence updates are eventual (10s), focus updates are instant
**Trade-off**: Users may see slight delay in avatar updates vs. instant "typing" indicators. Aligns with user expectations (avatars don't need millisecond sync).

## Migration Plan

**Deployment Steps**:
1. Create `convex/services/presence.ts` and `convex/services/presenceFocus.ts`
2. Run Convex dev to generate types and deploy schema changes
3. Run integration tests to verify functionality
4. Update frontend components to use presence hooks (separate PR)

**Rollback Strategy**:
- Remove presence service files (no schema migrations required)
- Unregister @convex-dev/presence from convex.config.ts if needed
- No data migration needed (presence data is ephemeral)

**Testing Plan**:
1. Unit tests for each mutation/query (heartbeat, list, disconnect, updateFocus)
2. Integration test with 3 simulated users in same company
3. Verify heartbeat updates presence list
4. Verify disconnect removes session
5. Verify multiple users can focus same input
6. Verify focus updates overwrite previous focus for same user

## Open Questions

1. **Q**: Should teachers be able to see presence across all companies in their game?
   **A**: Out of scope for MVP. Future enhancement can add teacher-specific presence room (e.g., `game:<gameId>`).

2. **Q**: How should we handle users who are members of multiple companies?
   **A**: Schema restricts users to one company (userId.companyId is single value). No action needed.

3. **Q**: Should we include presence data in decision submission metadata?
   **A**: No. Presence is real-time and ephemeral. Submission metadata should snapshot "who submitted" at submission time, not "who was online."

4. **Q**: What happens if a user switches companies (e.g., teacher reassigns them)?
   **A**: Presence will automatically switch to new company room when heartbeat is called with new companyId. Old session will expire after timeout.

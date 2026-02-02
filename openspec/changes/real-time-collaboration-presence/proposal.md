# Proposal: Real-Time Collaboration & Presence

## Why

Students collaborate within their company on decisions, requiring awareness of teammates' activity. Teachers need cross-company visibility to monitor engagement and progress. Real-time presence indicators enable effective collaboration without requiring separate communication channels.

## What Changes

- **Company Room Presence**: Each company has a dedicated presence room showing online/offline status of all team members
- **Student Presence Display**:
  - Header shows online teammates with avatars
  - Offline teammates shown in tooltip (not click-to-expand)
  - Fixed-size presence section prevents layout shift when students come/go
  - User cursors visible on page with per-user color assignment
  - Input focus indicators: When multiple users focus same input, show all avatars top-right with unique "multiple focus" border color
  - "Last edited by <user> at <HH:MM:SS>" display below focused inputs
- **Teacher Dashboard Presence**:
  - Company-focused grid with each card showing online count and avatars
  - Submitted status badge per company
  - Offline students visible via tooltip on hover
  - Fixed-size presence area prevents layout shift
- **Room Isolation**: Presence rooms isolated by company ID; teachers have read access to all company rooms

## Capabilities

### New Capabilities

- `company-room-presence`: Multi-user presence tracking per company room using `@convex-dev/presence`, online/offline status broadcasting, heartbeat-based session management, user color assignment, session cleanup on disconnect

- `presence-ui-components`: FacePile component for avatar display, fixed-size layout container, UserCursors component for on-page cursor tracking, FocusIndicator component for multi-user input focus, HoverTooltip component for offline users

- `teacher-presence-monitoring`: Cross-company presence aggregation, company-level presence status cards, submitted status tracking, offline student tooltips

### Modified Capabilities

- `real-time-collaboration`: Extend existing collaboration framework to support company-scoped rooms and teacher cross-room monitoring

## Impact

**Affected Systems:**
- **Presence service**: Configure `@convex-dev/presence` with custom room tokens based on company ID
- **React components**: Create presence-aware wrappers for decision forms and dashboard cards
- **Convex functions**: Add heartbeat mutations and presence queries
- **Styling**: Add fixed-size containers and presence indicator styles to design system

**New Dependencies:**
- `@convex-dev/presence` (already installed)

**Performance Considerations:**
- Presence updates batched to reduce WebSocket traffic
- Heartbeat intervals configurable (default 30 seconds)
- User color palette limited to 20 distinct colors for scalability

**Breaking Changes:**
- None (new feature addition)

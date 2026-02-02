## Why

The Capo Business Simulation MVP requires real-time collaboration features where students (in companies) work together on hiring and leadership decisions. Teammates need to see who is currently online, which inputs others are focused on, and have visual indicators (cursors, avatars) for collaborative editing. Implementing presence tracking now establishes the foundation for all real-time collaboration features required by the MVP requirements.

## What Changes

- **Core Presence Infrastructure**: Integrate @convex-dev/presence (already installed) to provide room-based user presence tracking
- **Company Rooms**: Each company ID becomes a unique presence room, enabling teammates to see each other's online status
- **Input Focus Tracking**: Track which user is focused on which input/property with support for multiple users on the same input
- **Last Edited Tracking**: Include "last edited by user at time" metadata for fields
- **Presence API**: Create Convex functions for heartbeat, list, disconnect, and focus management
- **Integration with Auth**: Use authenticated user identity from ctx.auth for presence tracking

## Capabilities

### New Capabilities
- `presence`: Real-time user presence tracking in company rooms including online/offline status, user avatars, and room membership
- `input-focus`: Real-time tracking of which users are focused on which input fields, with support for multiple simultaneous users and visual indicators
- `presence-metadata`: Last edited tracking showing which user last modified a field and when

### Modified Capabilities
None - this is entirely new functionality

## Impact

- **Dependencies**: @convex-dev/presence (v0.3.0, already installed and registered in convex.config.ts)
- **New Files**:
  - `convex/services/presence.ts` - Core presence functions (heartbeat, list, disconnect)
  - `convex/services/presenceFocus.ts` - Input focus tracking with last edited metadata
  - `convex/services/presence.test.ts` - Integration tests with multiple simulated users
- **Modified Files**: None (new service layer only)
- **API Surface**: New public Convex functions for presence management
- **Frontend Integration**: Will enable presence-aware components using `usePresence` hook and `FacePile` UI component

## ADDED Requirements

### Requirement: Company room-based presence tracking
The system SHALL track real-time user presence in company-based rooms where each company ID creates a unique presence room. The system MUST use authenticated user identity from ctx.auth and support heartbeat-based session management with automatic timeout for offline users.

#### Scenario: User joins company room
- **WHEN** authenticated user calls heartbeat mutation with their company ID as room token
- **THEN** system adds user to presence list for that company room
- **AND** user appears in presence queries for that room
- **AND** user receives session token for future updates

#### Scenario: Multiple users in same company
- **WHEN** multiple users call heartbeat mutation with same company ID
- **THEN** system tracks all users in that company room
- **AND** each user's presence list shows all other users in the room
- **AND** each user maintains separate session tokens

#### Scenario: User heartbeat updates presence
- **WHEN** user calls heartbeat mutation with existing session ID and interval
- **THEN** system refreshes user's presence timestamp
- **AND** user remains in online presence list
- **AND** session timeout is reset

#### Scenario: User disconnects from room
- **WHEN** user calls disconnect mutation with valid session token
- **THEN** system immediately removes user from presence list
- **AND** user no longer appears in presence queries
- **AND** session is invalidated

#### Scenario: Presence timeout for inactive users
- **WHEN** user stops sending heartbeat requests (e.g., closes browser)
- **THEN** system automatically removes user from presence list after timeout period
- **AND** timeout duration is controlled by @convex-dev/presence scheduled functions (default 10 seconds)

#### Scenario: User cannot see other companies' presence
- **WHEN** user queries presence for a company they don't belong to
- **THEN** system returns empty presence list
- **OR** system throws authorization error
- **AND** user cannot access other companies' presence data

#### Scenario: Room token format
- **WHEN** system constructs room token for company
- **THEN** room token uses format "company:<companyId>"
- **AND** companyId is the stringified Convex ID
- **AND** format is consistent and predictable for querying

### Requirement: Presence list query
The system SHALL provide a query to retrieve all users currently present in a room, returning user identity information (name, email) for avatar display and online status indication.

#### Scenario: Query returns online users
- **WHEN** user queries presence list for their company room
- **THEN** system returns array of online users
- **AND** each user includes name, email, and presence metadata
- **AND** list is reactive and updates in real-time

#### Scenario: Query returns empty for new room
- **WHEN** user queries presence for company with no active users
- **THEN** system returns empty array
- **AND** query does not throw error

#### Scenario: Query excludes offline users
- **WHEN** user queries presence list
- **THEN** system only includes users with active sessions
- **AND** users who timed out or disconnected are not included

#### Scenario: Presence list integrates with FacePile component
- **WHEN** frontend passes presence list to @convex-dev/presence FacePile component
- **THEN** component displays avatars for each online user
- **AND** component shows correct number of users
- **AND** avatar display matches presence list order

### Requirement: Session management
The system SHALL manage user presence sessions using client-generated session IDs and server-issued session tokens, enabling proper cleanup and multi-tab/device support.

#### Scenario: Client generates unique session ID
- **WHEN** client initializes presence connection
- **THEN** client generates UUID for session identification
- **AND** UUID is unique across browser tabs and devices
- **AND** session ID persists for duration of presence connection

#### Scenario: Server issues session token
- **WHEN** user calls heartbeat mutation with session ID
- **THEN** system returns session token from @convex-dev/presence
- **AND** session token is used for disconnect operations
- **AND** session token is different from client session ID

#### Scenario: Multiple sessions for same user
- **WHEN** same user opens application in multiple tabs/devices
- **THEN** each tab generates unique session ID
- **AND** each session receives unique session token
- **AND** all sessions appear in presence list for that user

#### Scenario: Disconnect removes specific session
- **WHEN** user calls disconnect mutation with session token
- **THEN** system removes only that specific session
- **AND** other sessions for same user remain active
- **AND** user remains in presence list if other sessions exist

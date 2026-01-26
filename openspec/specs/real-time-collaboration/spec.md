# Real-Time Collaboration

## Purpose
The real-time-collaboration capability enables multiple users to work together simultaneously, with presence indicators showing who is viewing, hovering over, focused on, or editing specific domain objects. User focus is expressed in terms of domain objects (properties of models) rather than UI elements, enabling cross-view collaboration.

## Scope
This capability covers:
- Domain-based presence tracking with UI view context
- User presence indicators (FacePiles, ActivityLists, UserCursors)
- Collaborative editing states
- Real-time data synchronization
- Collaboration utilities (jump to view, follow user)
- Presence configuration
- Conflict resolution

Out of scope:
- Data storage and persistence (handled by Convex)
- UI component generation (see domain-expansion)
- Security enforcement (see rbac-security)

## Requirements

### Requirement: Domain-Based Presence Tracking
The system SHALL track user presence at both the domain level (model properties) and UI level (specific view instances), allowing presence indicators to work across different views while enabling "jump to view" and "follow user" functionality.

#### Scenario: Track property focus with view context
- **GIVEN** a user viewing a model property in a specific view (e.g., form instance in notebook page "Project Overview")
- **WHEN** the user focuses on an input for that property
- **THEN** the focus is broadcast to all other users viewing that model
- **AND** the focus includes both domain context (property Y of model Z) and UI context (view type, view identifier, location)
- **AND** all views of that property show the focus indicator

#### Scenario: Cross-view presence with view information
- **GIVEN** two users viewing the same model in different views (e.g., one in a form on "Page A", one in a table on "Page B")
- **WHEN** user A focuses on a property
- **THEN** user B sees the focus indicator with view information
- **AND** the indicator shows the view type and location (e.g., "User A in Form on Page A")
- **AND** user B can click to jump to that specific view

#### Scenario: Property hover with view context
- **GIVEN** a user hovering over a property input in a specific view
- **WHEN** the hover lasts longer than a threshold (e.g., 500ms)
- **THEN** the hover state is broadcast to other users
- **AND** the hover includes both property information and view location
- **AND** a subtle indicator shows which property is being hovered and where

### Requirement: User Presence Indicators
The system SHALL provide generic components for displaying user presence, including FacePiles, ActivityLists, and UserCursors.

#### Scenario: FacePile display
- **GIVEN** multiple users viewing or editing a model
- **WHEN** the FacePile component is rendered
- **THEN** it shows avatars of all active users
- **AND** the avatars are ordered by activity (most recent first)
- **AND** hovering over an avatar shows the user's name and current focus

#### Scenario: ActivityList display
- **GIVEN** multiple users making changes to a model
- **WHEN** the ActivityList component is rendered
- **THEN** it shows a chronological list of recent changes
- **AND** each entry includes the user, property changed, and timestamp
- **AND** the list updates in real-time

#### Scenario: UserCursors in rich text
- **GIVEN** multiple users editing a TipTap document
- **WHEN** user cursors are displayed
- **THEN** each user's cursor is shown with their name and color
- **AND** cursors update position in real-time
- **AND** the selection range is indicated

### Requirement: Collaborative Editing States
The system SHALL track and display different editing states (reading, focusing, editing) for each user-property combination.

#### Scenario: Reader awareness
- **GIVEN** a user viewing a model without editing
- **WHEN** other users are editing the model
- **THEN** the viewer sees who is editing
- **AND** the editors see who is viewing

#### Scenario: Editor awareness
- **GIVEN** a user editing a model property
- **WHEN** another user starts editing the same property
- **THEN** both users are notified of the conflict
- **AND** visual indicators show both users are editing

#### Scenario: Change attribution
- **GIVEN** multiple users editing the same property simultaneously
- **WHEN** one user makes a change
- **THEN** a "last changed by X at Y" indicator appears
- **AND** the indicator is shown in all views of that property

### Requirement: Real-Time Data Synchronization
The system SHALL synchronize data changes across all clients immediately, using Convex's real-time subscription model.

#### Scenario: Live mode synchronization
- **GIVEN** a form in Live mode
- **WHEN** a user changes a property value
- **THEN** the change is immediately sent to the server
- **AND** the change is broadcast to all other clients viewing that model
- **AND** all views update to reflect the new value

#### Scenario: Working mode synchronization
- **GIVEN** a form in Working mode
- **WHEN** a user changes a property value
- **THEN** the change is broadcast to other collaborators
- **AND** the change is persisted as a "working" document
- **AND** changes are not validated until submission

#### Scenario: Optimistic updates
- **GIVEN** a user making a change in a form
- **WHEN** the change is sent to the server
- **THEN** the UI optimistically updates to show the change
- **AND** if the server rejects the change, the UI reverts and shows an error

### Requirement: Collaboration Utilities
The system SHALL provide higher-level utilities for enhanced collaboration, including "jump to view" and "follow user" functionality.

#### Scenario: Jump to view
- **GIVEN** a user viewing a model
- **WHEN** another user is focused on a specific property in a different view
- **THEN** the first user can click a "jump to view" indicator
- **AND** the UI navigates to the specific view where the focus is occurring
- **AND** the UI scrolls to and highlights the focused property
- **AND** the navigation preserves the current user's context (e.g., maintains their position in history)

#### Scenario: Follow user
- **GIVEN** multiple users collaborating in a notebook
- **WHEN** one user enables "follow user" mode for another user
- **THEN** their view automatically switches to match the followed user's view
- **AND** their view scrolls to show the followed user's focus
- **AND** as the followed user navigates to different views or properties, the follower's view updates accordingly
- **AND** the follower can disable the mode at any time
- **AND** visual indicators show that follow mode is active

#### Scenario: Multi-user follow
- **GIVEN** multiple users following the same user
- **WHEN** the followed user navigates between views
- **THEN** all followers' views update simultaneously
- **AND** each follower can independently disable follow mode
- **AND** the followed user is notified when others are following them

### Requirement: Presence Configuration
The system SHALL allow users and developers to configure the degree of presence reporting, balancing privacy with collaboration.

#### Scenario: User presence preferences
- **GIVEN** a user with privacy concerns
- **WHEN** the user configures presence settings
- **THEN** they can choose to hide their presence, show only view/edit state, or show full focus details

#### Scenario: Developer presence configuration
- **GIVEN** a developer configuring a model
- **WHEN** the developer sets presence options
- **THEN** they can disable presence for sensitive models
- **AND** they can configure which presence features are enabled

### Requirement: Conflict Resolution
The system SHALL handle conflicts when multiple users edit the same data simultaneously.

#### Scenario: Last-write-wins for scalar values
- **GIVEN** two users editing the same text field simultaneously
- **WHEN** both users submit changes
- **THEN** the last change received by the server wins
- **AND** the first user is notified their change was overwritten

#### Scenario: Concurrent edits in rich text
- **GIVEN** two users editing different parts of a TipTap document
- **WHEN** both users make changes
- **THEN** the changes are merged using Operational Transformation or CRDT
- **AND** both changes are preserved

### Requirement: Real-Time Performance Targets
The system SHALL meet the following performance targets to ensure smooth real-time collaboration.

#### Scenario: Presence update latency
- **GIVEN** a user focusing on a property
- **WHEN** the focus event is broadcast to other users
- **THEN** the presence update is received within 100ms by 95% of users
- **AND** within 200ms by 99% of users
- **AND** latency is measured from focus event to client receipt

#### Scenario: Data synchronization latency
- **GIVEN** a user making a change in Live mode
- **WHEN** the mutation is sent to the server
- **THEN** the change is synchronized to 95% of other clients within 500ms
- **AND** within 1 second for 99% of clients
- **AND** optimistic updates hide the latency from the originating user

#### Scenario: Scalability for concurrent users
- **GIVEN** a notebook with active collaboration
- **WHEN** 100 users are simultaneously viewing and editing
- **THEN** presence updates remain below 100ms latency
- **AND** data sync remains below 1 second latency
- **AND** the system gracefully degrades rather than failing

#### Scenario: Bandwidth optimization
- **GIVEN** multiple users in the same notebook
- **WHEN** presence updates are broadcast
- **THEN** updates are batched when multiple events occur within 50ms
- **AND** delta encoding is used for presence changes
- **AND** bandwidth usage per user is less than 1 KB/s for presence updates alone

### Requirement: Reliability and Availability
The system SHALL maintain high availability for real-time features to prevent collaboration disruption.

#### Scenario: Connection resilience
- **GIVEN** a user with intermittent network connectivity
- **WHEN** the connection drops and reconnects within 5 seconds
- **THEN** the user automatically rejoins active collaboration sessions
- **AND** missed updates are synchronized upon reconnection
- **AND** the user is informed of any conflicts that occurred during disconnection

#### Scenario: Server availability
- **GIVEN** the real-time collaboration infrastructure
- **WHEN** measured over a 30-day period
- **THEN** the system maintains 99.9% uptime for presence and sync services
- **AND** planned maintenance is announced at least 24 hours in advance

## Testing Approach
Real-time collaboration capabilities shall be tested through:
- **Unit tests** for presence tracking logic, ensuring focus/hover events are correctly broadcast
- **Concurrency tests** simulating 100+ simultaneous users, verifying latency remains below targets
- **Network condition tests** simulating packet loss, high latency, and intermittent connections
- **Conflict resolution tests** with concurrent edits to the same data
- **Performance tests** measuring presence update latency and data sync speed under load
- **Integration tests** verifying "jump to view" and "follow user" features work across different view types

## Open Questions
1. How should the system handle conflict resolution for complex nested objects?
2. What's the best way to display user presence when there are many users (>10)?
3. Should presence history be tracked for auditing purposes?
4. How should "working mode" handle concurrent edits to the same working document?
5. What's the performance impact of tracking UI view context for all presence updates?

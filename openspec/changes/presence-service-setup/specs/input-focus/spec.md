## ADDED Requirements

### Requirement: Input focus tracking
The system SHALL track which users are currently focused on which input fields, supporting multiple users focused on the same input simultaneously. The system MUST store focus data in a separate table with field ID, user ID, and timestamp.

#### Scenario: User focuses input field
- **WHEN** user focuses an input field (e.g., salary input in hiring form)
- **THEN** system records focus event with user ID, field ID, and timestamp
- **AND** focus data is stored in presenceFocus table
- **AND** other users can query to see who is focused on that field

#### Scenario: Multiple users focus same input
- **WHEN** multiple users focus the same input field simultaneously
- **THEN** system records focus event for each user
- **AND** focus query returns all users focused on that field
- **AND** each user's focus is tracked independently

#### Scenario: User changes focus to different field
- **WHEN** user moves focus from one field to another
- **THEN** system updates focus record to new field ID
- **AND** previous field focus is removed for that user
- **AND** only current focus is active for each user-field combination

#### Scenario: User blurs input field
- **WHEN** user blurs (leaves) an input field
- **THEN** system removes or marks focus as inactive
- **AND** field no longer appears in that user's active focus list
- **AND** other users see updated focus state

#### Scenario: Focus field ID format
- **WHEN** system constructs field ID for focus tracking
- **THEN** field ID uses format "<companyId>:<entity>:<fieldPath>"
- **EXAMPLE**: "company123:hiring:salary" for salary field in hiring decision
- **AND** format is consistent and parseable

#### Scenario: Query focus by field
- **WHEN** user queries focus for a specific field ID
- **THEN** system returns array of users currently focused on that field
- **AND** each user entry includes name and timestamp
- **AND** results are reactive and update in real-time

#### Scenario: Query focus by user
- **WHEN** system queries all focus records for a specific user
- **THEN** system returns all fields that user is currently focused on
- **AND** results include field IDs and timestamps
- **AND** empty array if user has no active focus

### Requirement: Focus update mutation
The system SHALL provide a mutation to update user focus, accepting field ID and user ID, and overwriting previous focus for the same user-field combination.

#### Scenario: Update focus to new field
- **WHEN** user calls updateFocus mutation with field ID
- **THEN** system creates or updates focus record for that user-field combination
- **AND** timestamp is updated to current time
- **AND** previous focus for that user is removed or deactivated

#### Scenario: Overwrite existing focus
- **WHEN** user calls updateFocus for field they are already focused on
- **THEN** system updates timestamp for existing focus record
- **AND** no duplicate records are created
- **AND** focus remains active

#### Scenario: Focus updates require authentication
- **WHEN** unauthenticated user calls updateFocus mutation
- **THEN** system throws authorization error
- **AND** focus is not recorded
- **AND** error indicates authentication is required

#### Scenario: Clear focus on blur
- **WHEN** user blurs input field (calls updateFocus with null/undefined field ID)
- **THEN** system removes focus record for that user
- **AND** user no longer appears in focus queries for that field
- **AND** focus state is cleared immediately

### Requirement: Multi-user focus visualization
The system SHALL return focus data in a format compatible with frontend components that display user avatars and visual indicators (e.g., colored borders) when multiple users focus the same input.

#### Scenario: Focus query returns user data for avatars
- **WHEN** frontend queries focus for a field
- **THEN** system returns user objects with name, email, and optional avatar URL
- **AND** data format is compatible with FacePile or similar avatar components
- **AND** results are sorted by timestamp (most recent first)

#### Scenario: Multiple users trigger visual indicator
- **WHEN** two or more users focus the same input field
- **THEN** focus query returns multiple user entries
- **AND** frontend can display avatars for all focused users
- **AND** frontend applies unique border color or visual indicator to input

#### Scenario: Focus count determines UI behavior
- **WHEN** focus query returns multiple users
- **THEN** frontend uses count to trigger multi-user UI state
- **EXAMPLE**: Show ring of avatars around input
- **EXAMPLE**: Apply special border color when count > 1

#### Scenario: Focus data integrates with presence
- **WHEN** frontend displays both presence and focus
- **THEN** presence shows all online users in company
- **AND** focus shows which of those users are focused on specific fields
- **AND** focus is subset of presence (focused users must be online)

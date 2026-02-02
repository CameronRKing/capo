## ADDED Requirements

### Requirement: Last edited tracking
The system SHALL track "last edited by user at time" metadata for fields, recording which user last modified a specific field and when the modification occurred. This data is separate from real-time presence and provides historical context.

#### Scenario: Record last edited on field change
- **WHEN** user modifies a field value (e.g., updates salary in hiring decision)
- **THEN** system records user ID and timestamp for that field
- **AND** metadata is stored with field or in separate tracking table
- **AND** timestamp uses UTC epoch milliseconds

#### Scenario: Query last edited metadata
- **WHEN** user queries last edited data for a field
- **THEN** system returns user name and timestamp
- **AND** format is human-readable (e.g., "Last edited by John Doe at 2:30 PM")
- **AND** timestamp is converted to user's local timezone

#### Scenario: Last edited updates on each modification
- **WHEN** multiple users edit same field over time
- **THEN** system updates last edited metadata on each change
- **AND** only most recent edit is stored
- **AND** previous edit data is overwritten

#### Scenario: Last edited displayed in UI
- **WHEN** frontend displays input field
- **THEN** system shows "Last edited by {userName} at {timestamp}" below field
- **AND** metadata updates reactively when field changes
- **AND** display is optional (can be hidden for cleaner UI)

#### Scenario: Last edited for different entity types
- **WHEN** system tracks last edited for different entities (hiring, leadership, rankings)
- **THEN** metadata format is consistent across entity types
- **AND** field ID format distinguishes entity types
- **EXAMPLE**: "company123:hiring:salary" vs "company123:leadership:timeRecruiting"

### Requirement: Last edited integration with focus tracking
The system MAY integrate last edited metadata with focus tracking, updating last edited when user blurs a field they modified (indicating they finished editing).

#### Scenario: Update last edited on field blur
- **WHEN** user blurs input field after modifying value
- **THEN** system updates last edited metadata for that field
- **AND** timestamp is set to blur time
- **AND** user ID is captured from authenticated context

#### Scenario: No update if field not modified
- **WHEN** user blurs input field without changing value
- **THEN** system does not update last edited metadata
- **AND** previous last edited data remains unchanged
- **AND** no unnecessary writes occur

#### Scenario: Last edited respects field validation
- **WHEN** user modifies field but value fails validation
- **THEN** system does not update last edited metadata
- **AND** invalid changes are not recorded as "last edited"
- **AND** only valid modifications update metadata

### Requirement: Last edited query and storage
The system SHALL provide queries to retrieve last edited metadata for fields, with storage strategy that balances performance and data model clarity.

#### Scenario: Query last edited for single field
- **WHEN** user queries last edited for specific field ID
- **THEN** system returns user name, email, and timestamp
- **AND** returns null if field has never been edited
- **AND** query is efficient (single indexed lookup)

#### Scenario: Query last edited for multiple fields
- **WHEN** user queries last edited for multiple field IDs (batch query)
- **THEN** system returns array of last edited metadata
- **AND** results correspond to requested field IDs
- **AND** order matches input array order

#### Scenario: Storage in decision documents
- **WHEN** system stores last edited metadata (approach A)
- **THEN** metadata is embedded in decision documents as "lastEdited" object
- **AND** object contains field paths mapped to {userId, timestamp}
- **EXAMPLE**: `{ lastEdited: { salary: { userId: "user123", timestamp: 1234567890 } } }`

#### Scenario: Storage in separate table
- **WHEN** system stores last edited metadata (approach B)
- **THEN** metadata is in separate "fieldEditHistory" or "lastEdited" table
- **AND** each record contains { fieldId, userId, timestamp }
- **AND** indexed by fieldId for efficient queries

**Note**: Storage approach is implementation decision. Approach A (embedded) is simpler for MVP but may grow document size. Approach B (separate table) is more scalable but requires additional queries. Design doc should recommend approach based on expected usage patterns.

#### Scenario: Last edited data is not auditable history
- **WHEN** system tracks last edited metadata
- **THEN** only most recent edit is stored
- **AND** no edit history or audit trail is maintained
- **AND** previous user/timestamp data is lost on update
- **NOTE**: Full audit trail is future requirement, out of scope for MVP

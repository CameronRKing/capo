# Change Management

## Purpose
The change-management capability provides configurable data versioning, history tracking, and auditing for all model data. It supports multiple retention policies (full-history, latest-only, time-based) and automatic checkpoints, with options for read auditing and user-facing snapshots.

## Scope
This capability covers:
- Configurable retention policies (full-history, latest-only, time-based, property-level)
- Automatic checkpoints (minutely, hourly, daily)
- Read auditing for sensitive data
- User-facing snapshots for versioning
- Universal undo/redo (user-specific, workspace-level, domain-level)
- Change tracking metadata
- Change visualization and comparison
- Pruning and cleanup

Out of scope:
- Data storage itself (handled by Convex)
- UI for displaying changes (see domain-expansion)
- Security policy enforcement (see rbac-security)

## Requirements

### Requirement: Configurable Retention Policies
The system SHALL allow developers to configure retention policies at the model level, with options for full-history, latest-only, and time-based retention.

#### Scenario: Full-history policy
- **GIVEN** a model configured with full-history retention
- **WHEN** any mutation creates, updates, or deletes a document
- **THEN** all versions are stored indefinitely
- **AND** the complete history can be queried and audited

#### Scenario: Latest-only policy
- **GIVEN** a model configured with latest-only retention
- **WHEN** a document is updated
- **THEN** only the current version is stored
- **AND** previous versions are immediately discarded

#### Scenario: Property-level policy
- **GIVEN** a model configured with property-level retention
- **WHEN** specific properties are configured for full-history
- **THEN** only those properties retain history
- **AND** other properties are latest-only

#### Scenario: Time-based policy
- **GIVEN** a model configured with time-based retention (e.g., last 30 days)
- **WHEN** a document is modified
- **THEN** versions are retained for the configured duration
- **AND** versions older than the retention period are automatically pruned

### Requirement: Automatic Checkpoints
The system SHALL create automatic checkpoints at configurable intervals (minutely, hourly, daily) for point-in-time recovery.

#### Scenario: Hourly checkpoints
- **GIVEN** a model configured for hourly checkpoints
- **WHEN** the checkpoint interval elapses
- **THEN** a snapshot is created of all documents in the model
- **AND** the checkpoint is stored with a timestamp

#### Scenario: Minutely checkpoints for critical data
- **GIVEN** a model with critical data requiring frequent checkpoints
- **WHEN** minutely checkpoints are configured
- **THEN** a snapshot is created every minute
- **AND** storage impact is monitored and managed

#### Scenario: Restore from checkpoint
- **GIVEN** a model with historical checkpoints
- **WHEN** an administrator restores a checkpoint
- **THEN** the model data is reverted to the checkpoint state
- **AND** the restore operation is logged

### Requirement: Read Auditing
The system SHALL provide optional read auditing for sensitive data, tracking who accessed what data and when.

#### Scenario: Enable read auditing
- **GIVEN** a model with sensitive data
- **WHEN** read auditing is enabled for the model
- **THEN** all read operations are logged with user, timestamp, and document IDs
- **AND** the audit log is queryable

#### Scenario: Query audit log
- **GIVEN** a model with read auditing enabled
- **WHEN** an administrator queries the audit log
- **THEN** they can see who accessed which documents and when
- **AND** the log can be filtered by user, document, and time range

#### Scenario: Performance impact
- **GIVEN** read auditing enabled on a high-traffic model
- **WHEN** read operations occur
- **THEN** the performance impact is minimal (<5% overhead)
- **AND** audit writes are batched or asynchronous

### Requirement: User-Facing Snapshots
The system SHALL provide a user-facing snapshot mechanism for tracking user-versioned copies of specific documents.

#### Scenario: Create personal snapshot
- **GIVEN** a user viewing a document
- **WHEN** they create a snapshot
- **THEN** a copy of the document is saved to their personal snapshots
- **AND** the snapshot includes the document state at that moment

#### Scenario: Restore from personal snapshot
- **GIVEN** a user with personal snapshots
- **WHEN** they restore a snapshot
- **THEN** the document is reverted to the snapshot state
- **AND** the restore creates a new version in the main history

#### Scenario: Share snapshot
- **GIVEN** a user with a personal snapshot
- **WHEN** they share the snapshot with others
- **THEN** the recipients can view the snapshot
- **AND** the recipients can create their own copies

### Requirement: Universal Undo/Redo
The system SHALL provide undo/redo functionality at multiple levels: user-specific, workspace-level, and domain-level.

#### Scenario: User-specific undo
- **GIVEN** a user who has made multiple changes
- **WHEN** they invoke user-specific undo
- **THEN** only the changes made by that user are reverted
- **AND** changes made by other users are preserved

#### Scenario: Workspace-level undo
- **GIVEN** a collaborative workspace with multiple users
- **WHEN** a user with appropriate permissions invokes workspace undo
- **THEN** the most recent change, regardless of author, is reverted
- **AND** all users see the reverted state

#### Scenario: Domain-level undo
- **GIVEN** a specific domain object (e.g., a property of a model)
- **WHEN** a user invokes domain-level undo
- **THEN** only changes to that specific property are reverted
- **AND** changes to other properties are preserved

#### Scenario: Redo after undo
- **GIVEN** a user who has undone one or more changes
- **WHEN** they invoke redo
- **THEN** the undone changes are reapplied in reverse order
- **AND** the system tracks the undo/redo stack correctly

### Requirement: Change Tracking Metadata
The system SHALL store metadata for each change, including who, what, when, and context.

#### Scenario: Track change author
- **GIVEN** a mutation that modifies a document
- **WHEN** the change is recorded
- **THEN** the user ID of the author is stored
- **AND** the author's display name is retrievable

#### Scenario: Track change timestamp
- **GIVEN** a mutation that modifies a document
- **WHEN** the change is recorded
- **THEN** the precise timestamp is stored
- **AND** the timestamp is queryable

#### Scenario: Track change context
- **GIVEN** a mutation that modifies a document
- **WHEN** the change is recorded
- **THEN** the context is stored (e.g., which property was changed, the old and new values)
- **AND** the context is displayed in change history

### Requirement: Change Visualization
The system SHALL provide user interfaces for viewing and understanding change history.

#### Scenario: View document history
- **GIVEN** a user viewing a document with history
- **WHEN** they open the history view
- **THEN** a timeline of changes is displayed
- **AND** each change shows who, when, and what changed

#### Scenario: Compare versions
- **GIVEN** a user viewing a document's history
- **WHEN** they select two versions to compare
- **THEN** the differences between the versions are highlighted
- **AND** additions, deletions, and modifications are clearly shown

#### Scenario: Revert to previous version
- **GIVEN** a user viewing a document's history
- **WHEN** they revert to a previous version
- **THEN** the document is restored to that version
- **AND** a new version is created to record the revert

### Requirement: Pruning and Cleanup
The system SHALL provide automatic cleanup of historical data based on retention policies and storage constraints.

#### Scenario: Automatic pruning
- **GIVEN** a model with time-based retention
- **WHEN** versions exceed the retention period
- **THEN** the old versions are automatically deleted
- **AND** the deletion is logged

#### Scenario: Manual cleanup
- **GIVEN** a model with excessive history storage
- **WHEN** an administrator triggers manual cleanup
- **THEN** versions outside the retention policy are deleted
- **AND** the administrator is informed of space recovered

### Requirement: Change Management Performance
The system SHALL track changes efficiently without impacting application performance.

#### Scenario: Mutation overhead with full-history
- **GIVEN** a model with full-history retention enabled
- **WHEN** a mutation updates a document
- **THEN** version storage adds less than 20ms to mutation latency
- **AND** the mutation completes within 100ms total
- **AND** history storage does not block the response

#### Scenario: Undo/redo operation speed
- **GIVEN** a document with version history
- **WHEN** a user performs an undo operation
- **THEN** the undo completes within 200ms
- **AND** the UI updates immediately
- **AND** redo operations maintain similar performance

#### Scenario: History query performance
- **GIVEN** a document with 1000 historical versions
- **WHEN** a user queries the change history
- **THEN** the history view loads within 1 second
- **AND** loading more versions (pagination) completes within 500ms
- **AND** version comparison completes within 2 seconds

### Requirement: Storage Efficiency
The system SHALL minimize storage overhead for change tracking.

#### Scenario: Delta storage
- **GIVEN** a document with frequent small changes
- **WHEN** versions are stored
- **THEN** only changed fields are stored (delta encoding)
- **AND** storage per version averages less than 1 KB for typical changes
- **AND** full snapshots are created periodically (every 100 versions)

#### Scenario: Compression of history
- **GIVEN** historical versions older than 30 days
- **WHEN** storage is measured
- **THEN** versions are compressed to reduce storage by 50%
- **AND** compressed versions can still be queried and compared
- **AND** decompression adds less than 50ms to query time

## Testing Approach
Change management capabilities shall be tested through:
- **Unit tests** for undo/redo logic, ensuring correct state restoration
- **Performance tests** measuring mutation overhead with full-history enabled
- **Storage efficiency tests** verifying delta encoding and compression work correctly
- **Retention policy tests** confirming automatic pruning follows configured policies
- **Read audit tests** verifying all read operations are logged when auditing is enabled
- **Concurrent undo tests** simulating multiple users undoing operations simultaneously

## Open Questions
1. How should the system handle undo/redo for concurrent edits by multiple users?
2. What's the storage strategy for high-frequency updates with full-history?
3. Should there be a way to archive old history to cold storage?
4. How should read auditing logs be retained and secured?

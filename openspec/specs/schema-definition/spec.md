# Schema Definition

## Purpose
The schema-definition capability provides the foundation for defining domain models using Zod schemas. It enables automatic generation of validators, JSON schemas, and database table structures from type definitions, with validation running both client-side (for user feedback) and server-side (for data integrity).

## Scope
This capability covers:
- Zod schema definition and validation
- Database table instantiation from schemas
- Working document support for relaxed validation
- Cross-boundary validation (client and server)

Out of scope:
- UI component generation (see domain-expansion)
- Security policy enforcement (see rbac-security)
- Change history tracking (see change-management)

## Requirements

### Requirement: Zod Schema Definition
The system SHALL allow developers to define domain models using Zod schemas, with automatic generation of validators that run on both client and server.

#### Scenario: Define basic model
- **GIVEN** a developer wants to create a domain model
- **WHEN** they define a Zod schema with type specifications and refinements
- **THEN** the system generates client-side and server-side validators
- **AND** the schema can be introspected for UI component generation

#### Scenario: Schema with refinements
- **GIVEN** a Zod schema with custom refinements (e.g., email format, string length)
- **WHEN** data is validated
- **THEN** refinements are enforced both client-side and server-side
- **AND** validation errors are returned with clear messages

#### Scenario: Generate JSON schema
- **GIVEN** a Zod schema definition
- **WHEN** the system generates a JSON schema from the Zod schema
- **THEN** the JSON schema accurately represents the types, refinements, and structure
- **AND** the JSON schema can be used for dynamic component mapping

### Requirement: Database Table Instantiation
The system SHALL automatically create Convex database tables from Zod schema definitions, with proper indexing and relationships.

#### Scenario: Create table from schema
- **GIVEN** a Zod schema definition for a model
- **WHEN** the model is registered with the framework
- **THEN** a corresponding Convex table is created with matching columns
- **AND** appropriate indexes are created based on the schema structure

#### Scenario: Schema evolution
- **GIVEN** an existing Zod schema with deployed data
- **WHEN** the schema is modified (adding/removing/renaming fields)
- **THEN** the system provides a migration path for existing data
- **AND** the database structure is updated accordingly

### Requirement: Working Document Support
The system SHALL support "working" versions of documents with relaxed refinements, enabling safe collaboration on incomplete data.

#### Scenario: Create working document
- **GIVEN** a Zod schema with strict refinements
- **WHEN** a user creates a "working" document
- **THEN** types and property sets are enforced
- **AND** refinement logic is relaxed
- **AND** the document is persisted separately from "real" documents

#### Scenario: Validate working document
- **GIVEN** a working document with data that violates refinements
- **WHEN** the user submits the document for validation
- **THEN** the system applies full refinements
- **AND** if validation passes, the document is promoted to a "real" document
- **AND** if validation fails, clear error messages are provided

### Requirement: Cross-Boundary Validation
The system SHALL provide validation helpers that work seamlessly across client-server boundaries, with database-aware validation where needed.

#### Scenario: Client-side validation
- **GIVEN** a user input in a form
- **WHEN** the input changes
- **THEN** client-side validators provide immediate feedback
- **AND** validation errors are displayed inline

#### Scenario: Server-side validation
- **GIVEN** a mutation that modifies data
- **WHEN** the mutation is executed
- **THEN** server-side validators enforce all refinements
- **AND** invalid mutations are rejected with clear error messages

#### Scenario: Database-level validation
- **GIVEN** a validation rule requiring database access (e.g., unique email)
- **WHEN** data is submitted
- **THEN** the system performs the database check efficiently
- **AND** validation results are returned to both client and server

### Requirement: Validation Performance
The system SHALL validate data quickly to ensure responsive user experience.

#### Scenario: Client-side validation speed
- **GIVEN** a user entering data in a form field
- **WHEN** client-side validation runs on input
- **THEN** validation completes within 50ms for typical schemas
- **AND** validation does not block the UI thread
- **AND** users see immediate feedback

#### Scenario: Server-side validation throughput
- **GIVEN** a schema with complex refinements
- **WHEN** server-side validation processes 1000 documents per second
- **THEN** the system maintains acceptable latency (<100ms per validation)
- **AND** validation errors are returned with full context

### Requirement: Data Integrity and Reliability
The system SHALL ensure data integrity across client and server boundaries.

#### Scenario: Validation consistency
- **GIVEN** a Zod schema with refinements
- **WHEN** the same data is validated client-side and server-side
- **THEN** both validators produce identical results
- **AND** no invalid data can be stored due to validation mismatch

#### Scenario: Migration safety
- **GIVEN** a production schema with existing data
- **WHEN** a schema migration is performed
- **THEN** data is not lost or corrupted
- **AND** a rollback strategy is available if migration fails
- **AND** migrations are tested on a copy of production data first

## Testing Approach
Schema definition capabilities shall be tested through:
- **Unit tests** for all validation logic, ensuring refinements are correctly enforced
- **Integration tests** for schema migrations, verifying data integrity during schema evolution
- **Validation consistency tests** confirming client and server validators produce identical results
- **Performance tests** measuring validation speed for schemas with 50+ properties
- **Migration tests** on production data copies before deploying schema changes

## Open Questions
1. How should schema migrations be handled for existing production data?
2. What specific database-level validation helpers are needed beyond basic uniqueness checks?
3. How should working documents be versioned when submitted as "real" documents?

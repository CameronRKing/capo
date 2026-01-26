# RBAC Security

## Purpose
The rbac-security capability provides reactive row-level security (RLS) policies that automatically enforce access controls. When a user loses access rights, data immediately disappears from their queries without requiring manual invalidation or refresh.

## Scope
This capability covers:
- Row-level security policy definition and enforcement
- Reactive security updates
- CRUD security helpers
- Role-based access control
- Policy testing utilities
- Column-level security

Out of scope:
- Authentication (assumed to be handled by Convex)
- UI component generation (see domain-expansion)
- Change history tracking (see change-management)

## Requirements

### Requirement: Row-Level Security Policies
The system SHALL allow developers to define row-level security policies for each model, with reactive enforcement that removes inaccessible data immediately.

#### Scenario: Define read policy
- **GIVEN** a model with row-level security
- **WHEN** a developer defines a read policy (e.g., users can only read documents they own)
- **THEN** the policy is enforced on all queries for that model
- **AND** users only receive data they are authorized to access

#### Scenario: Define write policy
- **GIVEN** a model with row-level security
- **WHEN** a developer defines a write policy (e.g., users can only edit their own documents)
- **THEN** the policy is enforced on all mutations for that model
- **AND** unauthorized write operations are rejected

#### Scenario: Reactive policy enforcement
- **GIVEN** a user with access to specific rows
- **WHEN** the user's access is revoked (e.g., permission change, group removal)
- **THEN** the inaccessible rows immediately disappear from their queries
- **AND** the UI updates without requiring a manual refresh

### Requirement: CRUD Security Helpers
The system SHALL provide helper functions that auto-generate CRUD facilities with security policies applied.

#### Scenario: Generate secure CRUD operations
- **GIVEN** a model with defined security policies
- **WHEN** the developer uses the CRUD helper
- **THEN** read, create, update, and delete operations are generated
- **AND** all operations enforce the defined security policies
- **AND** no operation can bypass the policies

#### Scenario: Custom queries with security
- **GIVEN** a model with security policies
- **WHEN** a developer creates a custom query
- **THEN** the query automatically applies the model's read policies
- **AND** the developer must explicitly opt-out of security (with clear warnings)

#### Scenario: Custom mutations with security
- **GIVEN** a model with security policies
- **WHEN** a developer creates a custom mutation
- **THEN** the mutation automatically applies the model's write policies
- **AND** the mutation fails if the user lacks authorization

### Requirement: Policy Definition Syntax
The system SHALL provide a clear, expressive syntax for defining security policies based on user attributes, document properties, and relationships.

#### Scenario: User-based policy
- **GIVEN** a policy that checks user attributes (e.g., role, group membership)
- **WHEN** a query or mutation is executed
- **THEN** the policy evaluates the current user's attributes
- **AND** access is granted or denied based on the policy

#### Scenario: Document-based policy
- **GIVEN** a policy that checks document properties (e.g., ownerId, status)
- **WHEN** a query or mutation is executed
- **THEN** the policy evaluates the document's properties
- **AND** access is granted or denied based on the policy

#### Scenario: Relationship-based policy
- **GIVEN** a policy that checks relationships (e.g., user is a member of the document's team)
- **WHEN** a query or mutation is executed
- **THEN** the policy evaluates the relationships
- **AND** access is granted or denied based on the policy

### Requirement: Security Policy Testing
The system SHALL provide utilities for testing security policies to ensure they work as intended.

#### Scenario: Test policy with different users
- **GIVEN** a security policy
- **WHEN** a developer runs a test with multiple user contexts
- **THEN** the test verifies that each user receives the appropriate data
- **AND** unauthorized data is not returned

#### Scenario: Test policy mutations
- **GIVEN** a security policy
- **WHEN** a developer runs a test attempting unauthorized mutations
- **THEN** the mutations are rejected
- **AND** appropriate error messages are returned

### Requirement: Role-Based Access Control
The system SHALL support role-based access control with predefined roles (e.g., owner, editor, viewer) and custom roles.

#### Scenario: Predefined roles
- **GIVEN** a model with role-based access control
- **WHEN** a user is assigned a role (e.g., owner, editor, viewer)
- **THEN** the user receives permissions associated with that role
- **AND** the permissions are enforced on all operations

#### Scenario: Custom roles
- **GIVEN** a need for custom roles beyond the predefined set
- **WHEN** a developer defines a custom role with specific permissions
- **THEN** the role is available for assignment
- **AND** the permissions are enforced

#### Scenario: Multiple roles per user
- **GIVEN** a user assigned multiple roles
- **WHEN** the user performs an operation
- **THEN** the user receives the union of permissions from all roles
- **AND** if any role grants permission, access is allowed

### Requirement: Column-Level Security
The system SHALL support column-level security for sensitive fields, with careful consideration of type generation and security implications.

#### Scenario: Hide sensitive fields
- **GIVEN** a model with sensitive fields (e.g., SSN, salary)
- **WHEN** a user without appropriate permissions queries the model
- **THEN** the sensitive fields are excluded from the response
- **AND** the user cannot determine the existence of those fields

#### Scenario: Partial field visibility
- **GIVEN** a model with column-level security
- **WHEN** a user queries the model
- **THEN** the user only sees fields they are authorized to access
- **AND** the schema reflects the user's permissions

### Requirement: Security Baseline
The system SHALL implement fundamental security measures to protect data and prevent unauthorized access.

#### Scenario: Authentication integration
- **GIVEN** the framework using Convex authentication
- **WHEN** a user attempts to access data
- **THEN** the user's identity is verified before authorization checks
- **AND** unauthenticated requests are rejected with appropriate error codes
- **AND** session tokens are managed securely

#### Scenario: TLS enforcement
- **GIVEN** data transmitted between client and server
- **WHEN** the connection is established
- **THEN** TLS 1.2 or higher is required for all communication
- **AND** plaintext HTTP is rejected in production environments
- **AND** certificate validation is enforced

#### Scenario: Rate limiting
- **GIVEN** a user making API requests
- **WHEN** the user exceeds 1000 requests per minute
- **THEN** additional requests are throttled
- **AND** rate limit headers inform the client of remaining quota
- **AND** rate limits are configurable per model and per user role

#### Scenario: Session management
- **GIVEN** an authenticated user session
- **WHEN** the session is inactive for 24 hours
- **THEN** the session expires and requires re-authentication
- **AND** users can manually log out from all devices
- **AND** concurrent sessions are limited to 5 per user

### Requirement: Security Performance
The system SHALL enforce security policies without significant performance impact.

#### Scenario: Policy evaluation speed
- **GIVEN** a query with row-level security policies
- **WHEN** the policy is evaluated for 1000 rows
- **THEN** policy evaluation adds less than 50ms overhead
- **AND** policy results are cached for identical queries
- **AND** cache invalidation occurs when policies change

#### Scenario: Reactive enforcement latency
- **GIVEN** a user's access being revoked
- **WHEN** the revocation is processed
- **THEN** the user's query results update within 500ms
- **AND** the user's WebSocket connection is notified immediately
- **AND** inaccessible data is removed from the client

## Testing Approach
RBAC security capabilities shall be tested through:
- **Unit tests** for individual policy evaluation logic, verifying correct access decisions
- **Integration tests** with multiple user contexts, ensuring policies enforce correctly across queries and mutations
- **Security audit tests** attempting unauthorized operations and verifying rejection
- **Performance tests** measuring policy evaluation overhead with 1000+ rows and complex policies
- **Reactive enforcement tests** confirming data disappears immediately when access is revoked
- **Penetration tests** attempting to bypass policies through direct API calls or malformed requests

## Open Questions
1. How should permission inheritance work for nested models?
2. What's the best way to handle security policy versioning and migrations?
3. Should there be a security audit log for policy violations?
4. How should type generation reflect user-specific column visibility?

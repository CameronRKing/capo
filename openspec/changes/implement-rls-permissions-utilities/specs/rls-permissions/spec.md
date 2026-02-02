## ADDED Requirements

### Requirement: Retrieve authenticated user from context
The system SHALL provide a utility function to retrieve the currently authenticated user from the Convex query context, including their role and game/company assignments.

#### Scenario: Successfully retrieve authenticated user
- **WHEN** a valid auth identity exists in the Convex context
- **THEN** the function returns the complete User object with id, name, email, role, gameId, and companyId

#### Scenario: Fail when no identity exists
- **WHEN** no auth identity exists in the Convex context
- **THEN** the function throws an error with message "Not authenticated"

#### Scenario: Fail when user not found in database
- **WHEN** auth identity exists but user record not found in users table
- **THEN** the function throws an error with message "User not found"

### Requirement: Check user role membership
The system SHALL provide a utility function to check if a user has one of the specified roles.

#### Scenario: User has matching role
- **WHEN** user.role is "teacher" and roles array contains "teacher"
- **THEN** function returns true

#### Scenario: User does not have matching role
- **WHEN** user.role is "student" and roles array contains ["teacher", "admin"]
- **THEN** function returns false

#### Scenario: User matches any role in list
- **WHEN** user.role is "admin" and roles array contains ["teacher", "admin"]
- **THEN** function returns true

### Requirement: Validate game-level access
The system SHALL provide a utility function to validate if a user can access a specific game based on their role and assignments.

#### Scenario: Admin can access any game
- **WHEN** user.role is "admin" and any gameId is provided
- **THEN** function returns true

#### Scenario: Teacher can access their assigned game
- **WHEN** user.role is "teacher" and user.gameId matches the provided gameId
- **THEN** function returns true

#### Scenario: Teacher cannot access different game
- **WHEN** user.role is "teacher" and user.gameId does not match provided gameId
- **THEN** function returns false

#### Scenario: Student can access their assigned game
- **WHEN** user.role is "student" and user.gameId matches the provided gameId
- **THEN** function returns true

#### Scenario: Student cannot access different game
- **WHEN** user.role is "student" and user.gameId does not match provided gameId
- **THEN** function returns false

### Requirement: Validate company-level access
The system SHALL provide a utility function to validate if a user can access a specific company based on their role and assignments.

#### Scenario: Admin can access any company
- **WHEN** user.role is "admin" and any companyId is provided
- **THEN** function returns true

#### Scenario: Teacher can access companies in their game
- **WHEN** user.role is "teacher" and the company's gameId matches user.gameId
- **THEN** function returns true (via company lookup)

#### Scenario: Student can access their assigned company
- **WHEN** user.role is "student" and user.companyId matches the provided companyId
- **THEN** function returns true

#### Scenario: Student cannot access different company
- **WHEN** user.role is "student" and user.companyId does not match provided companyId
- **THEN** function returns false

### Requirement: Type-safe role definitions
The system SHALL export TypeScript types for Role and User to ensure type safety across the codebase.

#### Scenario: Role type is union of valid roles
- **WHEN** Role type is imported
- **THEN** it equals "admin" | "teacher" | "student"

#### Scenario: User interface includes all required fields
- **WHEN** User type is imported
- **THEN** it includes id (string), name (string), email (string), role (Role), gameId (optional string), companyId (optional string)

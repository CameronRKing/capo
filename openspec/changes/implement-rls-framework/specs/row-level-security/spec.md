## ADDED Requirements

### Requirement: Custom query builder with automatic RLS enforcement
The system SHALL provide a custom query builder that automatically enforces row-level security rules for all database reads.

#### Scenario: Admin queries all games
- **WHEN** admin user uses queryWithRLS to query games table
- **THEN** system returns all games in the database

#### Scenario: Teacher queries games
- **WHEN** teacher user uses queryWithRLS to query games table
- **THEN** system returns only the game assigned to that teacher

#### Scenario: Student queries games
- **WHEN** student user uses queryWithRLS to query games table
- **THEN** system returns only the game assigned to that student

#### Scenario: Default deny policy
- **WHEN** user attempts to query a table without matching RLS rule
- **THEN** system denies access and returns empty result set

### Requirement: Custom mutation builder with automatic RLS enforcement
The system SHALL provide a custom mutation builder that automatically enforces row-level security rules for all database writes (insert, modify, delete).

#### Scenario: Admin can insert any game
- **WHEN** admin user uses mutationWithRLS to insert a game
- **THEN** system allows the insertion

#### Scenario: Teacher cannot insert games
- **WHEN** teacher user uses mutationWithRLS to insert a game
- **THEN** system denies the insertion

#### Scenario: Student can modify their company
- **WHEN** student user uses mutationWithRLS to modify their assigned company
- **THEN** system allows the modification

#### Scenario: Student cannot modify other companies
- **WHEN** student user uses mutationWithRLS to modify a different company
- **THEN** system denies the modification

### Requirement: Games table RLS rules
The system SHALL enforce role-based access control on the games table according to business rules.

#### Scenario: Admins can read all games
- **WHEN** admin user queries games table
- **THEN** system returns all games

#### Scenario: Teachers can read their assigned game
- **WHEN** teacher with gameId="game1" queries games table
- **THEN** system returns only game with _id="game1"

#### Scenario: Teachers can modify their game
- **WHEN** teacher attempts to modify their assigned game
- **THEN** system allows the modification

#### Scenario: Teachers cannot modify other games
- **WHEN** teacher attempts to modify a different game
- **THEN** system denies the modification

#### Scenario: Students can read their game
- **WHEN** student with gameId="game1" queries games table
- **THEN** system returns only game with _id="game1"

#### Scenario: Students cannot modify games
- **WHEN** student attempts to modify any game
- **THEN** system denies the modification

#### Scenario: Only admins can insert games
- **WHEN** non-admin user attempts to insert a game
- **THEN** system denies the insertion

### Requirement: Companies table RLS rules
The system SHALL enforce role-based access control on the companies table according to business rules.

#### Scenario: Admins can read all companies
- **WHEN** admin user queries companies table
- **THEN** system returns all companies

#### Scenario: Teachers can read companies in their game
- **WHEN** teacher with gameId="game1" queries companies table
- **THEN** system returns only companies where gameId="game1"

#### Scenario: Students can read only their company
- **WHEN** student with companyId="company1" queries companies table
- **THEN** system returns only company with _id="company1"

#### Scenario: Students cannot read other companies
- **WHEN** student with companyId="company1" queries companies table
- **THEN** system does not return companies with different _id

#### Scenario: Students can modify their company
- **WHEN** student modifies their assigned company
- **THEN** system allows the modification

#### Scenario: Students cannot modify other companies
- **WHEN** student attempts to modify a different company
- **THEN** system denies the modification

#### Scenario: Admins and teachers can insert companies
- **WHEN** admin or teacher inserts a company in their game
- **THEN** system allows the insertion

### Requirement: Users table RLS rules
The system SHALL enforce role-based access control on the users table to protect user privacy and maintain role boundaries.

#### Scenario: Admins can read all users
- **WHEN** admin user queries users table
- **THEN** system returns all users

#### Scenario: Teachers can read users in their game
- **WHEN** teacher with gameId="game1" queries users table
- **THEN** system returns only users in game "game1"

#### Scenario: Students can read themselves
- **WHEN** student queries users table
- **THEN** system returns their own user record

#### Scenario: Students can read teammates
- **WHEN** student with companyId="company1" queries users table
- **THEN** system returns users with same companyId

#### Scenario: Users can modify their own profile
- **WHEN** user modifies their own user record
- **THEN** system allows the modification

#### Scenario: Admins can modify any user
- **WHEN** admin modifies any user record
- **THEN** system allows the modification

#### Scenario: Non-admins cannot modify other users
- **WHEN** non-admin user attempts to modify another user
- **THEN** system denies the modification

### Requirement: Decision tables RLS rules
The system SHALL enforce role-based access control on decision tables (hiringDecisions, leadershipDecisions) to prevent students from accessing other teams' strategies.

#### Scenario: Admins can read all decisions
- **WHEN** admin user queries hiringDecisions table
- **THEN** system returns all decisions

#### Scenario: Teachers can read decisions in their game
- **WHEN** teacher queries hiringDecisions
- **THEN** system returns decisions for companies in their game

#### Scenario: Students can read their company's decisions
- **WHEN** student queries hiringDecisions
- **THEN** system returns only decisions for their companyId

#### Scenario: Students can insert their company's decisions
- **WHEN** student inserts hiringDecision for their company
- **THEN** system allows the insertion

#### Scenario: Students cannot insert decisions for other companies
- **WHEN** student attempts to insert decision for different company
- **THEN** system denies the insertion

#### Scenario: Students can modify their company's decisions
- **WHEN** student modifies their company's decision
- **THEN** system allows the modification

#### Scenario: Students cannot modify other companies' decisions
- **WHEN** student attempts to modify different company's decision
- **THEN** system denies the modification

#### Scenario: Teachers can read but not modify student decisions
- **WHEN** teacher attempts to modify a student decision
- **THEN** system denies the modification

### Requirement: Reports tables RLS rules
The system SHALL enforce role-based access control on reports tables (repPerformanceReports, financialReports) as read-only for students.

#### Scenario: Students can read their company's reports
- **WHEN** student queries repPerformanceReports
- **THEN** system returns only reports for their companyId

#### Scenario: Students cannot modify reports
- **WHEN** student attempts to modify any report
- **THEN** system denies the modification

#### Scenario: Students cannot insert reports
- **WHEN** student attempts to insert a report
- **THEN** system denies the insertion

#### Scenario: Teachers can read reports in their game
- **WHEN** teacher queries financialReports
- **THEN** system returns reports for companies in their game

#### Scenario: Teachers can insert reports
- **WHEN** teacher inserts a report for a company in their game
- **THEN** system allows the insertion

### Requirement: Active reps table RLS rules
The system SHALL enforce role-based access control on the activeReps table for sales force management.

#### Scenario: Students can read their company's reps
- **WHEN** student queries activeReps
- **THEN** system returns only reps for their companyId

#### Scenario: Students can add reps to their company
- **WHEN** student inserts activeRep for their company
- **THEN** system allows the insertion

#### Scenario: Students can modify their company's reps
- **WHEN** student modifies their company's rep
- **THEN** system allows the modification

#### Scenario: Students cannot modify other companies' reps
- **WHEN** student attempts to modify rep from different company
- **THEN** system denies the modification

#### Scenario: Teachers can read reps in their game
- **WHEN** teacher queries activeReps
- **THEN** system returns reps for companies in their game

### Requirement: Static data tables are publicly readable
The system SHALL allow all authenticated users to read static data tables (resumes, counties) for reference purposes.

#### Scenario: All users can read resumes
- **WHEN** any authenticated user queries resumes table
- **THEN** system returns all resume records

#### Scenario: All users can read counties
- **WHEN** any authenticated user queries counties table
- **THEN** system returns all county records

#### Scenario: Only admins can modify static data
- **WHEN** non-admin user attempts to modify resumes or counties
- **THEN** system denies the modification

### Requirement: Access requests table RLS rules
The system SHALL enforce role-based access control on accessRequests to manage approval workflow.

#### Scenario: Admins can read all access requests
- **WHEN** admin user queries accessRequests table
- **THEN** system returns all access requests

#### Scenario: Teachers can read access requests for their game
- **WHEN** teacher queries accessRequests
- **THEN** system returns requests relevant to their game

#### Scenario: Students can read their own access requests
- **WHEN** student queries accessRequests
- **THEN** system returns only their own requests

#### Scenario: Only admins can modify access request status
- **WHEN** non-admin user attempts to modify accessRequest status
- **THEN** system denies the modification

### Requirement: RLS context includes user information
The system SHALL provide the authenticated user object to RLS rules and custom function builders for access control decisions.

#### Scenario: Query builder provides user context
- **WHEN** function uses queryWithRLS
- **THEN** ctx includes user object with role, gameId, and companyId

#### Scenario: Mutation builder provides user context
- **WHEN** function uses mutationWithRLS
- **THEN** ctx includes user object with role, gameId, and companyId

#### Scenario: User context is type-safe
- **WHEN** accessing ctx.user in queryWithRLS or mutationWithRLS
- **THEN** TypeScript validates User interface with all required fields

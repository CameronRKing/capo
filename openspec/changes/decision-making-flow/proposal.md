# Proposal: Decision-Making Flow

## Why

Students make collaborative hiring and leadership decisions each quarter. Data must persist across compilations, auto-save for safety, validate in real-time, and submit through secure backend functions that students cannot bypass. Teachers need visibility into submission status and timestamps.

## What Changes

- **Decision Data Architecture**:
  - All decision data stored on rep documents (firing status, territories, leadership behaviors, individual hours)
  - No snapshots - all data live and reactive via Convex subscriptions
  - "Current team" for hiring decisions = team from previous quarter (pre-draft)
  - "Current team" for leadership decisions = team from current quarter (post-draft)
  - Decision entry page dynamically loads based on current quarter AND decision phase ('hiring' or 'leadership')
- **Auto-Save with Persistence**:
  - Working decisions auto-save to database immediately on change
  - Data persists across compilations (no data loss)
  - Last-saved timestamp displayed to users
- **Real-Time Validation**:
  - Client-side validation via Convex schema validators (v.*)
  - AJV (Another JSON Schema Validator) for complex cross-field constraints
  - Validation errors displayed inline immediately
  - Submit button disabled until client-side validation passes
- **Submission Flow**:
  - "Last submitted by <user> at <date-timestamp>" displayed beneath submit button
  - Submit calls Convex action/mutation (students have NO write access to submitted decisions)
  - Backend re-validates all data before accepting submission
  - Students can re-submit unlimited times until teacher compiles (in-place override, no history)
- **Decision Form Modes**:
  - Hiring Phase: Compensation, training, hiring list, firing decisions
  - Leadership Phase: Territory assignment, time allocation, individual hours, leadership behaviors, market reports

## Capabilities

### New Capabilities

- `decision-persistence`: Auto-save decision drafts to Convex documents, reactive data binding with live updates, timestamp tracking for last save and last submission, cross-quarter data survival

- `decision-validation`: Multi-tier validation system with client-side Convex schema validators, AJV for cross-field constraints (sum to 100%, minimum/maximum values), backend re-validation on submit, inline error display

- `decision-submission`: Secure submission workflow via Convex actions, student write prevention on submitted state, in-place update with unlimited re-submission until compilation, submission audit trail (user + timestamp)

- `decision-phase-routing`: Dynamic form loading based on game current quarter and decision phase, hiring vs leadership decision mode detection, conditional field rendering

- `territory-assignment`: Interactive SVG map of Ohio counties, rep-to-county assignment with click interface, contiguity validation (counties must touch), randomize button respecting constraints, all-counties coverage validation

### Modified Capabilities

None (all new capabilities for this feature area)

## Impact

**Affected Systems:**
- **Convex schema**: Define SalesDecision and OtherDecision document types with full validation rules
- **Database tables**: Add tables for decisions (working, submitted), territories, leadership behaviors
- **React forms**: Create dynamic form components that adapt to decision phase
- **Validation layer**: Integrate AJV with Convex validators for complex cross-field rules
- **Routing**: Add decision entry routes with phase-based guards

**New Dependencies:**
- `ajv` for advanced JSON schema validation

**Data Models Affected:**
- ActiveRep documents extended with decision fields
- New TerritoryAssignment documents for county assignments
- New LeadershipBehavior documents per rep per quarter
- New SalesDecision and OtherDecision documents

**Breaking Changes:**
- None (new feature addition)

**Critical Validation Rules:**
- All percentage fields must sum to 100%
- Minimum training: product_knowledge ≥ 25%, selling_techniques ≥ 30%
- Minimum supervision: recruiting, meeting_customers, sales_planning ≥ 5%
- Territory contiguity: each rep's counties must be geographically adjacent
- Firing constraint: minimum 3 reps per company
- Maximum hiring: 3 reps per quarter
- Per diem required when travel=2

# Proposal: Resume Ranking

## Why

Students need to evaluate and rank account manager candidates individually, then combine rankings into a company hiring list. A two-phase flow (rough sorting → refinement) balances efficiency with collaborative decision-making. Each student's rankings remain private until combined.

## What Changes

- **Two-Phase Ranking Flow**:
  - **Phase 1 - Rough Sorting**: Students view unranked profiles one-by-one. Click A/B/C button to assign to group. Progress bar shows position. Profiles can be moved between groups during this phase.
  - **Phase 2 - Refinement**: Students see three groups (A/B/C) visible simultaneously. Drag profiles within and between groups. Rankings persist until student changes them.
- **Private Rankings**:
  - Each student has their own rankings (private from teammates during ranking)
  - Real-time view of teammates' rankings (visible but not editable)
  - Combined hiring list generated from all student rankings via voting algorithm
- **Ranking Combination Algorithm**:
  - Modified Borda count: Each student's rankings added together
  - Ties broken alphabetically by rep name
  - Groups (A/B/C) are UI affordance only - algorithm uses ordinal positions
  - Final hiring list used in hiring decisions
- **Profile Data**:
  - Public info: name, gender, education, experience, intelligence, myers_briggs, other_info, interview, reference_check
  - Private info (HIDDEN from students): effort, sales, correct_leadership_behavior, incorrect_leadership_behavior (affects compilation only)
- **UI Components**:
  - Single-profile view for rough sorting
  - Three-column drag-drop interface for refinement
  - Real-time teammate rankings display (read-only)
  - Progress indicator for rough sorting phase

## Capabilities

### New Capabilities

- `resume-ranking-workflow`: Two-phase ranking interface (rough sort → refinement), profile-by-profile viewing with A/B/C grouping, drag-drop refinement within/between groups, progress tracking, ranking state persistence per student

- `private-collaborative-ranking`: Per-student private ranking state, real-time teammate ranking visibility (read-only), ranking combination algorithm (modified Borda count), tie-breaking logic

- `resume-data-access`: Public profile data (resumes.ts) accessible to all users, private performance data (repPerf.ts) hidden from students, server-side data filtering for access control

### Modified Capabilities

- `real-time-collaboration`: Extend collaboration framework to support private workspace with shared visibility (students see but cannot edit teammates' rankings)

## Impact

**Affected Systems:**
- **React components**: Create ranking UI components (single-profile view, three-column drag-drop, teammate rankings display)
- **State management**: Store per-student rankings in Convex documents with user-based access control
- **Algorithm**: Implement Borda count combination algorithm in Convex function
- **Drag-drop**: Integrate drag-drop library for refinement phase

**New Dependencies:**
- Drag-drop library (e.g., @dnd-kit/core, react-beautiful-dnd)

**Data Models:**
- StudentRanking documents (one per student per hiring phase)
  - student_id: reference to user
  - company_id: reference to company
  - quarter: hiring phase identifier
  - rankings: ordered array of rep IDs with group assignments
- CombinedHiringList documents (one per company per hiring phase)
  - company_id: reference to company
  - quarter: hiring phase identifier
  - hiring_list: final ordered array of rep IDs

**Breaking Changes:**
- None (new feature addition)

**Algorithm Details:**
- Borda count: Each position gets points (first = N, second = N-1, etc.)
- Points summed across all students for each rep
- Final list sorted by total points descending
- Alphabetical tie-breaker for equal point totals
- Groups (A/B/C) converted to ordinal positions before calculation (A = top third, etc.)

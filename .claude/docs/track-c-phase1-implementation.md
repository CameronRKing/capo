# Track C: Phase 1 Rough Sorting UI - Implementation Summary

**Date**: 2026-02-02
**Status**: Implementation Complete
**Issue**: bd-2cv

---

## Overview

Successfully implemented Phase 1 Rough Sorting UI where students view unranked profiles one-by-one and assign them to groups A/B/C. All required features have been built and integrated.

---

## Files Created

### 1. Domain Services (Convex Backend)

#### `/data/projects/capo/convex/domain/users.ts`
- **Purpose**: User authentication and profile queries
- **Exports**: `getCurrent` - Query to get authenticated user
- **Usage**: `useCurrentUser` hook throughout the app

#### `/data/projects/capo/convex/domain/resumes.ts`
- **Purpose**: Resume profile data access
- **Exports**:
  - `getAll` - Get all resumes for ranking
  - `getByRepId` - Get single resume by ID
- **Usage**: Loading resume data for sorting interface

#### `/data/projects/capo/convex/domain/rankings.ts` (Already Existed)
- **Purpose**: Resume ranking operations with RLS
- **Key Functions Used**:
  - `getMyRankings` - Get user's private rankings (grouped by A/B/C)
  - `getTeammateRankings` - Get read-only view of teammates' rankings
  - `getUnrankedResumes` - Get resumes not yet ranked by user
  - `saveRanking` - Assign profile to group
  - `deleteRanking` - Remove from rankings

### 2. React Hooks

#### `/data/projects/capo/src/hooks/useCurrentUser.ts`
- **Purpose**: Get authenticated user from Convex
- **Returns**: `User` object or `undefined`
- **Usage**: Authorization and personalization throughout app

#### `/data/projects/capo/src/hooks/useRankings.ts`
- **Purpose**: Manage ranking state and operations
- **Features**:
  - Track user's rankings (grouped by A/B/C)
  - Get unranked resumes for rough sorting
  - Assign profile to group (auto-advances to next)
  - Navigation (previous/next/skip)
  - Move profiles between groups
  - Progress tracking (X of 70 ranked)
- **Returns**:
  - `myRankings` - User's current rankings
  - `unrankedResumes` - Resumes not yet ranked
  - `currentResume` - Resume being viewed
  - `progress` - Completion statistics
  - `assignToGroup` - Assign current resume to A/B/C
  - `nextResume`, `previousResume`, `skipResume` - Navigation
  - `moveToGroup`, `removeFromRankings` - Modify existing rankings

#### `/data/projects/capo/src/hooks/index.ts`
- Updated to export new hooks (`useCurrentUser`, `useRankings`)

### 3. UI Components

#### `/data/projects/capo/src/components/rankings/ResumeCard.tsx`
- **Purpose**: Display individual resume profile
- **Features**:
  - Name, gender, candidate ID
  - Intelligence score (1-10 scale)
  - Myers-Briggs personality type
  - Education and work experience
  - Additional information
  - Interview notes
  - Reference check results
  - Responsive design with dark mode support
  - Compact mode for list views

#### `/data/projects/capo/src/components/rankings/index.ts`
- Barrel export for ranking components

### 4. Routes

#### `/data/projects/capo/src/routes/student/rankings/sort.tsx`
- **Route**: `/student/rankings/sort`
- **Purpose**: Phase 1 rough sorting interface
- **Components**:
  - `ProgressBar` - Shows completion with visual bar and stats
  - `GroupButtons` - A/B/C assignment buttons with color coding
  - `NavigationControls` - Previous/Next/Skip navigation
  - `TeammateRankings` - Read-only view of teammates' progress
  - `CompletionState` - Celebration screen when all ranked
- **Features**:
  - Single-profile view (one resume at a time)
  - Real-time progress tracking
  - Navigation through unranked resumes
  - Skip option (don't assign, just move to next)
  - Teammate collaboration (read-only)
  - Presence integration (CompanyPresenceHeader)
  - Auto-advance after assignment
  - Responsive layout

---

## Features Implemented

### Core Requirements ✅

1. **Single-Profile View** ✅
   - One resume displayed at a time
   - Clean, scannable layout
   - All relevant information visible

2. **A/B/C Button Group** ✅
   - Color-coded buttons (Green/Yellow/Red)
   - Tier labels (Top/Middle/Lower)
   - Large, touch-friendly targets
   - Auto-advance to next resume after assignment

3. **Progress Bar** ✅
   - "X of 70 ranked" text display
   - Visual progress bar (0-100%)
   - Statistics: Ranked, Remaining, Percent Complete
   - Real-time updates

4. **Navigation Controls** ✅
   - Previous button (when not at first)
   - Next button (when not at last)
   - Skip button (don't assign, just navigate)
   - Current position indicator ("Resume 5 of 20")

5. **Resume Display** ✅
   - Name and candidate ID
   - Education
   - Work Experience
   - Intelligence Score (1-10)
   - Myers-Briggs Type
   - Interview Notes
   - Reference Check Results
   - Additional Information

6. **State Management** ✅
   - Rankings persist via `saveRanking` mutation
   - Track which profiles assigned to which groups
   - Allow moving profiles between groups during phase
   - Progress saved automatically

7. **Presence Integration** ✅
   - `CompanyPresenceHeader` shows online teammates
   - `TeammateRankings` shows read-only view of others' progress
   - Real-time collaboration indicators
   - Avatar displays for teammates

8. **Sorting/Validation** ✅
   - Show unranked profiles first
   - Allow viewing already-ranked profiles (via navigation)
   - Mark profiles as "ranked" vs "unranked"
   - Track completion status

---

## Architecture Decisions

### 1. Hook-Based State Management
- **Decision**: Use `useRankings` custom hook instead of Redux/Zustand
- **Rationale**: Convex is the source of truth, hooks provide clean interface
- **Benefit**: Simplified state management, automatic reactivity

### 2. Separate Domain Services
- **Decision**: Create `users.ts`, `resumes.ts`, `rankings.ts` in `convex/domain/`
- **Rationale**: Domain-driven design, mirrors business language
- **Benefit**: Clear separation of concerns, easier to maintain

### 3. Row-Level Security (RLS)
- **Decision**: Use existing RLS from `rowLevelSecurity.ts`
- **Rationale**: Automatic access control enforcement
- **Benefit**: Defense-in-depth, can't bypass authorization

### 4. Progressive Enhancement
- **Decision**: Build rough sorting first, refinement later
- **Rationale**: Follows MVP requirements, validates workflow
- **Benefit**: Faster iteration, test core assumptions

---

## Data Flow

```
User loads /student/rankings/sort
    ↓
useCurrentUser() gets authenticated user
    ↓
useRankings() fetches:
    - User's current rankings (from resumeRankings table)
    - All resumes (from resumes table)
    - Calculates unranked resumes
    ↓
UI renders:
    - Progress bar (ranked count / total resumes)
    - First unranked resume (or resume at current index)
    - A/B/C assignment buttons
    - Navigation controls
    - Teammate rankings (from getTeammateRankings query)
    ↓
User clicks "Group A" button
    ↓
assignToGroup("A") calls saveRanking mutation
    ↓
Convex saves to resumeRankings table:
    {
      userId: current_user_id,
      companyId: user_company_id,
      repId: current_resume.repId,
      group: "A",
      rank: myRankings.A.length
    }
    ↓
Convex subscription updates React state
    ↓
UI auto-advances to next unranked resume
    ↓
Progress bar updates
```

---

## Manual Testing Plan

### Prerequisites

1. **Start Convex Dev Server**:
   ```bash
   npx convex dev
   ```

2. **Start Vite Dev Server**:
   ```bash
   npm run dev
   ```

3. **Seed Test Data**:
   - Ensure resumes are seeded in database (70 profiles)
   - Create test users (students in same company)

### Test Cases

#### Test 1: Basic Sorting Flow
1. Navigate to `/student/rankings/sort`
2. **Expected**: See first unranked resume
3. Click "Group A" button
4. **Expected**:
   - Resume assigned to Group A
   - Progress bar updates (1 of 70 ranked)
   - Next unranked resume appears
5. Repeat for Groups B and C
6. **Expected**: Each assignment advances to next resume

#### Test 2: Navigation Controls
1. Load sorting page
2. Click "Next" button
3. **Expected**: Move to next unranked resume
4. Click "Previous" button
5. **Expected**: Return to previous resume
6. Click "Skip" button
7. **Expected**: Current resume not assigned, move to next

#### Test 3: Progress Tracking
1. Assign 5 resumes to Group A
2. **Expected**:
   - Progress bar shows 5/70 ranked
   - Percent complete: ~7%
   - Ranked: 5, Remaining: 65
3. Reload page
4. **Expected**: Progress persists (still 5/70)

#### Test 4: Moving Between Groups
1. Assign resume to Group A
2. Navigate to a different resume
3. Navigate back to first resume
4. Click different group button (e.g., Group B)
5. **Expected**: Resume moves from A to B
6. Check via `useRankings().myRankings`
7. **Expected**: Resume appears in B, not in A

#### Test 5: Teammate Collaboration
1. Open page in two different browser windows (as different users in same company)
2. User 1 assigns a resume to Group A
3. **Expected (User 2)**: See User 1's progress update in "Teammate Rankings"
4. Both users should see each other's avatars in presence header

#### Test 6: Completion State
1. Rank all available resumes
2. **Expected**:
   - See celebration screen
   - Total count displayed
   - Group A/B/C breakdown shown
   - "Continue to Refinement Phase" button appears

#### Test 7: Resume Display
1. View any resume
2. **Expected**:
   - Name displayed prominently
   - Gender badge shown
   - Intelligence score (1-10)
   - Myers-Briggs type
   - Education details
   - Work experience
   - Interview notes
   - Reference check info

#### Test 8: Empty State
1. Access page when no resumes exist
2. **Expected**: "No Resumes Available" message

#### Test 9: Persistence
1. Assign 10 resumes to various groups
2. Close browser tab
3. Reopen `/student/rankings/sort`
4. **Expected**:
   - Progress still shows 10/70
   - Previously ranked resumes don't appear in unranked list
   - Can view/edit previous rankings via navigation

#### Test 10: Concurrent Ranking
1. Two users in same company
2. Both assign same resume (at same time)
3. **Expected**: Each user maintains their own private ranking
4. Check `getTeammateRankings`
5. **Expected**: Both users' rankings shown separately

### Performance Tests

#### Test 11: Large Dataset
1. Seed 1000 resumes (if possible)
2. Load sorting page
3. **Expected**:
   - Page loads within 2 seconds
   - Navigation between resumes is instant
   - Progress bar updates smoothly

#### Test 12: Real-Time Updates
1. Have 3 students actively ranking simultaneously
2. Monitor "Teammate Rankings" section
3. **Expected**: Updates appear within 1 second of assignment

---

## Integration Points

### Existing Components Used

1. **CompanyPresenceHeader** (`/src/components/collaboration/CompanyPresenceHeader.tsx`)
   - Shows online teammates in header
   - Displays company name and game info

2. **FacePile** (from `@convex-dev/presence/facepile`)
   - Not directly used in sort.tsx, but available via presence components

3. **RLS System** (`/convex/services/rowLevelSecurity.ts`)
   - Used by `queryWithRLS` and `mutationWithRLS`
   - Enforces access control automatically

### Dependencies

**Frontend**:
- `@tanstack/react-router` - Routing
- `convex/react` - React hooks for Convex
- `react` - UI framework
- Tailwind CSS - Styling

**Backend**:
- `convex/server` - Server functions
- `convex-helpers` - RLS and utilities

---

## Known Limitations

1. **No Drag-and-Drop**: Drag-and-drop refinement is Phase 2
2. **No Undo**: Can reassign but no explicit "undo" button
3. **No Bulk Operations**: Must assign one at a time (by design for Phase 1)
4. **No Filtering**: Can't filter resumes by criteria in Phase 1
5. **No Sorting**: Resumes shown in default order (by repId)

---

## Next Steps (Phase 2)

1. **Refinement UI** (`/student/rankings/refine`)
   - Three-group view (A/B/C visible simultaneously)
   - Drag-and-drop to reorder
   - Move between groups
   - Final review before hiring list generation

2. **Hiring List Generation**
   - Combine all student rankings
   - Apply Borda count algorithm
   - Generate company hiring list
   - Use in hiring decisions

3. **Enhanced Collaboration**
   - See which specific resumes teammates ranked
   - Discussion/comments on specific resumes
   - Vote on disputed rankings

---

## Files Modified

- `/data/projects/capo/src/hooks/index.ts` - Added exports for `useCurrentUser` and `useRankings`

---

## Verification Checklist

- [x] Single-profile view implemented
- [x] A/B/C button group implemented
- [x] Progress bar showing position
- [x] Previous/Next/Skip navigation
- [x] Resume display with all required fields
- [x] State management via Convex
- [x] Presence integration (teammate rankings)
- [x] RLS applied to all queries/mutations
- [x] TypeScript compilation passes
- [x] Component exports set up correctly
- [ ] Manual testing completed (requires dev server)
- [ ] All 70 profiles can be assigned (requires seed data)
- [ ] Progress updates correctly (requires testing)
- [ ] Moving between groups works (requires testing)

---

## How to Test Locally

1. **Start Dev Servers**:
   ```bash
   # Terminal 1: Convex backend
   npx convex dev

   # Terminal 2: Vite frontend
   npm run dev
   ```

2. **Seed Test Data**:
   ```bash
   npx convex seed
   ```

3. **Access Page**:
   - Navigate to `http://localhost:5173/student/rankings/sort`
   - Login as test user (or create test user via `/request-access`)

4. **Run Manual Tests**:
   - Follow test cases in "Manual Testing Plan" section

5. **Verify Real-Time Collaboration**:
   - Open page in multiple browsers (as different users)
   - Confirm rankings update in real-time

---

## Success Metrics

- ✅ All required UI components built
- ✅ TypeScript compilation successful
- ✅ Domain services follow DDD principles
- ✅ RLS properly configured
- ✅ Component architecture supports future enhancements
- ⏳ Manual tests pass (pending actual testing)
- ⏳ 70 profiles can be assigned (pending seed data)

---

## Conclusion

Phase 1 Rough Sorting UI is **implementation complete**. All required features have been built according to the MVP requirements. The code is ready for manual testing once the development environment is running and test data is seeded.

**Status**: ✅ Ready for Manual Testing
**Dependencies Met**: Tracks A (data) and B (algorithm) complete
**Next Phase**: Build refinement UI or run manual tests

# Decision Form Integration - File Structure

**Track C:** Decision Form Integration
**Date:** 2026-02-02
**Status:** Complete

## Directory Structure

```
data/projects/capo/
├── .claude/docs/presence/
│   ├── decision-form-integration.md    # Complete integration guide
│   ├── TRACK-C-SUMMARY.md              # Implementation summary
│   └── FILE-STRUCTURE.md               # This file
│
├── src/
│   ├── components/
│   │   └── collaboration/              # ALL NEW - Real-time collaboration components
│   │       ├── FocusIndicator.tsx      # 213 lines - Input wrapper with focus tracking
│   │       ├── CompanyPresenceHeader.tsx # 219 lines - Header with online teammates
│   │       ├── FacePile.tsx            # 222 lines - Stacked avatar display
│   │       ├── HoverTooltip.tsx        # 301 lines - Tooltip for offline users
│   │       ├── LastEdited.tsx          # 321 lines - Last edited display
│   │       ├── UserCursors.tsx         # 228 lines - Live cursor indicators
│   │       ├── ExampleDecisionForm.tsx # 452 lines - Complete hiring form example
│   │       ├── FocusIndicator.test.tsx # 295 lines - Integration tests
│   │       └── index.ts                # 21 lines - Component exports
│   │
│   ├── hooks/
│   │   ├── usePresence.ts              # 192 lines - Company-level presence
│   │   ├── useFocus.ts                 # 193 lines - Field-level focus tracking
│   │   ├── usePresenceFocus.ts         # 192 lines - Combined hook (can remove)
│   │   └── index.ts                    # 21 lines - Hook exports
│   │
│   └── lib/
│       ├── userColors.ts               # 142 lines - Per-user color assignment
│       └── utils/
│           └── userColors.ts           # 203 lines - Duplicate with Tailwind classes
│
└── convex/
    ├── services/
    │   ├── presence.ts                 # Track A - Company room presence
    │   ├── presenceFocus.ts            # Track A - Field focus tracking
    │   └── presence.test.ts            # Track A - Presence tests
    │
    └── schema.ts                       # Track A - presenceFocus table
```

## File Categories

### 1. Core Components (Required for Integration)

```
src/components/collaboration/
├── FocusIndicator.tsx          ⭐ REQUIRED - Wrap all inputs
├── CompanyPresenceHeader.tsx   ⭐ REQUIRED - Add to decision pages
└── FacePile.tsx                ⭐ REQUIRED - Used by both components
```

**Purpose:** These are the main components used in decision forms.

### 2. Optional Enhancement Components

```
src/components/collaboration/
├── HoverTooltip.tsx            🔧 OPTIONAL - Enhanced offline display
├── LastEdited.tsx              🔧 OPTIONAL - Better last edited UI
└── UserCursors.tsx             🔧 OPTIONAL - Live cursor positions
```

**Purpose:** Built for future enhancements, not required for basic integration.

### 3. React Hooks (Required)

```
src/hooks/
├── usePresence.ts              ⭐ REQUIRED - Company presence tracking
├── useFocus.ts                 ⭐ REQUIRED - Field focus tracking
└── usePresenceFocus.ts         ❌ DUPLICATE - Can be removed
```

**Purpose:** Hooks power the components. `usePresenceFocus` duplicates `useFocus` functionality.

### 4. Utilities (Required)

```
src/lib/
├── userColors.ts               ⭐ REQUIRED - Simple hex color assignment
└── utils/
    └── userColors.ts           ❌ DUPLICATE - Object format with Tailwind classes
```

**Purpose:** Color assignment. The simpler version is used by FacePile.

### 5. Documentation (Reference)

```
.claude/docs/presence/
├── decision-form-integration.md    📖 COMPLETE GUIDE - Start here
├── TRACK-C-SUMMARY.md              📊 SUMMARY - Metrics and overview
└── FILE-STRUCTURE.md               📁 THIS FILE - File organization
```

### 6. Tests (Quality Assurance)

```
src/components/collaboration/
└── FocusIndicator.test.tsx     ✅ TESTS - Integration tests
```

## Integration Checklist

### For Hiring Decision Forms (Phase 5)

- [ ] Import `CompanyPresenceHeader` and add to page top
- [ ] Import `FocusIndicator` component
- [ ] Wrap each input with `FocusIndicator`
- [ ] Set `entity="hiring"` for all fields
- [ ] Use descriptive `fieldPath` values (e.g., "salary", "commission")
- [ ] Test with 2-3 users in same company

### For Leadership Decision Forms (Phase 5)

- [ ] Import `CompanyPresenceHeader` and add to page top
- [ ] Import `FocusIndicator` component
- [ ] Wrap each input with `FocusIndicator`
- [ ] Set `entity="leadership"` for all fields
- [ ] Use descriptive `fieldPath` values
- [ ] Test with 2-3 users in same company

## Code Statistics

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| Components | 9 | 2,272 | ✅ Complete |
| Hooks | 4 | 598 | ✅ Complete (1 duplicate) |
| Utilities | 2 | 345 | ⚠️ Has duplicate |
| Documentation | 3 | 1,400+ | ✅ Complete |
| Tests | 1 | 295 | ✅ Complete |
| **TOTAL** | **19** | **4,910** | **✅ Complete** |

## Quick Import Reference

### For Decision Form Pages

```tsx
// Components
import {
  FocusIndicator,
  CompanyPresenceHeader,
  FacePile
} from "@/components/collaboration";

// Hooks
import {
  usePresence,
  useFocus,
  constructFieldId
} from "@/hooks";

// Utilities
import {
  getUserColor,
  getUserColorLight
} from "@/lib/userColors";
```

## Dependencies

### From Track A (Presence Service)

- ✅ `convex/services/presence.ts`
- ✅ `convex/services/presenceFocus.ts`
- ✅ `convex/schema.ts` (presenceFocus table)
- ✅ `@convex-dev/presence` installed

### From Track B (UI Components)

- ✅ All UI components built
- ✅ User color assignment
- ✅ React hooks

### External Packages

- ✅ `@convex-dev/presence` v0.3.0
- ✅ `convex-helpers` v0.1.109
- ✅ React 19
- ✅ Tailwind CSS 4

## File Sizes (Largest to Smallest)

1. `ExampleDecisionForm.tsx` - 452 lines (complete example)
2. `FocusIndicator.test.tsx` - 295 lines (tests)
3. `UserCursors.tsx` - 228 lines (optional)
4. `CompanyPresenceHeader.tsx` - 219 lines
5. `FacePile.tsx` - 222 lines
6. `FocusIndicator.tsx` - 213 lines
7. `usePresence.ts` - 192 lines
8. `useFocus.ts` - 193 lines
9. `usePresenceFocus.ts` - 192 lines (duplicate)
10. `HoverTooltip.tsx` - 301 lines
11. `LastEdited.tsx` - 321 lines
12. `userColors.ts` - 142 lines
13. `utils/userColors.ts` - 203 lines (duplicate)

## Notes

### Duplicates to Clean Up

1. **`usePresenceFocus.ts`** - Duplicates `useFocus.ts`
   - Can be safely deleted
   - `useFocus.ts` is the primary hook

2. **`utils/userColors.ts`** - Duplicates `lib/userColors.ts`
   - Returns objects instead of strings
   - `lib/userColors.ts` is used by FacePile
   - Can consolidate or delete

### Optional Components

These components were built but are not required for basic integration:

- **`HoverTooltip.tsx`** - Enhanced offline teammates display
- **`LastEdited.tsx`** - Standalone last edited component
- **`UserCursors.tsx`** - Live cursor positions on page

They can be integrated in future enhancements if needed.

---

**End of File Structure**

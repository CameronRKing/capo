# Subagent Task: Create HiringDecisionForm Component

## Context
You are implementing **Task 5.3: Hiring Decision Form** for Phase 5 of the Capo business simulation implementation plan.

**Your br issue ID:** bd-126

## Objective
Create `/data/projects/capo/src/components/decisions/HiringDecisionForm.tsx` with complete form implementation including all fields, validation, auto-save, and real-time collaboration features.

## Requirements from Proposal

### Form Fields

**1. Compensation Package:**
- Salary: number input ($30,000 - $100,000)
- Commission: slider/number (0% - 20%)
- Benefits: radio buttons (bronze/silver/gold)
- Travel: radio buttons (reps pay own / monthly per diem / unlimited)
- Per Diem: number 0-100 (required when travel="monthly per diem")

**2. Sales Contest:**
- Has Sales Contest: checkbox
- Is Open: radio button (open vs. closed) - shown when Has Sales Contest=true
- Threshold: number 0-100,000 - required when Is Open=true
- Type: radio button (open vs. qualified) - shown when Has Sales Contest=true

**3. Training Allocation:**
- Product Knowledge: slider 0-100%
- Market Orientation: slider 0-100%
- Company Orientation: slider 0-100%
- Selling Techniques: slider 0-100%
- **Must sum to 100%** - real-time validation

**4. Recruiting:**
- Recruiting: slider 0-100%

**5. Hiring & Firing:**
- Number to Hire: number 0-3
- Hiring List: ordered list of rep IDs (from rankings)
- Firing: array of rep IDs (from current active reps)

### UI Requirements
- Form layout with clear sections using Tailwind CSS v4
- Real-time validation feedback (inline errors)
- Auto-save indicator ("Saving...", "Saved", "Error")
- Presence indicators (from Phase 3) - use `CompanyPresenceHeader`
- Focus indicators (from Phase 3) - use `FocusIndicator` for each field
- Submit button (disabled when validation fails)
- Confirmation dialog on submit

### Data Persistence
- Auto-save to working decision on every change (debounced 500ms)
- Load from working decision on mount
- Submit moves to submitted (immutable)

## Technical Specifications

### Imports to Use
```tsx
import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { CompanyPresenceHeader } from "../collaboration/CompanyPresenceHeader";
import { FocusIndicator } from "../collaboration/FocusIndicator";
import { hiringDecisionSchema } from "../../convex/domain/decisions/validators";
```

### Component Structure
```tsx
export interface HiringDecisionFormProps {
  companyId: Id<"companies">;
  quarter: number;
}

export function HiringDecisionForm({ companyId, quarter }: HiringDecisionFormProps) {
  // Implementation
}
```

### Key Features to Implement

1. **Form State Management**
   - Local state for all form fields
   - Load initial data from `getHiringDecisionWorking` query
   - Handle loading and error states

2. **Auto-Save Functionality**
   - Debounced save (500ms) using `saveHiringDecisionWorking` mutation
   - Save indicator: "Saving...", "Saved", "Error"
   - Only save when form is valid according to Zod schema

3. **Real-Time Validation**
   - Use `hiringDecisionSchema` from validators
   - Display inline errors for each field
   - Show sum validation for training allocation
   - Cross-field validation (per diem required, etc.)

4. **Collaboration Features**
   - `CompanyPresenceHeader` at top for room presence
   - `FocusIndicator` wrapping each input field
   - Pass `companyId`, `entity="hiring"`, and `fieldPath` for each field

5. **Form Sections**
   - Compensation Package (salary, commission, benefits, travel, perDiem)
   - Sales Contest (hasSalesContest, salesContestType, salesContestThreshold)
   - Training Allocation (4 sliders with sum validation)
   - Recruiting (single slider)
   - Hiring & Firing (numberToHire, hiringList, firingList)

6. **Submit Flow**
   - Validate entire form with Zod schema
   - Call `submitHiringDecision` mutation
   - Show confirmation dialog
   - Disable submit button when validation fails

### Form Field Mappings

**FocusIndicator fieldPaths:**
- "salary"
- "commission"
- "benefits"
- "travel"
- "perDiem"
- "hasSalesContest"
- "salesContestType"
- "salesContestThreshold"
- "trainingProductKnowledge"
- "trainingMarketOrientation"
- "trainingCompanyOrientation"
- "trainingSellingTechniques"
- "recruiting"
- "numberToHire"
- "hiringList"
- "firingList"

### Validation Rules (from proposal)
- Salary: $30,000 - $100,000
- Commission: 0% - 20%
- Training sum: must equal 100%
- Training minimums: productKnowledge >= 25%, sellingTechniques >= 30%
- Per diem: required when travel="monthly_per_diem", 0-100 range
- Sales contest threshold: required when hasSalesContest=true and type="open"
- Number to hire: 0-3

### UI Styling
- Use Tailwind CSS v4 classes
- Section containers: `bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700`
- Section headers: `text-lg font-semibold text-gray-900 dark:text-white mb-4`
- Input fields: standard Tailwind form styles (see ExampleDecisionForm for reference)
- Submit button: `px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700`
- Error messages: `text-sm text-red-600 dark:text-red-400`

### Auto-Save Implementation
```tsx
const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
const saveMutation = useMutation(api.domain.decisions.saveHiringDecisionWorking);

useEffect(() => {
  const timer = setTimeout(async () => {
    if (formData) {
      setSaveStatus("saving");
      try {
        await saveMutation({
          companyId,
          quarter,
          data: formData
        });
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
      }
    }
  }, 500);

  return () => clearTimeout(timer);
}, [formData, companyId, quarter, saveMutation]);
```

### Presence Integration
```tsx
<CompanyPresenceHeader
  companyId={companyId}
  companyName={company?.name}
  showOfflineTooltip
  className="mb-6"
/>
```

## Existing Patterns to Follow

1. **See ExampleDecisionForm** at `/data/projects/capo/src/components/collaboration/ExampleDecisionForm.tsx` for basic structure and FocusIndicator usage patterns

2. **See TerritoryMap** at `/data/projects/capo/src/components/decisions/TerritoryMap.tsx` for mutation integration patterns

3. **See Rough Sorting Page** at `/data/projects/capo/src/routes/student/rankings/sort.tsx` for route component patterns

## Backend Integration

**Queries available:**
- `api.domain.decisions.getHiringDecisionWorking` - Load working decision

**Mutations available:**
- `api.domain.decisions.saveHiringDecisionWorking` - Auto-save draft
- `api.domain.decisions.submitHiringDecision` - Submit final decision

## Testing Considerations

After creating the component, verify:
1. All form fields render correctly
2. Validation errors show inline
3. Training sum updates in real-time
4. Auto-save indicator works
5. Presence indicators show when teammates are online
6. Focus indicators show when teammates view the same field
7. Submit button is disabled when invalid
8. Confirmation dialog appears on submit

## Output

Create the file `/data/projects/capo/src/components/decisions/HiringDecisionForm.tsx` with:
- Complete form implementation
- All required imports
- TypeScript types
- Comprehensive comments
- Proper error handling
- Accessibility features (labels, ARIA attributes)

## Notes

- Use existing collaboration components (don't recreate them)
- Follow the exact field names from the schema
- Match the validation rules from `hiringDecisionSchema`
- Keep the component readable and well-organized
- Add helpful comments for future developers

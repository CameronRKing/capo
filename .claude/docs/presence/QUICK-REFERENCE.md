# Decision Form Integration - Quick Reference

**Track C:** Decision Form Integration
**Branch:** `nutopia`
**Status:** ✅ COMPLETE

## Quick Start

### 1. Add to Decision Page (Top)

```tsx
import { CompanyPresenceHeader } from "@/components/collaboration";

<CompanyPresenceHeader
  companyId={user.companyId}
  companyName={company?.name}
  showOfflineTooltip
/>
```

### 2. Wrap Each Input

```tsx
import { FocusIndicator } from "@/components/collaboration";

<FocusIndicator
  companyId={user.companyId}
  entity="hiring"
  fieldPath="salary"
  userId={user._id}
  label="Annual Salary"
>
  <input type="number" />
</FocusIndicator>
```

## Field ID Format

```
companyId:entity:fieldPath

Examples:
- company123:hiring:salary
- company123:leadership:timeRecruiting
- company123:rankings:groupA
```

## Component Props

### FocusIndicator

```tsx
<FocusIndicator
  companyId={string}          // Required
  entity={string}             // Required: "hiring" | "leadership" | "rankings"
  fieldPath={string}          // Required: field name
  userId={string}             // Required: current user ID
  label={string}              // Optional: input label
  showLastEdited={boolean}    // Optional: default true
  showAvatars={boolean}       // Optional: default true
>
  {children}                  // Required: input element
</FocusIndicator>
```

### CompanyPresenceHeader

```tsx
<CompanyPresenceHeader
  companyId={string}          // Required
  companyName={string}        // Optional
  showOfflineTooltip={bool}   // Optional: default false
  avatarSize={number}         // Optional: default 32
  maxAvatars={number}         // Optional: default 5
/>
```

## Features

✅ **Field-Level Focus Tracking** - See who's viewing each field
✅ **Multi-User Detection** - Purple border when >1 user focused
✅ **Avatar Display** - Stacked avatars of focused users
✅ **Company Presence** - Online teammates in header
✅ **Offline Tooltip** - Hover to see offline users
✅ **Last Edited** - "Last edited by user at time"
✅ **Per-User Colors** - 15 distinct, consistent colors

## Testing

### Manual Test

1. Open form in 2 browser windows (Incognito mode)
2. Log in as different students in same company
3. Focus on same field from both windows
4. **Verify:** Purple border appears, both avatars show

### Run Tests

```bash
npm run test:once src/components/collaboration/
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Avatars not showing | Check field ID format: `companyId:entity:fieldPath` |
| Multi-user border not showing | Verify both users focused on exact same field ID |
| Header shows 0 online | Check presence heartbeat is firing (Network tab) |
| Last edited not updating | For MVP: Shows most recent focused user (placeholder) |

## File Locations

```
Components:  src/components/collaboration/
Hooks:       src/hooks/
Utilities:   src/lib/userColors.ts
Tests:       src/components/collaboration/*.test.tsx
Docs:        .claude/docs/presence/
```

## Import All

```tsx
import {
  FocusIndicator,
  CompanyPresenceHeader,
  FacePile
} from "@/components/collaboration";

import {
  usePresence,
  useFocus,
  constructFieldId
} from "@/hooks";
```

## Next Steps

1. ✅ Components built
2. ✅ Documentation complete
3. ⏳ **Manual testing with 2-3 users**
4. ⏳ Integrate into Phase 5 decision forms

## Support

- **Integration Guide:** `.claude/docs/presence/decision-form-integration.md`
- **Full Summary:** `.claude/docs/presence/TRACK-C-SUMMARY.md`
- **File Structure:** `.claude/docs/presence/FILE-STRUCTURE.md`

---

**Track C Complete** ✅

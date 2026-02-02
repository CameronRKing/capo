# Hiring Decision Form - Manual Testing Guide

## Overview
This guide provides comprehensive manual testing instructions for the Hiring Decision Form implementation.

## Test Environment Setup

### Prerequisites
1. Convex dev server running: `npm run dev:convex`
2. React app running: `npm run dev`
3. Test data seeded in Convex (games, companies, users, etc.)
4. At least 2 test user accounts in the same company (for collaboration testing)

### Test Users
- **Student A**: `student-a@test.com` - Company A
- **Student B**: `student-b@test.com` - Company A (same company for collaboration testing)
- **Teacher**: `teacher@test.com` - Game instructor

## Test Scenarios

### 1. Form Rendering and Layout

#### 1.1 Initial Page Load
**Steps:**
1. Login as Student A
2. Navigate to `/student/decisions/hiring`
3. Verify page loads without errors

**Expected Results:**
- ✅ Page header displays "Hiring Decisions"
- ✅ Current quarter and phase display correctly
- ✅ Company presence header shows at top
- ✅ All 5 form sections render:
  - Compensation Package
  - Sales Contest
  - Training Allocation
  - Recruiting
  - Hiring & Firing
- ✅ Submit button visible at bottom
- ✅ Auto-save status shows "idle" (no indicator)

#### 1.2 Form Field Layout
**Steps:**
1. Scroll through all form sections
2. Verify all fields are present and labeled

**Expected Results:**
- ✅ **Compensation**: Salary input, Commission slider, Benefits radio buttons, Travel radio buttons, Per Diem input (conditional)
- ✅ **Sales Contest**: Has Sales Contest checkbox, Type radio buttons (conditional), Threshold input (conditional)
- ✅ **Training**: 4 sliders (Product Knowledge, Market Orientation, Company Orientation, Selling Techniques)
- ✅ **Recruiting**: Single slider (placeholder - not yet implemented in schema)
- ✅ **Hiring & Firing**: Number to Hire input (0-3)

---

### 2. Data Entry and Validation

#### 2.1 Salary Field Validation
**Steps:**
1. Enter `25000` in salary field (below minimum)
2. Check for validation error
3. Enter `150000` in salary field (above maximum)
4. Check for validation error
5. Enter `50000` in salary field (valid)
6. Verify no error

**Expected Results:**
- ✅ Error shows for < $30,000: "Salary must be at least $30,000"
- ✅ Error shows for > $100,000: "Salary cannot exceed $100,000"
- ✅ No error for valid range ($30,000 - $100,000)
- ✅ Auto-save triggers after 500ms delay

#### 2.2 Commission Slider Validation
**Steps:**
1. Drag commission slider to 25% (above maximum)
2. Check for validation error
3. Drag to -5% (below minimum)
4. Check for validation error
5. Set to 10% (valid)
6. Verify percentage display updates

**Expected Results:**
- ✅ Error shows for > 20%: "Commission cannot exceed 20%"
- ✅ Error shows for < 0%: "Commission must be at least 0%"
- ✅ Percentage displays correctly next to slider
- ✅ Slider moves smoothly

#### 2.3 Benefits and Travel Radio Buttons
**Steps:**
1. Select each benefits option (bronze, silver, gold)
2. Verify only one can be selected
3. Select each travel option
4. Verify "monthly_per_diem" shows per diem field
5. Select other travel options
6. Verify per diem field hides

**Expected Results:**
- ✅ Radio buttons are mutually exclusive
- ✅ Per diem field shows/hides correctly based on travel selection
- ✅ Focus indicators work on each radio button

#### 2.4 Per Diem Conditional Validation
**Steps:**
1. Set travel to "monthly_per_diem"
2. Leave per diem empty
3. Check for validation error
4. Enter `-10` (below minimum)
5. Check for validation error
6. Enter `150` (above maximum)
7. Check for validation error
8. Enter `50` (valid)
9. Verify no error

**Expected Results:**
- ✅ Error when per diem empty and travel="monthly_per_diem"
- ✅ Error for < 0: "Per diem must be at least $0"
- ✅ Error for > 100: "Per diem cannot exceed $100"
- ✅ No error for valid range (0-100)

#### 2.5 Sales Contest Conditional Fields
**Steps:**
1. Uncheck "Has Sales Contest"
2. Verify contest type and threshold fields are hidden
3. Check "Has Sales Contest"
4. Verify contest type and threshold fields appear
5. Select "open" type
6. Verify threshold field shows
7. Select "closed" type
8. Verify threshold field hides

**Expected Results:**
- ✅ Fields show/hide correctly based on checkbox and type selection
- ✅ Validation error when threshold empty and type="open"
- ✅ No threshold required when type="closed"

#### 2.6 Training Allocation Sum Validation
**Steps:**
1. Set all 4 training sliders to 25% each
2. Verify sum shows 100% in green
3. Adjust one slider to 30%
4. Verify sum shows 105% in red
5. Verify error message: "Training allocation must sum to 100%"
6. Adjust another slider to 20%
7. Verify sum shows 100% in green
8. Verify error disappears

**Expected Results:**
- ✅ Sum updates in real-time as sliders move
- ✅ Green color when sum = 100%
- ✅ Red color when sum ≠ 100%
- ✅ Error message shows when sum ≠ 100%
- ✅ Submit button disabled when sum ≠ 100%

#### 2.7 Minimum Training Requirements
**Steps:**
1. Set Product Knowledge to 20% (below minimum)
2. Check for validation error
3. Set Selling Techniques to 25% (below minimum)
4. Check for validation error
5. Adjust to valid values (≥25% and ≥30%)
6. Verify errors clear

**Expected Results:**
- ✅ Error: "Product knowledge training must be at least 25%"
- ✅ Error: "Selling techniques training must be at least 30%"
- ✅ Errors clear when minimums met

#### 2.8 Number to Hire Validation
**Steps:**
1. Enter `-1` (negative)
2. Check for validation error
3. Enter `5` (above maximum)
4. Check for validation error
5. Enter `2` (valid)
6. Verify no error

**Expected Results:**
- ✅ Error for negative: "Number to hire must be non-negative"
- ✅ Error for > 3: "Cannot hire more than 3 reps per quarter"
- ✅ No error for valid range (0-3)

---

### 3. Auto-Save Functionality

#### 3.1 Auto-Save Trigger
**Steps:**
1. Fill out form with valid data
2. Change one field (e.g., salary)
3. Wait 500ms
4. Observe auto-save status

**Expected Results:**
- ✅ Status shows "Saving..." with spinner
- ✅ After ~500ms, status changes to "Saved" with checkmark
- ✅ After 2 seconds, "Saved" status disappears
- ✅ No "Error" status appears

#### 3.2 Auto-Save Error Handling
**Steps:**
1. Disconnect from internet (or block Convex requests)
2. Change a form field
3. Wait for auto-save
4. Observe error status

**Expected Results:**
- ✅ Status shows "Error saving" with error icon
- ✅ Form remains editable
- ✅ Can retry by changing another field

#### 3.3 Data Persistence
**Steps:**
1. Fill form with various values
2. Wait for auto-save to complete
3. Refresh page (F5)
4. Verify form loads saved values

**Expected Results:**
- ✅ All fields reload with previously saved values
- ✅ No data loss on page refresh
- ✅ Form state matches last save

---

### 4. Real-Time Collaboration

#### 4.1 Presence Indicators
**Steps:**
1. Login as Student A in one browser tab
2. Login as Student B in another browser tab (same company)
3. Navigate to hiring decision page in both tabs
4. Observe presence header

**Expected Results:**
- ✅ Both users appear in FacePile (avatars)
- ✅ Online count shows "2 teammates online"
- ✅ Avatars show user initials or names

#### 4.2 Focus Indicators
**Steps:**
1. Student A focuses on salary field
2. Student B observes salary field in their tab
3. Student B focuses on same field
4. Both users observe the field

**Expected Results:**
- ✅ Purple border appears when multiple users focused on same field
- ✅ "X people viewing" indicator shows below field
- ✅ Avatar pile shows above input field
- ✅ Focus indicators clear when user leaves field

#### 4.3 Last Edited Tracking
**Steps:**
1. Student A edits salary field and blurs
2. Student B observes "Last edited by Student A at HH:MM PM"
3. Student B edits commission field
4. Student A observes "Last edited by Student B at HH:MM PM"

**Expected Results:**
- ✅ Last edited message shows below each field
- ✅ Timestamp updates in real-time
- ✅ User name displays correctly

---

### 5. Submission Flow

#### 5.1 Submit Button Validation
**Steps:**
1. Leave form invalid (e.g., training sum ≠ 100%)
2. Try to click submit button
3. Fix all validation errors
4. Try to click submit button

**Expected Results:**
- ✅ Submit button disabled when form invalid
- ✅ Submit button enabled when form valid
- ✅ Button shows "Submit Decisions" text

#### 5.2 Confirmation Dialog
**Steps:**
1. Ensure form is valid
2. Click submit button
3. Observe confirmation dialog
4. Click "Cancel"
5. Verify form remains editable
6. Click submit again
7. Click "Confirm & Submit"

**Expected Results:**
- ✅ Dialog shows with title "Submit Hiring Decision?"
- ✅ Warning message about immutability
- ✅ Cancel button closes dialog
- ✅ Confirm button submits form

#### 5.3 Submission Success
**Steps:**
1. Submit valid form
2. Observe success message
3. Try to edit form after submission
4. Refresh page

**Expected Results:**
- ✅ Success alert: "Hiring decision submitted successfully!"
- ✅ Form becomes read-only or shows "submitted" status
- ✅ Cannot modify submitted decisions
- ✅ "Last submitted by" information visible

---

### 6. Access Control

#### 6.1 Student Access
**Steps:**
1. Login as Student A
2. Navigate to `/student/decisions/hiring`
3. Verify access

**Expected Results:**
- ✅ Page loads successfully
- ✅ Can view and edit form
- ✅ Can submit decisions

#### 6.2 Teacher Access
**Steps:**
1. Login as Teacher
2. Navigate to `/student/decisions/hiring`
3. Observe behavior

**Expected Results:**
- ✅ Page loads (read-only access)
- ✅ Can view student decisions
- ✅ Cannot edit or submit

#### 6.3 Unauthenticated Access
**Steps:**
1. Logout
2. Navigate to `/student/decisions/hiring`
3. Observe redirect

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot access form without authentication

#### 6.4 Cross-Company Access
**Steps:**
1. Login as Student A (Company A)
2. Use browser dev tools to modify companyId to Company B
3. Attempt to load/save decisions

**Expected Results:**
- ✅ RLS blocks cross-company access
- ✅ Error message or empty data
- ✅ Cannot modify other companies' decisions

---

### 7. Responsive Design

#### 7.1 Desktop View (1920x1080)
**Steps:**
1. Open form on desktop browser
2. Resize window to various widths

**Expected Results:**
- ✅ Form displays correctly at 1920px width
- ✅ Form displays correctly at 1280px width
- ✅ Training sliders show 2x2 grid
- ✅ All fields accessible

#### 7.2 Tablet View (768x1024)
**Steps:**
1. Resize browser to tablet width
2. Scroll through form

**Expected Results:**
- ✅ Form adapts to tablet width
- ✅ Training grid may stack to 1 column
- ✅ All fields remain usable

#### 7.3 Mobile View (375x667)
**Steps:**
1. Resize browser to mobile width
2. Test form interaction

**Expected Results:**
- ✅ Form adapts to mobile width
- ✅ Single column layout
- ✅ Touch targets large enough (44px min)
- ✅ Sliders work with touch

---

### 8. Dark Mode

#### 8.1 Dark Mode Toggle
**Steps:**
1. Toggle dark mode on/off
2. Verify all sections render correctly

**Expected Results:**
- ✅ Background colors invert correctly
- ✅ Text colors remain readable
- ✅ Input fields show correct dark styles
- ✅ Validation errors visible in both modes

---

### 9. Accessibility

#### 9.1 Keyboard Navigation
**Steps:**
1. Use Tab key to navigate form
2. Verify focus order
3. Use Enter/Space to activate buttons

**Expected Results:**
- ✅ Focus moves logically through fields
- ✅ Focus indicators visible
- ✅ Can submit with keyboard
- ✅ Escape key closes confirmation dialog

#### 9.2 Screen Reader Support
**Steps:**
1. Enable screen reader (NVDA/VoiceOver)
2. Navigate form
3. Verify field labels and errors

**Expected Results:**
- ✅ All fields have labels
- ✅ Validation errors announced
- ✅ Status changes announced (auto-save, etc.)
- ✅ ARIA attributes present

---

### 10. Edge Cases

#### 10.1 Network Latency
**Steps:**
1. Slow network (Chrome DevTools → Network → Slow 3G)
2. Fill form and observe auto-save

**Expected Results:**
- ✅ Auto-save queues requests
- ✅ No duplicate saves
- ✅ Status updates correctly

#### 10.2 Rapid Form Changes
**Steps:**
1. Rapidly change multiple fields
2. Observe auto-save behavior

**Expected Results:**
- ✅ Only latest data saved
- ✅ Debounce prevents excessive saves
- ✅ No race conditions

#### 10.3 Browser Back Button
**Steps:**
1. Fill form partially
2. Click browser back button
3. Click forward button
4. Verify form state

**Expected Results:**
- ✅ Form state preserved
- ✅ Auto-save data restored

---

## Test Results Checklist

Use this checklist to track test completion:

### Rendering & Layout
- [ ] Page loads without errors
- [ ] All sections render correctly
- [ ] Fields are properly labeled
- [ ] Responsive design works

### Data Entry & Validation
- [ ] Salary validation works
- [ ] Commission validation works
- [ ] Benefits/travel selection works
- [ ] Per diem conditional validation works
- [ ] Sales contest conditional fields work
- [ ] Training sum validation works
- [ ] Minimum training requirements enforced
- [ ] Number to hire validation works

### Auto-Save
- [ ] Auto-save triggers after 500ms
- [ ] Save status updates correctly
- [ ] Errors handled gracefully
- [ ] Data persists on refresh

### Collaboration
- [ ] Presence indicators show online users
- [ ] Focus indicators show field viewers
- [ ] Last edited tracking works
- [ ] Multi-user focus detection works

### Submission
- [ ] Submit button validation works
- [ ] Confirmation dialog appears
- [ ] Submission success flow works
- [ ] Submitted decisions are immutable

### Access Control
- [ ] Students can access their company decisions
- [ ] Teachers have read-only access
- [ ] Unauthenticated users redirected
- [ ] Cross-company access blocked

### UI/UX
- [ ] Dark mode works
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Accessibility features present

---

## Bug Report Template

If you find issues, use this template:

```markdown
### Bug Report: [Brief Description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**

**Actual Result:**

**Environment:**
- Browser:
- Screen Size:
- User Role:

**Screenshots:**
(Paste screenshots here)
```

---

## Sign-Off

**Tester Name:** _______________

**Date:** _______________

**Overall Status:** ✅ PASS / ❌ FAIL

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

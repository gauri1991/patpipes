# Narrow & Deep — Development Philosophy

Apply the following principles to the current task before writing any code.

## The Core Rule
Build fewer things, but build each one completely. Every feature that exists must work end-to-end. If it can't be completed now, it does not appear in the UI.

---

## Before Starting Any Task

**1. Audit what already exists**
- Search for existing components, hooks, or API methods that do the same or similar thing
- If one exists and is broken, fix it — do not create a parallel version
- If one exists and works, extend it — do not duplicate it

**2. Define the single responsibility**
- State in one sentence what this component / endpoint / function does
- If the sentence needs "and", split into two things and question whether both are needed

**3. Eliminate before you add**
- Remove stubs, Coming Soon placeholders, and setTimeout mocks before adding anything new
- Dead imports, unused props, and unreachable code are deleted, not commented out

---

## While Building

**Actions must be real**
- Every button, form submit, and link must call a real backend endpoint or navigate to a real route
- No fake delays (`setTimeout`), no hardcoded mock arrays, no `localStorage` standing in for a backend
- If the backend endpoint doesn't exist yet, the UI element doesn't exist yet either

**Three states, always**
- Loading: skeleton or spinner while data is in flight
- Empty: a clear message + a single call-to-action when there is no data
- Error: a human-readable message + a retry action when the request fails
- Never leave any of these three states blank or silent

**Maximum 3 user actions per surface**
- A tab, panel, or card should offer at most 3 distinct actions a user can complete
- If more are needed, they belong in a sub-view or a dedicated page, not crammed into the current surface

---

## Definition of Done

A task is complete when:
1. The full user action works: click → loading → success/error feedback
2. All three states (loading, empty, error) are handled visibly
3. No stubs or mocks remain in the code path
4. TypeScript compiles clean (`npm run type-check`)
5. No new dead code was introduced

A task is NOT done if:
- The happy path works but error/empty states are missing
- A related stub was left in place while the new feature was added next to it
- The component fetches data the parent already has

---

## Invocation

Run this skill at the start of any feature, fix, or improvement task. Work through the checklist above before proposing or writing any code. If the task violates any principle, flag it and propose the minimal correction first.

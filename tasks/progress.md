# Machar — Progress

- **Status:** active
- **Current Phase:** P2 — the app a parent can open
- **Active Story:** P2 review (PR #2), then the Ministry fidelity check
- **Last Completed Story:** P2 initial — Swift calendar engine + SwiftUI onboarding, tomorrow card, month grid
- **Next Recommended Story:** Ministry fidelity check on the 2026-27 calendar (Task 8, step 4)
- **Blockers:** none technical. The fidelity check is a human reading task and gates anyone beyond the founder's family using the app.
- **Last Validation:** 2026-08-30 — `swift test` 18/18; `xcodebuild` BUILD SUCCEEDED; app run on an iPhone 17 simulator, September 2026 verified correct against the real calendar.
- **Last Updated:** 2026-08-30

## Log

### 2026-08-30
P1 merged (PR #1) after 11 days open. P2 opened (PR #2): the calendar engine
ported to Swift with mirrored tests, a SwiftUI app with onboarding, a tomorrow
card and a month grid, and a generator that keeps the iOS school-year bundle
derived from the TypeScript source of truth. Local-only storage by choice;
Supabase sync is P4.

### 2026-08-17
P1 built: schema, RLS, events, registry parser, calendar engine, household
creation, month view model, 2026-27 calendar transcription.

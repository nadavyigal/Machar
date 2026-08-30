# Machar: Progress

- **Status:** active
- **Current Phase:** P2 - the app a parent can open
- **Active Story:** MCH-01 story 4 - install on the founder's iPhone
- **Last Completed Story:** Ministry fidelity check signed off 2026-08-30 - the gate is open
- **Next Recommended Story:** install on the founder's iPhone (needs DEVELOPMENT_TEAM set in Xcode), then two weeks of real use before any P3 work
- **Blockers:** device install is blocked on signing - `DEVELOPMENT_TEAM` is unset in `ios/Machar.xcodeproj` and the paired iPhone is offline.
- **Last Validation:** 2026-08-30 - `swift test` 18/18 (needs `--scratch-path`, see lessons); `xcodebuild` BUILD SUCCEEDED; `pnpm lint` clean; `pnpm vitest run src/lib/calendar` 44/44. `pnpm test` overall FAILS: 3 Supabase-dependent files cannot construct a client with no local Supabase running (50 pure tests pass). Simulator: rename, delete, add, level change all verified and persisted; 2026-09-14 shows the school child on צום גדליה while the gan child is on an ordinary day.
- **Last Updated:** 2026-08-30

## Log

### 2026-08-30 (MCH-01)
Work packet MCH-01 stories 1-3. Story 1: `scripts/printSchoolYear.mjs` generates
`docs/fidelity-check-2026-2027.md`, a chronological Hebrew checklist of all 9
closures (45 calendar days) and 4 short days with the weekday for every date, the
four data-file caveats, and the four deliberately-excluded commemorative days.
Nothing is ticked; the founder ticks it. Story 2: `HouseholdSettingsView` behind a
gear on the calendar screen, with `HouseholdStore.update`, so a name, level or
week pattern can be fixed and a child added or deleted without reinstalling.
Story 3: `DayDetailView`, a sheet on tapping any day in the month grid, showing
each child with their status and the Hebrew reason from the Ministry data.
Story 4 (install on the iPhone) is the founder's and is not done.

Found: `ios/MacharCore/.build` is committed despite being gitignored, which
breaks `swift test` in any worktree. Recorded in lessons and roadmap debt; not
fixed here, because untracking it is a 2,426-file diff outside this packet.

### 2026-08-30
P1 merged (PR #1) after 11 days open. P2 opened (PR #2): the calendar engine
ported to Swift with mirrored tests, a SwiftUI app with onboarding, a tomorrow
card and a month grid, and a generator that keeps the iOS school-year bundle
derived from the TypeScript source of truth. Local-only storage by choice;
Supabase sync is P4.

### 2026-08-17
P1 built: schema, RLS, events, registry parser, calendar engine, household
creation, month view model, 2026-27 calendar transcription.
Last Updated: 2026-08-30

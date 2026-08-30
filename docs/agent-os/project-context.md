# Machar: Project Context

Last updated: 2026-08-30

## What this is

Hebrew iOS app answering "what does my family need tomorrow" from the Israeli
school calendar, resolved per child. Personal-value first: the founder's own
family is the user for version one.

Status: P1 (backend spine) merged. P2 (SwiftUI app) in review as PR #2.

## Layout

| Path | What |
|---|---|
| `src/lib/calendar/` | TypeScript calendar engine and the school-year data. **Source of truth for the calendar.** |
| `src/lib/household/`, `src/lib/institutions/` | Household creation, Ministry registry parser |
| `supabase/migrations/` | Schema and RLS. RLS is the security boundary, not application code. |
| `ios/MacharCore/` | Swift port of the calendar engine + bundled school-year JSON |
| `ios/Machar/` | SwiftUI app |
| `ios/Machar.xcodeproj` | App project; uses a file-system-synchronized group, so adding a file to `ios/Machar/` is enough |
| `scripts/exportSchoolYear.mjs` | Regenerates the iOS bundle from the TypeScript data |
| `tests/rls/`, `tests/db/` | Adversarial database tests; need a running local Supabase |

## Stack

Next.js 16 + Supabase (Postgres, RLS) + Vitest for the data/backend workspace.
SwiftUI + Swift Package Manager, iOS 17+, Swift 6 for the app. No third-party
Swift dependencies.

## Rules specific to this repo

1. **The calendar data is never hand-edited in two places.** Edit
   `src/lib/calendar/data/*.ts`, then run `node scripts/exportSchoolYear.mjs`.
2. **The Swift and TypeScript engines are one contract.** A behaviour change
   lands in both, with the matching test in both.
3. **RLS is the security boundary.** Never move an isolation rule into
   application code, and never assert a policy works by reading the SQL - probe
   it with a real second household.
4. **The Ministry data is not verified.** Until the step-4 fidelity check is
   done, no one outside the founder's family uses this app.
5. **Dates are ISO `YYYY-MM-DD` strings end to end.** Do not introduce
   `Date`/timezone handling into calendar logic on either side.

## Commands

```bash
pnpm test                                  # TypeScript unit + RLS/db tests
pnpm lint
node scripts/exportSchoolYear.mjs          # regenerate the iOS school-year bundle
cd ios/MacharCore && swift test            # Swift engine tests
cd ios && xcodebuild -scheme Machar -destination 'generic/platform=iOS Simulator' build
```

The RLS and db tests need `supabase start` and a populated `.env.local`.

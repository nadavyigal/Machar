# Institution registry & school calendar runbook

## National school-year calendar (תשפ"ז / 2026-27)

`src/lib/calendar/data/2026-2027.ts` transcribes the Ministry of Education's
תשפ"ז school-year calendar (הודעה מס' 0363, published 30 March 2026) into the
`SchoolYear` shape from `src/lib/calendar/types.ts`.

- **Source:** https://apps.education.gov.il/mankal/Hodaa.aspx?siduri=362 —
  Ministry of Education חוזרי מנכ"ל (director-general circulars), the primary
  publication channel. See the file's header comment for the full source
  citation and known caveats (the `school` term end date models elementary,
  not middle/high; a `kippur_sukkot_bridge` closure key not in the Ministry's
  named-holiday list; two year-typos in the source circular resolved to 2027).
- **Consumed by:** `resolveDay.ts` and `validateSchoolYear.ts` (Task 7).
- **Seeded into the DB by:** `scripts/seedNationalEvents.ts`, run via
  `pnpm seed:calendar` (requires `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`). Idempotent: matches existing
  `national`-scope events by `external_key` (`${label}:closure:${key}` /
  `${label}:short:${key}`) and updates in place rather than duplicating, since
  the `events_national_key` unique index is partial (`where scope =
  'national'`) and can't be targeted by a plain PostgREST `upsert(onConflict:
  ...)` call — see the comment in `seedNationalEvents.ts` for why.
- **Status:** internal self-consistency verified by
  `src/lib/calendar/data/2026-2027.test.ts` (automated). The human fidelity
  check against the live Ministry circular (Step 4 of the Task 8 brief) has
  **not** been done — do not treat this data as verified until someone reads
  it side by side with the published page.

## Institution registry dataset (`data/institutions.raw.csv`)

Gitignored (`data/`), reacquire via the Ministry of Education `mosdot`
dataset on data.gov.il (CKAN datastore API, resource id
`5548fd63-5868-4053-ad81-98caddc5e232`) rather than committing it. As of the
last pull (2026-08-17) the dataset's row-level `שנה` values only go up to
2015 despite a 2026 "last updated" portal timestamp — treat it as a stale
historical baseline, not a current institution snapshot, until a newer
Ministry source is found.

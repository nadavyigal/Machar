# Machar — Lessons

## The plan lived only in a PR description

P1's task list existed nowhere in the repo. For 11 days the only record of what
"P1" meant was the body of PR #1. Write the plan into `docs/plan/` as it is
decided, not after.

## Swift will not decode an enum-keyed dictionary from a JSON object

`[SchoolLevel: Term]` looks like the natural port of `Record<SchoolLevel, Term>`,
but Swift encodes a dictionary as a JSON object only for `String`/`Int` keys or
keys conforming to `CodingKeyRepresentable`. Anything else uses an unkeyed
container and fails against a normal JSON object. Use an explicit struct.

## PostgREST returns `error: null` when RLS filters an UPDATE or DELETE to zero rows

Only INSERT raises `42501`. A test asserting on `error` for UPDATE/DELETE cannot
fail. Assert on returned rows.

## A shape-only date regex fails open

`2026-11-31` matched `\d{4}-\d{2}-\d{2}` and `Date.parse` rolled it forward to
December 1 without complaint. Validate day-of-month against the actual month.

## Check-then-act in a SECURITY DEFINER function is a race, not a guard

`create_household`'s "already belongs to a household" check was reproducible as a
double-insert under concurrent calls. The guard has to be a unique constraint;
the friendly error message is a `unique_violation` handler on top of it.

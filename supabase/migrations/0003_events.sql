create type event_scope as enum ('national', 'institution', 'class', 'household');
create type event_kind as enum ('closure', 'short_day', 'term_boundary', 'appointment', 'deadline', 'requirement', 'announcement');

create table events (
  id uuid primary key default gen_random_uuid(),
  scope event_scope not null,
  institution_id uuid references institutions(id) on delete cascade,
  class_ref text,
  household_id uuid references households(id) on delete cascade,
  applies_to_types institution_type[],
  title text not null,
  kind event_kind not null,
  starts_on date not null,
  ends_on date,
  contributed_by uuid references auth.users(id) on delete set null,
  external_key text,
  created_at timestamptz not null default now(),

  constraint scope_shape check (
    (scope = 'national'    and institution_id is null and household_id is null and class_ref is null)
 or (scope = 'institution' and institution_id is not null and household_id is null and class_ref is null)
 or (scope = 'class'       and institution_id is not null and household_id is null and class_ref is not null)
 or (scope = 'household'   and institution_id is null and household_id is not null and class_ref is null)
  ),
  constraint ends_after_starts check (ends_on is null or ends_on >= starts_on)
);

-- external_key makes national seeding idempotent across re-runs
create unique index events_national_key on events (external_key) where scope = 'national';
create index events_household_idx on events (household_id, starts_on);
create index events_institution_idx on events (institution_id, class_ref, starts_on);

create type member_role as enum ('adult', 'child');
create type institution_type as enum ('gan', 'elementary', 'middle', 'high', 'tzaharon', 'chug');
create type week_pattern as enum ('five_day', 'six_day');

create table households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  role member_role not null,
  first_name text not null,
  birth_year int,
  created_at timestamptz not null default now(),
  constraint child_has_birth_year check (role <> 'child' or birth_year is not null),
  constraint adult_has_no_birth_year check (role <> 'adult' or birth_year is null),
  constraint birth_year_plausible check (birth_year is null or (birth_year between 2005 and 2030))
);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  semel text unique,
  type institution_type not null,
  name text not null,
  city text,
  week_pattern week_pattern not null default 'five_day',
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  institution_id uuid not null references institutions(id) on delete restrict,
  class_ref text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (member_id, institution_id, class_ref)
);

create index enrollments_institution_idx on enrollments (institution_id, class_ref) where active;
create index members_household_idx on members (household_id);

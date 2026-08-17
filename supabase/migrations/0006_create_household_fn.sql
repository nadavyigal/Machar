create function create_household(
  p_display_name text,
  p_adults jsonb,
  p_children jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_member_id uuid;
  v_child jsonb;
  v_adult jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'user already belongs to a household';
  end if;

  insert into households (display_name) values (p_display_name) returning id into v_household_id;
  insert into household_members (household_id, user_id) values (v_household_id, auth.uid());

  for v_adult in select * from jsonb_array_elements(p_adults) loop
    insert into members (household_id, role, first_name)
    values (v_household_id, 'adult', v_adult ->> 'firstName');
  end loop;

  for v_child in select * from jsonb_array_elements(p_children) loop
    insert into members (household_id, role, first_name, birth_year)
    values (v_household_id, 'child', v_child ->> 'firstName', (v_child ->> 'birthYear')::int)
    returning id into v_member_id;

    insert into enrollments (member_id, institution_id, class_ref)
    values (v_member_id, (v_child ->> 'institutionId')::uuid, nullif(v_child ->> 'classRef', ''));
  end loop;

  return v_household_id;
end;
$$;

revoke execute on function create_household(text, jsonb, jsonb) from public;
grant execute on function create_household(text, jsonb, jsonb) to authenticated;

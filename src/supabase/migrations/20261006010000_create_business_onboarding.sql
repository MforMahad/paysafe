create or replace function public.create_initial_business(
  p_legal_name text,
  p_display_name text,
  p_slug text
)
returns public.businesses
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid;
  v_business public.businesses;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_legal_name), '') is null then
    raise exception 'Legal business name is required';
  end if;

  if nullif(trim(p_display_name), '') is null then
    raise exception 'Display name is required';
  end if;

  if nullif(trim(p_slug), '') is null then
    raise exception 'Workspace slug is required';
  end if;

  if exists (
    select 1
    from public.memberships
    where user_id = v_user_id
      and status = 'active'
  ) then
    raise exception 'User already belongs to an active business';
  end if;

  insert into public.businesses (
    legal_name,
    display_name,
    slug
  )
  values (
    trim(p_legal_name),
    trim(p_display_name),
    lower(trim(p_slug))
  )
  returning * into v_business;

  insert into public.memberships (
    user_id,
    business_id,
    role,
    status
  )
  values (
    v_user_id,
    v_business.id,
    'admin',
    'active'
  );

  update public.users
  set
    last_accessed_business_id = v_business.id,
    updated_at = now()
  where id = v_user_id;

  return v_business;
end;
$$;

revoke execute on function public.create_initial_business(text, text, text)
from public;

grant execute on function public.create_initial_business(text, text, text)
to authenticated;
create or replace function public.is_system_empty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.user_roles where role = 'admin');
$$;

revoke all on function public.is_system_empty() from public;
grant execute on function public.is_system_empty() to anon, authenticated;
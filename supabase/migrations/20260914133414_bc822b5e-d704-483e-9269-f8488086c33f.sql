create or replace function public.is_system_empty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from auth.users);
$$;

revoke all on function public.is_system_empty() from public;
grant execute on function public.is_system_empty() to anon, authenticated;

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'flaviojece@gmail.com'
on conflict (user_id, role) do nothing;
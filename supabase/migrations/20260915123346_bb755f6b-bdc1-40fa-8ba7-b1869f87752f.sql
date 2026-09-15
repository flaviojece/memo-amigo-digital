drop policy if exists "Admins can manage all medications" on public.medications;
drop policy if exists "Admins can view all medications" on public.medications;
drop policy if exists "Admins can manage all medication logs" on public.medication_logs;
drop policy if exists "Admins can view all medication logs" on public.medication_logs;
drop policy if exists "Admins can manage all appointments" on public.appointments;
drop policy if exists "Admins can view all appointments" on public.appointments;
drop policy if exists "Admins can manage all emergency contacts" on public.emergency_contacts;
drop policy if exists "Admins can manage all emergency activations" on public.emergency_activations;
drop policy if exists "Admins can view all activations" on public.emergency_activations;
drop policy if exists "Admins can manage all suggestions" on public.suggestions;
drop policy if exists "Admins can manage all notification schedules" on public.notification_schedules;
drop policy if exists "Admins can manage all notification preferences"
  on public.guardian_notification_preferences;
drop policy if exists "Admins can manage all location history" on public.location_history;
drop policy if exists "Admins can view all location history" on public.location_history;
drop policy if exists "Admins can manage all live locations" on public.live_locations;
drop policy if exists "Admins can view all live locations" on public.live_locations;

create or replace function public.admin_patient_counts()
returns table (
  patient_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  medications_count integer,
  appointments_count integer,
  angels_count integer,
  is_sharing_location boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    (select count(*)::integer from public.medications m
      where m.user_id = p.id and m.active),
    (select count(*)::integer from public.appointments a
      where a.user_id = p.id),
    (select count(*)::integer from public.guardian_relationships g
      where g.patient_id = p.id and g.status = 'active'),
    coalesce((select s.is_sharing from public.location_sharing_settings s
      where s.user_id = p.id), false)
  from public.profiles p
  where exists (
    select 1 from public.guardian_relationships gr
    where gr.patient_id = p.id and gr.status = 'active'
  );
end;
$$;

revoke all on function public.admin_patient_counts() from public;
grant execute on function public.admin_patient_counts() to authenticated;

create or replace function public.admin_live_locations()
returns table (
  user_id uuid,
  full_name text,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores';
  end if;

  insert into public.audit_logs (user_id, action_type, details)
  values (
    auth.uid(),
    'admin_viewed_locations',
    jsonb_build_object('em', now())
  );

  return query
  select l.user_id, p.full_name, l.latitude, l.longitude, l.updated_at
  from public.live_locations l
  join public.profiles p on p.id = l.user_id
  join public.location_sharing_settings s on s.user_id = l.user_id
  where s.is_sharing;
end;
$$;

revoke all on function public.admin_live_locations() from public;
grant execute on function public.admin_live_locations() to authenticated;
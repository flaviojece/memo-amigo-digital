-- ============================================================
-- Privilégio mínimo do admin sobre dados clínicos (LGPD)
-- ============================================================
-- O painel de admin só exibe CONTAGENS (quantos remédios, consultas, anjos)
-- e o mapa de quem está compartilhando localização. Mas as policies davam
-- FOR ALL sobre todo o conteúdo clínico: o admin podia ler e alterar o
-- prontuário de qualquer paciente, sem deixar rastro.
--
-- Aqui o acesso é reduzido ao que a interface realmente usa, e o que sobra
-- passa por função que registra em audit_logs.

-- 1. Remove o acesso amplo às tabelas clínicas ----------------
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

-- O admin continua com acesso ao que é administrativo, não clínico:
-- profiles, user_roles, guardian_relationships, guardian_invitations e audit_logs
-- mantêm as policies existentes.

-- 2. Contagens para o painel, sem expor o conteúdo ------------
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

-- 3. Mapa de localização: acesso registrado -------------------
-- Postgres não tem trigger de SELECT, então a única forma de auditar leitura
-- é obrigá-la a passar por uma função. Cada consulta ao mapa fica registrada.
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

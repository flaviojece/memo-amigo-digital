-- lovable-cron-fallback-reviewed: 144 runs/day; o anjo precisa ser avisado poucos minutos após o atraso da dose; não há evento no banco que dispare a passagem do horário
alter table public.medications
  add column if not exists stock_quantity integer,
  add column if not exists stock_alert_at integer not null default 7;

comment on column public.medications.stock_quantity is
  'Doses restantes na cartela/frasco. Null = o paciente não controla estoque deste remédio.';
comment on column public.medications.stock_alert_at is
  'Avisa quando as doses restantes chegarem a este número.';

create or replace function public.decrement_stock_on_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'taken' then
    update public.medications
       set stock_quantity = greatest(0, stock_quantity - 1)
     where id = new.medication_id
       and stock_quantity is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_decrement_stock on public.medication_logs;
create trigger trg_decrement_stock
  after insert on public.medication_logs
  for each row execute function public.decrement_stock_on_log();

alter table public.appointments
  add column if not exists preparation text,
  add column if not exists reminder_24h_sent boolean not null default false;

comment on column public.appointments.preparation is
  'O que levar ou fazer antes: exames, jejum, documentos.';

alter table public.guardian_notification_preferences
  add column if not exists quiet_hours_start time not null default '22:00',
  add column if not exists quiet_hours_end time not null default '07:00',
  add column if not exists escalate_after_minutes integer not null default 30;

comment on column public.guardian_notification_preferences.escalate_after_minutes is
  'Minutos sem confirmação até avisar o anjo. Zero desliga o escalonamento.';

create or replace function public.registrar_doses_perdidas()
returns table (
  patient_id uuid,
  medication_id uuid,
  medication_name text,
  horario text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  agora timestamptz := now();
begin
  return query
  with previstas as (
    select
      m.user_id as patient_id,
      m.id as medication_id,
      m.name as medication_name,
      t.horario,
      ((current_date::text || ' ' || t.horario)::timestamp
        at time zone 'America/Sao_Paulo') as momento,
      coalesce(
        (select min(p.escalate_after_minutes)
           from public.guardian_notification_preferences p
          where p.patient_id = m.user_id
            and p.enabled
            and p.notify_medication_missed
            and p.escalate_after_minutes > 0),
        0
      ) as atraso_minutos
    from public.medications m
    cross join lateral jsonb_array_elements_text(m.times) as t(horario)
    where m.active
      and m.start_date::date <= current_date
      and (m.end_date is null or m.end_date::date >= current_date)
  ),
  vencidas as (
    select *
    from previstas
    where atraso_minutos > 0
      and agora >= momento + (atraso_minutos || ' minutes')::interval
      and agora <= momento + interval '12 hours'
      and not exists (
        select 1 from public.medication_logs l
        where l.medication_id = previstas.medication_id
          and l.scheduled_time = previstas.momento
      )
  ),
  inseridas as (
    insert into public.medication_logs
      (medication_id, user_id, scheduled_time, status)
    select v.medication_id, v.patient_id, v.momento, 'missed'
    from vencidas v
    on conflict do nothing
    returning medication_id, user_id, scheduled_time
  )
  select v.patient_id, v.medication_id, v.medication_name, v.horario
  from vencidas v
  join inseridas i
    on i.medication_id = v.medication_id
   and i.scheduled_time = v.momento;
end;
$$;

revoke all on function public.registrar_doses_perdidas() from public;

create or replace function public.consultas_de_amanha()
returns table (
  appointment_id uuid,
  patient_id uuid,
  doctor_name text,
  specialty text,
  data timestamptz,
  location text,
  preparation text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select a.id, a.user_id, a.doctor_name, a.specialty,
         a.date, a.location, a.preparation
  from public.appointments a
  where not a.reminder_24h_sent
    and coalesce(a.status, 'scheduled') = 'scheduled'
    and (a.date at time zone 'America/Sao_Paulo')::date = (current_date + 1);
end;
$$;

revoke all on function public.consultas_de_amanha() from public;

create unique index if not exists uq_medication_logs_dose
  on public.medication_logs (medication_id, scheduled_time);

select cron.unschedule('check-missed-doses')
  where exists (select 1 from cron.job where jobname = 'check-missed-doses');

select cron.schedule(
  'check-missed-doses',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://qxuiymmzjptpczodbvmm.supabase.co/functions/v1/check-missed-doses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
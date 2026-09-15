alter table public.medications
  add column if not exists photo_url text;

drop policy if exists "Dono vê suas fotos de medicamento" on storage.objects;
create policy "Dono vê suas fotos de medicamento"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_guardian_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "Dono envia suas fotos de medicamento" on storage.objects;
create policy "Dono envia suas fotos de medicamento"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medication-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Dono atualiza suas fotos de medicamento" on storage.objects;
create policy "Dono atualiza suas fotos de medicamento"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Dono apaga suas fotos de medicamento" on storage.objects;
create policy "Dono apaga suas fotos de medicamento"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medication-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create index if not exists idx_medication_logs_user_scheduled
  on public.medication_logs (user_id, scheduled_time desc);

create or replace function public.get_adherence_by_day(
  _patient_id uuid,
  _days integer default 30
)
returns table (
  dia date,
  previstas integer,
  tomadas integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or (auth.uid() <> _patient_id
         and not public.is_guardian_of(auth.uid(), _patient_id)) then
    raise exception 'Sem permissão para ver a adesão deste paciente';
  end if;

  if _days < 1 or _days > 365 then
    raise exception 'Período inválido: use entre 1 e 365 dias';
  end if;

  return query
  with dias as (
    select generate_series(
      (current_date - (_days - 1))::date,
      current_date,
      interval '1 day'
    )::date as dia
  ),
  previsto as (
    select d.dia, count(*)::integer as qtd
    from dias d
    join public.medications m
      on m.user_id = _patient_id
     and m.start_date::date <= d.dia
     and (m.end_date is null or m.end_date::date >= d.dia)
    cross join lateral jsonb_array_elements_text(m.times) as t(horario)
    group by d.dia
  ),
  confirmado as (
    select
      (l.scheduled_time at time zone 'America/Sao_Paulo')::date as dia,
      count(*)::integer as qtd
    from public.medication_logs l
    where l.user_id = _patient_id
      and l.status = 'taken'
      and l.scheduled_time >= (current_date - (_days - 1))
    group by 1
  )
  select
    d.dia,
    coalesce(p.qtd, 0) as previstas,
    coalesce(c.qtd, 0) as tomadas
  from dias d
  left join previsto p on p.dia = d.dia
  left join confirmado c on c.dia = d.dia
  order by d.dia;
end;
$$;

revoke all on function public.get_adherence_by_day(uuid, integer) from public;
grant execute on function public.get_adherence_by_day(uuid, integer) to authenticated;

create or replace function public.get_adherence_by_medication(
  _patient_id uuid,
  _days integer default 30
)
returns table (
  medication_id uuid,
  nome text,
  dosagem text,
  previstas integer,
  tomadas integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or (auth.uid() <> _patient_id
         and not public.is_guardian_of(auth.uid(), _patient_id)) then
    raise exception 'Sem permissão para ver a adesão deste paciente';
  end if;

  if _days < 1 or _days > 365 then
    raise exception 'Período inválido: use entre 1 e 365 dias';
  end if;

  return query
  select
    m.id as medication_id,
    m.name as nome,
    coalesce(m.dosage, '') as dosagem,
    (
      jsonb_array_length(m.times)
      * greatest(
          0,
          (least(current_date, coalesce(m.end_date::date, current_date))
           - greatest(m.start_date::date, current_date - (_days - 1))
           + 1)
        )
    )::integer as previstas,
    (
      select count(*)
      from public.medication_logs l
      where l.medication_id = m.id
        and l.status = 'taken'
        and l.scheduled_time >= (current_date - (_days - 1))
    )::integer as tomadas
  from public.medications m
  where m.user_id = _patient_id
    and m.start_date::date <= current_date
    and (m.end_date is null or m.end_date::date >= current_date - (_days - 1))
  order by m.name;
end;
$$;

revoke all on function public.get_adherence_by_medication(uuid, integer) from public;
grant execute on function public.get_adherence_by_medication(uuid, integer) to authenticated;
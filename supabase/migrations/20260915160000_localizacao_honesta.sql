-- ============================================================
-- Localização: status real, retenção e transparência
-- ============================================================

-- 1. Saber QUANDO o rastreamento parou ------------------------
-- Sem isso o anjo vê um marcador antigo sem saber que ele congelou.
alter table public.location_sharing_settings
  add column if not exists tracking_active boolean not null default false,
  add column if not exists tracking_started_at timestamptz,
  add column if not exists tracking_stopped_at timestamptz,
  add column if not exists tracking_stopped_reason text,
  add column if not exists retention_days integer not null default 30;

comment on column public.location_sharing_settings.tracking_stopped_reason is
  'app_em_segundo_plano | desligado_pelo_usuario | permissao_negada';
comment on column public.location_sharing_settings.retention_days is
  'Dias que o histórico de localização é guardado antes de ser apagado.';

-- De onde veio a posição: rastreamento contínuo ou registro pontual
alter table public.live_locations
  add column if not exists source text not null default 'rastreamento';

comment on column public.live_locations.source is
  'rastreamento | abertura_app | remedio_confirmado | emergencia';

-- 2. Retenção do histórico (LGPD) -----------------------------
-- location_history crescia sem limite: até 1.440 linhas por dia por paciente,
-- guardadas para sempre. Dado pessoal sensível precisa de prazo definido.
create or replace function public.limpar_historico_localizacao()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removidos integer;
begin
  with prazos as (
    select s.user_id, coalesce(s.retention_days, 30) as dias
    from public.location_sharing_settings s
  ),
  apagados as (
    delete from public.location_history h
    using prazos p
    where h.user_id = p.user_id
      and h.recorded_at < now() - (p.dias || ' days')::interval
    returning h.id
  )
  select count(*) into removidos from apagados;

  -- Histórico de quem nunca configurou compartilhamento: prazo padrão
  delete from public.location_history h
  where not exists (
    select 1 from public.location_sharing_settings s where s.user_id = h.user_id
  )
  and h.recorded_at < now() - interval '30 days';

  return removidos;
end;
$$;

revoke all on function public.limpar_historico_localizacao() from public;

select cron.unschedule('limpar-historico-localizacao')
  where exists (select 1 from cron.job where jobname = 'limpar-historico-localizacao');

select cron.schedule(
  'limpar-historico-localizacao',
  '30 3 * * *',
  $$ select public.limpar_historico_localizacao(); $$
);

-- 3. Transparência: quem olhou, e quando ----------------------
-- Quem é observado tem direito de saber quando foi observado.
-- Postgres não tem trigger de SELECT, então a leitura do mapa passa por aqui.
create or replace function public.registrar_visualizacao_localizacao(_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_guardian_of(auth.uid(), _patient_id) then
    raise exception 'Sem permissão para ver a localização deste paciente';
  end if;

  insert into public.audit_logs (user_id, action_type, table_name, record_id, new_data)
  values (
    auth.uid(),
    'guardian_viewed_location',
    'live_locations',
    _patient_id,
    jsonb_build_object('patient_id', _patient_id)
  );
end;
$$;

revoke all on function public.registrar_visualizacao_localizacao(uuid) from public;
grant execute on function public.registrar_visualizacao_localizacao(uuid) to authenticated;

-- O paciente consulta quem olhou a localização dele
create or replace function public.minhas_visualizacoes_localizacao(_dias integer default 7)
returns table (
  anjo_nome text,
  visualizado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  return query
  select coalesce(p.full_name, 'Anjo'), a.created_at
  from public.audit_logs a
  left join public.profiles p on p.id = a.user_id
  where a.action_type = 'guardian_viewed_location'
    and a.record_id = auth.uid()
    and a.created_at >= now() - (_dias || ' days')::interval
  order by a.created_at desc
  limit 100;
end;
$$;

revoke all on function public.minhas_visualizacoes_localizacao(integer) from public;
grant execute on function public.minhas_visualizacoes_localizacao(integer) to authenticated;

-- O paciente precisa poder ler o próprio registro de visualizações.
-- A policy de audit_logs só permitia admin; a função acima é SECURITY DEFINER
-- e resolve isso sem abrir a tabela inteira.

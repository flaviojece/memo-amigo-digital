-- ============================================================
-- Auditoria de RLS — correções
-- ============================================================

-- 1. VAZAMENTO: push_subscriptions legível por qualquer usuário logado
-- ------------------------------------------------------------
-- A policy "Service role can read all subscriptions" usa USING (true) e não
-- tem cláusula TO, então vale para o papel `authenticated` também: qualquer
-- pessoa logada podia ler o endpoint e as chaves de push de todos os usuários.
-- A policy também era inútil: o service role ignora RLS por definição.
drop policy if exists "Service role can read all subscriptions" on public.push_subscriptions;

-- 2. INTEGRIDADE: qualquer usuário podia forjar registros de auditoria
-- ------------------------------------------------------------
-- WITH CHECK (true) para `authenticated` permitia inserir qualquer linha em
-- audit_logs — inclusive atribuindo ações a outra pessoa. Um log de auditoria
-- que qualquer um pode escrever não serve como log de auditoria.
-- As triggers que gravam são SECURITY DEFINER, então não precisam desta policy.
drop policy if exists "System can insert audit logs" on public.audit_logs;

create policy "Usuário só registra ações próprias"
  on public.audit_logs for insert
  to authenticated
  with check (user_id = auth.uid());

-- 3. Anjo não conseguia ver nada do paciente
-- ------------------------------------------------------------
-- A interface tem seletor de paciente para o anjo, mas não existia nenhuma
-- policy dando acesso de leitura — o anjo abria a tela e via lista vazia,
-- sem erro. Leitura apenas; alterar continua sendo pelo fluxo de sugestões,
-- que o paciente aprova.
create policy "Anjos veem medicamentos do paciente"
  on public.medications for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

create policy "Anjos veem histórico de doses do paciente"
  on public.medication_logs for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

create policy "Anjos veem consultas do paciente"
  on public.appointments for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

create policy "Anjos veem contatos de emergência do paciente"
  on public.emergency_contacts for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

-- O anjo precisa saber que houve uma emergência. Era o buraco mais
-- contraintuitivo: o botão avisa por push, mas o histórico ficava invisível.
create policy "Anjos veem emergências do paciente"
  on public.emergency_activations for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

-- 4. Sugestão podia ser criada em nome de outro anjo
-- ------------------------------------------------------------
-- O WITH CHECK validava o vínculo com o paciente, mas não que angel_id fosse
-- quem está inserindo. Um anjo podia atribuir a sugestão a outro anjo.
drop policy if exists "Angels can create suggestions for their patients" on public.suggestions;

create policy "Anjos criam sugestões em nome próprio"
  on public.suggestions for insert
  to authenticated
  with check (
    angel_id = auth.uid()
    and public.is_guardian_of(auth.uid(), patient_id)
    and status = 'pending'
  );

-- 5. Faltavam DELETEs que o usuário deveria ter sobre os próprios dados
-- ------------------------------------------------------------
create policy "Usuário apaga próprio histórico de doses"
  on public.medication_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuário apaga próprio histórico de localização"
  on public.location_history for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Anjo podia se desvincular? Não podia.
-- ------------------------------------------------------------
-- Só o paciente podia alterar o vínculo. Um anjo que não quer mais a
-- responsabilidade ficava preso a ela.
create policy "Anjo pode encerrar o próprio vínculo"
  on public.guardian_relationships for update
  to authenticated
  using (auth.uid() = guardian_id)
  with check (auth.uid() = guardian_id and status in ('revoked', 'suspended'));

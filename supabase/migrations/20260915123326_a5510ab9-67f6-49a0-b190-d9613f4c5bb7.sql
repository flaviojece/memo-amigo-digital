drop policy if exists "Service role can read all subscriptions" on public.push_subscriptions;

drop policy if exists "System can insert audit logs" on public.audit_logs;

create policy "Usuário só registra ações próprias"
  on public.audit_logs for insert
  to authenticated
  with check (user_id = auth.uid());

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

create policy "Anjos veem emergências do paciente"
  on public.emergency_activations for select
  to authenticated
  using (public.is_guardian_of(auth.uid(), user_id));

drop policy if exists "Angels can create suggestions for their patients" on public.suggestions;

create policy "Anjos criam sugestões em nome próprio"
  on public.suggestions for insert
  to authenticated
  with check (
    angel_id = auth.uid()
    and public.is_guardian_of(auth.uid(), patient_id)
    and status = 'pending'
  );

create policy "Usuário apaga próprio histórico de doses"
  on public.medication_logs for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuário apaga próprio histórico de localização"
  on public.location_history for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Anjo pode encerrar o próprio vínculo"
  on public.guardian_relationships for update
  to authenticated
  using (auth.uid() = guardian_id)
  with check (auth.uid() = guardian_id and status in ('revoked', 'suspended'));
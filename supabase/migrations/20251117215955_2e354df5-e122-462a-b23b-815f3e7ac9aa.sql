-- FASE 1 & 2: Estrutura de Banco de Dados e RLS Policies

-- Tabela de relacionamentos entre pacientes e cuidadores
create table public.guardian_relationships (
  id uuid primary key default gen_random_uuid(),
  
  -- Paciente sendo cuidado
  patient_id uuid not null references auth.users(id) on delete cascade,
  
  -- Cuidador/familiar
  guardian_id uuid not null references auth.users(id) on delete cascade,
  
  -- Nível de acesso
  access_level text not null default 'read_only' 
    check (access_level in ('read_only', 'full_access')),
  
  -- Status do relacionamento
  status text not null default 'active' 
    check (status in ('active', 'suspended', 'revoked')),
  
  -- Metadados
  relationship_type text,
  notes text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  revoked_at timestamp with time zone,
  revoked_by uuid references auth.users(id),
  
  -- Garantir único relacionamento ativo por par
  unique (patient_id, guardian_id)
);

-- Tabela de convites pendentes
create table public.guardian_invitations (
  id uuid primary key default gen_random_uuid(),
  
  -- Quem está convidando
  patient_id uuid not null references auth.users(id) on delete cascade,
  
  -- Email do convidado
  invited_email text not null,
  
  -- Se já aceitou, referência ao usuário
  guardian_id uuid references auth.users(id) on delete set null,
  
  -- Token único para validar o convite
  invitation_token text unique not null default gen_random_uuid()::text,
  
  -- Status
  status text not null default 'pending' 
    check (status in ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  
  -- Nível de acesso que será concedido
  access_level text not null default 'read_only',
  
  -- Tipo de relacionamento
  relationship_type text,
  message text,
  
  -- Datas importantes
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  responded_at timestamp with time zone,
  
  -- Apenas um convite pendente por email por paciente
  unique (patient_id, invited_email, status)
);

-- Índices para performance
create index idx_guardian_relationships_patient 
  on guardian_relationships(patient_id) where status = 'active';

create index idx_guardian_relationships_guardian 
  on guardian_relationships(guardian_id) where status = 'active';

create index idx_guardian_invitations_token 
  on guardian_invitations(invitation_token) where status = 'pending';

create index idx_guardian_invitations_patient 
  on guardian_invitations(patient_id);

-- Trigger para updated_at em guardian_relationships
create trigger update_guardian_relationships_updated_at
  before update on guardian_relationships
  for each row
  execute function update_emergency_contacts_updated_at();

-- Função para verificar se usuário é guardian
create or replace function public.is_guardian_of(_guardian_id uuid, _patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guardian_relationships
    where guardian_id = _guardian_id
      and patient_id = _patient_id
      and status = 'active'
  )
$$;

-- Função para obter pacientes de um guardian
create or replace function public.get_patients_for_guardian(_guardian_id uuid)
returns table (
  patient_id uuid,
  patient_name text,
  patient_email text,
  relationship_type text,
  access_level text,
  created_at timestamp with time zone
)
language sql
stable
security definer
set search_path = public
as $$
  select 
    gr.patient_id,
    p.full_name as patient_name,
    p.email as patient_email,
    gr.relationship_type,
    gr.access_level,
    gr.created_at
  from guardian_relationships gr
  join profiles p on p.id = gr.patient_id
  where gr.guardian_id = _guardian_id
    and gr.status = 'active'
  order by gr.created_at desc
$$;

-- RLS para guardian_relationships
alter table guardian_relationships enable row level security;

create policy "Patients can view their guardians"
  on guardian_relationships for select
  using (auth.uid() = patient_id);

create policy "Guardians can view their patients"
  on guardian_relationships for select
  using (auth.uid() = guardian_id);

create policy "Patients can create relationships"
  on guardian_relationships for insert
  with check (auth.uid() = patient_id);

create policy "Patients can update their relationships"
  on guardian_relationships for update
  using (auth.uid() = patient_id);

create policy "Admins can view all relationships"
  on guardian_relationships for select
  using (has_role(auth.uid(), 'admin'::app_role));

-- RLS para guardian_invitations
alter table guardian_invitations enable row level security;

create policy "Patients can view their invitations"
  on guardian_invitations for select
  using (auth.uid() = patient_id);

create policy "Patients can create invitations"
  on guardian_invitations for insert
  with check (auth.uid() = patient_id);

create policy "Patients can update their invitations"
  on guardian_invitations for update
  using (auth.uid() = patient_id);

create policy "Invited users can view their invitations"
  on guardian_invitations for select
  using (
    (select auth.jwt() ->> 'email') = invited_email 
    or auth.uid() = guardian_id
  );

create policy "Invited users can respond to invitations"
  on guardian_invitations for update
  using (
    (select auth.jwt() ->> 'email') = invited_email 
    or auth.uid() = guardian_id
  );

-- Atualizar RLS de Medications para guardians
create policy "Guardians can view patient medications"
  on medications for select
  using (
    exists (
      select 1 from guardian_relationships
      where patient_id = medications.user_id
        and guardian_id = auth.uid()
        and status = 'active'
    )
  );

-- Atualizar RLS de Appointments para guardians
create policy "Guardians can view patient appointments"
  on appointments for select
  using (
    exists (
      select 1 from guardian_relationships
      where patient_id = appointments.user_id
        and guardian_id = auth.uid()
        and status = 'active'
    )
  );

-- Atualizar RLS de Emergency Contacts para guardians
create policy "Guardians can view patient emergency contacts"
  on emergency_contacts for select
  using (
    exists (
      select 1 from guardian_relationships
      where patient_id = emergency_contacts.user_id
        and guardian_id = auth.uid()
        and status = 'active'
    )
  );

-- Atualizar RLS de Notification Schedules para guardians
create policy "Guardians can view patient notifications"
  on notification_schedules for select
  using (
    exists (
      select 1 from guardian_relationships
      where patient_id = notification_schedules.user_id
        and guardian_id = auth.uid()
        and status = 'active'
    )
  );
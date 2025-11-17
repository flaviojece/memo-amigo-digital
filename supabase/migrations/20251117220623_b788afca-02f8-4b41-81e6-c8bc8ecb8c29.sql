-- Criar tabela de preferências de notificação para guardians
CREATE TABLE public.guardian_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento guardian-paciente
  guardian_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  
  -- Preferências de notificação (todas ativas por padrão)
  enabled boolean NOT NULL DEFAULT true,
  
  -- Notificações de medicamentos
  notify_medication_taken boolean NOT NULL DEFAULT true,
  notify_medication_missed boolean NOT NULL DEFAULT true,
  notify_medication_upcoming boolean NOT NULL DEFAULT true,
  
  -- Notificações de consultas
  notify_appointment_created boolean NOT NULL DEFAULT true,
  notify_appointment_upcoming boolean NOT NULL DEFAULT true,
  notify_appointment_completed boolean NOT NULL DEFAULT false,
  notify_appointment_cancelled boolean NOT NULL DEFAULT false,
  
  -- Metadados
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Um registro único por par guardian-paciente
  UNIQUE (guardian_id, patient_id),
  
  -- Foreign keys (referenciando guardian_relationships)
  FOREIGN KEY (guardian_id, patient_id) 
    REFERENCES guardian_relationships(guardian_id, patient_id) 
    ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_guardian_notification_prefs_guardian 
  ON guardian_notification_preferences(guardian_id);

CREATE INDEX idx_guardian_notification_prefs_patient 
  ON guardian_notification_preferences(patient_id);

CREATE INDEX idx_guardian_notification_prefs_enabled 
  ON guardian_notification_preferences(enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE guardian_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Guardians podem ver e atualizar suas próprias preferências
CREATE POLICY "Guardians can view their own preferences"
  ON guardian_notification_preferences FOR SELECT
  USING (auth.uid() = guardian_id);

CREATE POLICY "Guardians can update their own preferences"
  ON guardian_notification_preferences FOR UPDATE
  USING (auth.uid() = guardian_id);

CREATE POLICY "Guardians can insert their own preferences"
  ON guardian_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = guardian_id);

-- Pacientes podem ver preferências relacionadas a eles
CREATE POLICY "Patients can view preferences about them"
  ON guardian_notification_preferences FOR SELECT
  USING (auth.uid() = patient_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_guardian_notification_prefs_updated_at
  BEFORE UPDATE ON guardian_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_contacts_updated_at();

-- Função para obter guardians que devem ser notificados
CREATE OR REPLACE FUNCTION public.get_guardians_to_notify(
  _patient_id uuid,
  _notification_type text
)
RETURNS TABLE (
  guardian_id uuid,
  guardian_email text,
  guardian_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gr.guardian_id,
    p.email as guardian_email,
    p.full_name as guardian_name
  FROM guardian_relationships gr
  JOIN profiles p ON p.id = gr.guardian_id
  LEFT JOIN guardian_notification_preferences gnp 
    ON gnp.guardian_id = gr.guardian_id 
    AND gnp.patient_id = gr.patient_id
  WHERE gr.patient_id = _patient_id
    AND gr.status = 'active'
    AND (gnp.enabled IS NULL OR gnp.enabled = true)
    AND (
      (_notification_type = 'medication_taken' AND (gnp.notify_medication_taken IS NULL OR gnp.notify_medication_taken = true)) OR
      (_notification_type = 'medication_missed' AND (gnp.notify_medication_missed IS NULL OR gnp.notify_medication_missed = true)) OR
      (_notification_type = 'medication_upcoming' AND (gnp.notify_medication_upcoming IS NULL OR gnp.notify_medication_upcoming = true)) OR
      (_notification_type = 'appointment_created' AND (gnp.notify_appointment_created IS NULL OR gnp.notify_appointment_created = true)) OR
      (_notification_type = 'appointment_upcoming' AND (gnp.notify_appointment_upcoming IS NULL OR gnp.notify_appointment_upcoming = true)) OR
      (_notification_type = 'appointment_completed' AND (gnp.notify_appointment_completed IS NULL OR gnp.notify_appointment_completed = true)) OR
      (_notification_type = 'appointment_cancelled' AND (gnp.notify_appointment_cancelled IS NULL OR gnp.notify_appointment_cancelled = true))
    )
$$;

-- Trigger para criar preferências padrão ao aceitar convite
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar preferências padrão quando um relacionamento é criado
  IF NEW.status = 'active' THEN
    INSERT INTO guardian_notification_preferences (
      guardian_id, 
      patient_id
    )
    VALUES (
      NEW.guardian_id,
      NEW.patient_id
    )
    ON CONFLICT (guardian_id, patient_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Adicionar trigger na tabela guardian_relationships
CREATE TRIGGER create_notification_preferences_on_relationship
  AFTER INSERT OR UPDATE ON guardian_relationships
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION create_default_notification_preferences();
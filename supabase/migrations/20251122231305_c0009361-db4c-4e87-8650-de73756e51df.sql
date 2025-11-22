-- Adicionar constraint unique para prevenir relacionamentos duplicados
-- Primeiro, limpar possíveis duplicatas existentes (mantém apenas o mais recente)
DELETE FROM guardian_relationships a
USING guardian_relationships b
WHERE a.id < b.id
  AND a.patient_id = b.patient_id
  AND a.guardian_id = b.guardian_id;

-- Adicionar constraint unique em (patient_id, guardian_id)
ALTER TABLE guardian_relationships
ADD CONSTRAINT unique_patient_guardian UNIQUE (patient_id, guardian_id);

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_guardian_relationships_status 
ON guardian_relationships(status) 
WHERE status = 'active';

-- Adicionar validação de expiração em convites (função helper)
CREATE OR REPLACE FUNCTION is_invitation_valid(invitation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM guardian_invitations
    WHERE id = invitation_id
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;
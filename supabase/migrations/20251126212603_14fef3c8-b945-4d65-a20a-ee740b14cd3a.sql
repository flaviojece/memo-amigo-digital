-- Remover foreign keys antigas que apontam para auth.users
ALTER TABLE guardian_relationships
DROP CONSTRAINT IF EXISTS guardian_relationships_guardian_id_fkey;

ALTER TABLE guardian_relationships
DROP CONSTRAINT IF EXISTS guardian_relationships_patient_id_fkey;

ALTER TABLE guardian_relationships
DROP CONSTRAINT IF EXISTS guardian_relationships_revoked_by_fkey;

-- Adicionar novas foreign keys apontando para profiles
ALTER TABLE guardian_relationships
ADD CONSTRAINT guardian_relationships_guardian_id_fkey
FOREIGN KEY (guardian_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE guardian_relationships
ADD CONSTRAINT guardian_relationships_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE guardian_relationships
ADD CONSTRAINT guardian_relationships_revoked_by_fkey
FOREIGN KEY (revoked_by) REFERENCES profiles(id) ON DELETE SET NULL;
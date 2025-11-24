-- Permitir que pacientes e anjos vejam os nomes uns dos outros
-- através da relação de guardian_relationships
CREATE POLICY "Guardians and patients can view each other profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM guardian_relationships gr
    WHERE 
      gr.status = 'active'
      AND (
        -- Anjo vendo perfil do paciente
        (gr.guardian_id = auth.uid() AND gr.patient_id = profiles.id)
        OR
        -- Paciente vendo perfil do anjo
        (gr.patient_id = auth.uid() AND gr.guardian_id = profiles.id)
      )
  )
);
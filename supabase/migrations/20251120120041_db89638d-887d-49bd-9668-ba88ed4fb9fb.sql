-- Permitir que pacientes deletem seus próprios convites
CREATE POLICY "Patients can delete their invitations"
ON guardian_invitations
FOR DELETE
USING (auth.uid() = patient_id);
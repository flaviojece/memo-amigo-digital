-- Create enum types for suggestions
CREATE TYPE suggestion_type AS ENUM (
  'medication_create',
  'medication_update',
  'medication_delete',
  'appointment_create',
  'appointment_update',
  'appointment_delete'
);

CREATE TYPE suggestion_status AS ENUM ('pending', 'approved', 'rejected');

-- Create suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  angel_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type and status
  type suggestion_type NOT NULL,
  status suggestion_status DEFAULT 'pending',
  
  -- Suggestion data (flexible JSON)
  suggestion_data JSONB NOT NULL,
  
  -- Reference to original item (for update/delete)
  target_medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  target_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Patient response
  patient_response TEXT,
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT valid_target_reference CHECK (
    (type IN ('medication_update', 'medication_delete') AND target_medication_id IS NOT NULL) OR
    (type IN ('appointment_update', 'appointment_delete') AND target_appointment_id IS NOT NULL) OR
    (type IN ('medication_create', 'appointment_create'))
  )
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Angels can create suggestions for their patients
CREATE POLICY "Angels can create suggestions for their patients"
  ON suggestions FOR INSERT
  WITH CHECK (
    is_guardian_of(auth.uid(), patient_id)
  );

-- Angels can view their suggestions
CREATE POLICY "Angels can view their suggestions"
  ON suggestions FOR SELECT
  USING (angel_id = auth.uid());

-- Patients can view suggestions about them
CREATE POLICY "Patients can view suggestions about them"
  ON suggestions FOR SELECT
  USING (patient_id = auth.uid());

-- Patients can update suggestions about them
CREATE POLICY "Patients can update suggestions about them"
  ON suggestions FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_suggestions_patient_id ON suggestions(patient_id);
CREATE INDEX idx_suggestions_angel_id ON suggestions(angel_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_patient_pending ON suggestions(patient_id, status) WHERE status = 'pending';

-- Trigger to update updated_at
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
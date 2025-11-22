-- Add admin policies to all tables for complete control

-- Profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Medications
CREATE POLICY "Admins can manage all medications"
  ON public.medications FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Medication Logs
CREATE POLICY "Admins can manage all medication logs"
  ON public.medication_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Appointments
CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Emergency Contacts
CREATE POLICY "Admins can manage all emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Emergency Activations
CREATE POLICY "Admins can manage all emergency activations"
  ON public.emergency_activations FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Guardian Relationships
CREATE POLICY "Admins can manage all guardian relationships"
  ON public.guardian_relationships FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Guardian Invitations
CREATE POLICY "Admins can manage all guardian invitations"
  ON public.guardian_invitations FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Guardian Notification Preferences
CREATE POLICY "Admins can manage all notification preferences"
  ON public.guardian_notification_preferences FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Live Locations
CREATE POLICY "Admins can view all live locations"
  ON public.live_locations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all live locations"
  ON public.live_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Location History
CREATE POLICY "Admins can view all location history"
  ON public.location_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all location history"
  ON public.location_history FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Location Sharing Settings
CREATE POLICY "Admins can manage all location sharing settings"
  ON public.location_sharing_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Notification Schedules
CREATE POLICY "Admins can manage all notification schedules"
  ON public.notification_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Suggestions
CREATE POLICY "Admins can manage all suggestions"
  ON public.suggestions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create function to get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_patients', (SELECT COUNT(DISTINCT patient_id) FROM guardian_relationships),
    'total_angels', (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'angel'),
    'total_medications', (SELECT COUNT(*) FROM medications WHERE active = true),
    'total_appointments', (SELECT COUNT(*) FROM appointments WHERE status != 'cancelled'),
    'total_emergency_contacts', (SELECT COUNT(*) FROM emergency_contacts),
    'active_location_sharing', (SELECT COUNT(*) FROM location_sharing_settings WHERE is_sharing = true),
    'pending_invitations', (SELECT COUNT(*) FROM guardian_invitations WHERE status = 'pending'),
    'recent_emergencies', (SELECT COUNT(*) FROM emergency_activations WHERE status = 'active')
  ) INTO stats;
  
  RETURN stats;
END;
$$;
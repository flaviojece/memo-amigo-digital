import { useGuardianRelationships } from '@/hooks/useGuardianRelationships';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
}

export const PatientSelector = ({ selectedPatientId, onSelectPatient }: PatientSelectorProps) => {
  const { patients, loading } = useGuardianRelationships();

  if (loading || patients.length === 0) return null;

  return (
    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Visualizando dados de:</span>
      </div>
      <Select
        value={selectedPatientId || 'mine'}
        onValueChange={(value) => onSelectPatient(value === 'mine' ? null : value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mine">Meus próprios dados</SelectItem>
          {patients.map((patient) => (
            <SelectItem key={patient.patient_id} value={patient.patient_id}>
              {patient.patient_name} ({patient.relationship_type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

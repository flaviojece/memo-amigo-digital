import { useGuardianRelationships } from '@/hooks/useGuardianRelationships';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PatientSelectorCompactProps {
  selectedPatientId: string | null;
  onSelect: (patientId: string) => void;
}

export function PatientSelectorCompact({ selectedPatientId, onSelect }: PatientSelectorCompactProps) {
  const { patients, loading } = useGuardianRelationships();

  if (loading) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground animate-pulse" />
          <span className="text-senior-sm text-muted-foreground">Carregando pacientes...</span>
        </div>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="p-6 mb-4 border-2 border-dashed border-accent/30 bg-accent/5">
        <div className="text-center space-y-3">
          <Users className="w-12 h-12 text-accent/50 mx-auto" />
          <div>
            <p className="text-senior-base font-semibold text-foreground mb-1">
              Nenhum paciente vinculado
            </p>
            <p className="text-senior-sm text-muted-foreground">
              Você ainda não aceitou nenhum convite de paciente.
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aguarde um convite por email ou peça ao paciente para te adicionar como cuidador.
          </p>
        </div>
      </Card>
    );
  }

  // Auto-select first patient if none selected
  if (!selectedPatientId && patients.length > 0) {
    onSelect(patients[0].patient_id);
  }

  return (
    <Card className="p-4 mb-4 bg-secondary/10 border-secondary/30">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-secondary" />
        <div className="flex-1">
          <label className="text-sm font-semibold text-foreground block mb-1">
            Gerenciando cuidados de:
          </label>
          <Select
            value={selectedPatientId || patients[0]?.patient_id}
            onValueChange={onSelect}
          >
            <SelectTrigger className="text-senior-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem
                  key={patient.patient_id}
                  value={patient.patient_id}
                  className="text-senior-base"
                >
                  {patient.patient_name} ({patient.relationship_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

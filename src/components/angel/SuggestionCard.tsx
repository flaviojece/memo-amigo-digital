import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Suggestion } from '@/hooks/useSuggestions';
import { CheckCircle2, XCircle, Pill, Calendar, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SuggestionCardProps {
  suggestion: Suggestion;
  isPatientView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

const getSuggestionIcon = (type: string) => {
  if (type.includes('medication')) return <Pill className="w-5 h-5" />;
  if (type.includes('appointment')) return <Calendar className="w-5 h-5" />;
  return null;
};

const getSuggestionTitle = (type: string) => {
  const titles: Record<string, string> = {
    medication_create: 'Novo Medicamento',
    medication_update: 'Alteração de Medicamento',
    medication_delete: 'Remover Medicamento',
    appointment_create: 'Nova Consulta',
    appointment_update: 'Alteração de Consulta',
    appointment_delete: 'Cancelar Consulta',
  };
  return titles[type] || type;
};

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '⏳ Pendente',
    approved: '✅ Aprovada',
    rejected: '❌ Recusada',
  };
  return labels[status] || status;
};

export function SuggestionCard({ suggestion, isPatientView = false, onApprove, onReject }: SuggestionCardProps) {
  const renderSuggestionData = () => {
    const data = suggestion.suggestion_data;
    
    if (suggestion.type.includes('medication')) {
      return (
        <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">Medicamento:</span>
              <p className="text-muted-foreground">{data.name}</p>
            </div>
            <div>
              <span className="font-semibold">Dosagem:</span>
              <p className="text-muted-foreground">{data.dosage || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold">Frequência:</span>
              <p className="text-muted-foreground">{data.frequency}</p>
            </div>
            <div>
              <span className="font-semibold">Horários:</span>
              <p className="text-muted-foreground">
                {Array.isArray(data.times) ? data.times.join(', ') : 'N/A'}
              </p>
            </div>
          </div>
          {data.notes && (
            <div className="pt-2 border-t">
              <span className="font-semibold text-sm">Observações:</span>
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 flex-1">
            {getSuggestionIcon(suggestion.type)}
            <div className="flex-1">
              <CardTitle className="text-senior-base">
                {getSuggestionTitle(suggestion.type)}
              </CardTitle>
              <CardDescription className="text-senior-sm mt-1">
                {isPatientView ? (
                  <>Sugerido por <strong>{suggestion.angel_name}</strong></>
                ) : (
                  <>Para <strong>{suggestion.patient_name}</strong></>
                )}{' '}
                em {format(new Date(suggestion.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusVariant(suggestion.status)}>
            {getStatusLabel(suggestion.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {renderSuggestionData()}

        {suggestion.patient_response && (
          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <p className="text-sm font-semibold text-destructive mb-1">Motivo da recusa:</p>
            <p className="text-sm text-muted-foreground">{suggestion.patient_response}</p>
          </div>
        )}

        {isPatientView && suggestion.status === 'pending' && onApprove && onReject && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onApprove(suggestion.id)}
              className="flex-1 gap-2"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              Aprovar
            </Button>
            <Button
              onClick={() => {
                const reason = prompt('Motivo da recusa (opcional):');
                if (reason !== null) {
                  onReject(suggestion.id, reason || 'Sem motivo especificado');
                }
              }}
              variant="destructive"
              className="flex-1 gap-2"
              size="lg"
            >
              <XCircle className="w-5 h-5" />
              Recusar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

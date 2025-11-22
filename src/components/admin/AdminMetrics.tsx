import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Calendar, MapPin, UserPlus, AlertCircle, Pill, Shield } from "lucide-react";

interface AdminMetricsProps {
  stats: {
    total_users: number;
    total_patients: number;
    total_angels: number;
    total_medications: number;
    total_appointments: number;
    total_emergency_contacts: number;
    active_location_sharing: number;
    pending_invitations: number;
    recent_emergencies: number;
  } | null;
  loading: boolean;
}

export function AdminMetrics({ stats, loading }: AdminMetricsProps) {
  const metrics = [
    {
      title: "Total de Usuários",
      value: stats?.total_users || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pacientes",
      value: stats?.total_patients || 0,
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Anjos",
      value: stats?.total_angels || 0,
      icon: Shield,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Medicações Ativas",
      value: stats?.total_medications || 0,
      icon: Pill,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Consultas Agendadas",
      value: stats?.total_appointments || 0,
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Contatos de Emergência",
      value: stats?.total_emergency_contacts || 0,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Compartilhamentos Ativos",
      value: stats?.active_location_sharing || 0,
      icon: MapPin,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Convites Pendentes",
      value: stats?.pending_invitations || 0,
      icon: UserPlus,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 w-8 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

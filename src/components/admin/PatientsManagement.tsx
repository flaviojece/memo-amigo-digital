import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, MapPin, Pill, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PatientsManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const { data: relationships, error: relError } = await supabase
        .from("guardian_relationships")
        .select(`
          patient_id,
          profiles!guardian_relationships_patient_id_fkey (
            id,
            full_name,
            email,
            created_at
          )
        `)
        .eq("status", "active");

      if (relError) throw relError;

      const uniquePatients = relationships?.reduce((acc, rel) => {
        const patient = rel.profiles as any;
        if (patient && !acc.find((p: any) => p.id === patient.id)) {
          acc.push(patient);
        }
        return acc;
      }, [] as any[]);

      const patientsWithStats = await Promise.all(
        (uniquePatients || []).map(async (patient) => {
          const [medications, appointments, angels, locationSharing] = await Promise.all([
            supabase.from("medications").select("id", { count: "exact" }).eq("user_id", patient.id).eq("active", true),
            supabase.from("appointments").select("id", { count: "exact" }).eq("user_id", patient.id),
            supabase.from("guardian_relationships").select("id", { count: "exact" }).eq("patient_id", patient.id).eq("status", "active"),
            supabase.from("location_sharing_settings").select("is_sharing").eq("user_id", patient.id).single(),
          ]);

          return {
            ...patient,
            medications_count: medications.count || 0,
            appointments_count: appointments.count || 0,
            angels_count: angels.count || 0,
            is_sharing_location: locationSharing.data?.is_sharing || false,
          };
        })
      );

      return patientsWithStats;
    },
  });

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Gestão de Pacientes
        </CardTitle>
        <CardDescription>
          Monitorar e gerenciar todos os pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Anjos</TableHead>
                <TableHead className="text-center">Medicações</TableHead>
                <TableHead className="text-center">Consultas</TableHead>
                <TableHead className="text-center">Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredPatients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients?.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name || "Sem nome"}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{patient.angels_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Pill className="h-3 w-3" />
                        {patient.medications_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {patient.appointments_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {patient.is_sharing_location ? (
                        <Badge variant="default" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

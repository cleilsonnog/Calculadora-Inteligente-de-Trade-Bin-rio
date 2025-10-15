import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Target,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface atualizada para incluir user_id, embora não seja exibido na UI
interface HistoryRecord {
  id: string;
  data: string;
  banca_inicial: number;
  banca_final: number;
  lucro_total: number;
  status: string;
  observacoes: string | null;
  user_id: string;
  sessao?: string | null;
}

const DailyHistory = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("historico_operacoes")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar os registros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "meta":
        return {
          color: "text-green-500",
          bgColor: "bg-green-500/10 border-green-500/20",
          icon: Target,
          label: "🟢 Meta",
        };
      case "stop":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/10 border-red-500/20",
          icon: AlertCircle,
          label: "🔴 Stop Loss",
        };
      default:
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10 border-yellow-500/20",
          icon: Clock,
          label: "🟡 Aberto",
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico Diário</h1>
            <p className="text-muted-foreground">
              Acompanhe seus resultados ao longo do tempo
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum registro ainda
              </h3>
              <p className="text-muted-foreground text-center">
                Seus registros diários aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {records.map((record, index) => {
              const statusConfig = getStatusConfig(record.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={record.id}
                  className={`cursor-pointer transition-all hover-scale animate-fade-in border ${statusConfig.bgColor}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setSelectedRecord(record)}
                >
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(record.data), "dd/MM/yyyy")}
                        </div>
                        {/* 🔹 Sessão aparece ao lado ou abaixo da data */}
                        {record.sessao && (
                          <span className="text-sm text-muted-foreground">
                            {record.sessao}
                          </span>
                        )}
                      </div>

                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Lucro:
                        </span>
                        <span
                          className={`font-bold ${
                            record.lucro_total >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {formatCurrency(record.lucro_total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <span
                          className={`text-sm font-medium ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog
          open={!!selectedRecord}
          onOpenChange={() => setSelectedRecord(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes do Dia
              </DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Data:</span>
                    <span className="font-medium">
                      {formatDate(selectedRecord.data)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Banca Inicial:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.banca_inicial)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Banca Final:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.banca_final)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Lucro Total:
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        selectedRecord.lucro_total >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatCurrency(selectedRecord.lucro_total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Resultado:
                    </span>
                    <span
                      className={`font-medium ${
                        getStatusConfig(selectedRecord.status).color
                      }`}
                    >
                      {getStatusConfig(selectedRecord.status).label}
                    </span>
                  </div>
                </div>
                {selectedRecord.observacoes && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2">Observações:</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecord.observacoes}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => setSelectedRecord(null)}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DailyHistory;

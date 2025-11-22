import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  TrendingUp,
  Repeat,
  Target,
  AlertCircle,
  Clock,
  PlusCircle,
  MinusCircle,
  Filter,
  X,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
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

// Interface para as operações individuais que vamos buscar
interface IndividualOperation {
  id: string;
  entry_value: number;
  result: "win" | "loss";
  profit_loss: number;
  bankroll_after: number;
  created_at: string;
}

const DailyHistory = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(
    null
  );
  // Estado para editar a observação dentro do modal
  const [observationEditText, setObservationEditText] = useState("");
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [modeFilter, setModeFilter] = useState<"real" | "training" | "all">(
    "real"
  );
  const [individualOps, setIndividualOps] = useState<IndividualOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOps, setLoadingOps] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, modeFilter]); // ⬅️ Refetch when date range or mode changes

  // Efeito para popular o campo de edição quando um registro é selecionado
  useEffect(() => {
    if (selectedRecord) {
      setObservationEditText(selectedRecord.observacoes || "");
    }
  }, [selectedRecord]);

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      let query = supabase
        .from("historico_operacoes")
        .select("*")
        .eq("user_id", user.id);

      // 🔹 Adiciona o filtro de data se um período for selecionado
      if (date?.from) {
        const fromDate = date.from.toISOString().split("T")[0];
        // Se 'to' não existir, o usuário selecionou um único dia.
        if (!date.to) {
          query = query.eq("data", fromDate);
        } else {
          // Se 'to' existir, é um intervalo.
          const toDate = date.to.toISOString().split("T")[0];
          query = query.gte("data", fromDate).lte("data", toDate);
        }
      }

      // 🔹 Adiciona o filtro de modo
      if (modeFilter !== "all") {
        query = query.eq("mode", modeFilter);
      }

      const { data, error } = await query.order("data", {
        ascending: false,
      });

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

  // Função para buscar as operações individuais de uma sessão
  const fetchIndividualOperations = async (historyId: string) => {
    if (!historyId) return;

    setLoadingOps(true);
    setIndividualOps([]); // Limpa operações antigas

    try {
      const { data, error } = await supabase
        .from("operacoes_individuais")
        .select("*")
        .eq("historico_id", historyId)
        .order("created_at", { ascending: true }); // Ordena da mais antiga para a mais nova

      if (error) throw error;

      setIndividualOps(
        (data || []).map((op) => ({
          ...op,
          result: op.result === "win" ? "win" : "loss",
        }))
      );
    } catch (error) {
      console.error("Error fetching individual operations:", error);
      toast({
        title: "Erro ao carregar operações",
        description: "Não foi possível buscar os detalhes desta sessão.",
        variant: "destructive",
      });
    } finally {
      setLoadingOps(false);
    }
  };

  // Função para salvar a observação editada no modal
  const handleSaveObservation = async () => {
    if (!selectedRecord) return;

    setIsSavingObservation(true);
    try {
      const { error } = await supabase
        .from("historico_operacoes")
        .update({ observacoes: observationEditText })
        .eq("id", selectedRecord.id);

      if (error) throw error;

      // Atualiza o estado local para refletir a mudança imediatamente
      const updatedRecord = {
        ...selectedRecord,
        observacoes: observationEditText,
      };
      setSelectedRecord(updatedRecord);
      setRecords((prev) =>
        prev.map((r) => (r.id === selectedRecord.id ? updatedRecord : r))
      );

      toast({
        title: "Observação salva!",
        description: "Sua anotação foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a observação.",
        variant: "destructive",
      });
    } finally {
      setIsSavingObservation(false);
    }
  };

  // Função para excluir uma sessão
  const handleDeleteSession = async () => {
    if (!selectedRecord) return;

    const isConfirmed = window.confirm(
      "Tem certeza que deseja excluir esta sessão? Todas as operações vinculadas serão perdidas permanentemente. Esta ação não pode ser desfeita."
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      // 1. Excluir as operações individuais vinculadas
      const { error: opsError } = await supabase
        .from("operacoes_individuais")
        .delete()
        .eq("historico_id", selectedRecord.id);

      if (opsError) throw opsError;

      // 2. Excluir o registro do histórico da sessão
      const { error: historyError } = await supabase
        .from("historico_operacoes")
        .delete()
        .eq("id", selectedRecord.id);

      if (historyError) throw historyError;

      // 3. Atualizar a UI
      toast({
        title: "Sessão excluída!",
        description: "O registro da sessão foi removido com sucesso.",
      });
      setRecords((prev) => prev.filter((r) => r.id !== selectedRecord.id));
      setSelectedRecord(null); // Fecha o modal
    } catch (error) {
      console.error("Erro ao excluir sessão:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover a sessão.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
    // 🔹 CORREÇÃO: Substitui hífens por barras para evitar problemas de fuso horário (UTC)
    const localDate = new Date(dateString.replace(/-/g, "/"));
    return format(localDate, "dd 'de' MMMM 'de' yyyy", {
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
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app")}
            className="hover-scale"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Histórico Diário</h1>
            <p className="text-muted-foreground">
              Click em um dia para ver detalhes e adicionar observações
            </p>
            <p className="text-muted-foreground">
              Filtre e analise seus resultados
            </p>
          </div>

          {/* 🔹 COMPONENTE DE FILTRO DE DATA 🔹 */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filtrar por período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {date && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDate(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 🔹 FILTRO DE MODO */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={modeFilter === "real" ? "default" : "outline"}
            onClick={() => setModeFilter("real")}
          >
            Conta Real
          </Button>
          <Button
            variant={modeFilter === "training" ? "default" : "outline"}
            onClick={() => setModeFilter("training")}
          >
            Treinamento
          </Button>
          <Button
            variant={modeFilter === "all" ? "default" : "outline"}
            onClick={() => setModeFilter("all")}
          >
            Ambas
          </Button>
        </div>

        {records.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum registro ainda
              </h3>
              <p className="text-muted-foreground text-center">
                Seus registros diários aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {records.map((record, index) => {
              const statusConfig = getStatusConfig(record.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={record.id}
                  className={`cursor-pointer transition-all hover-scale animate-fade-in border ${statusConfig.bgColor}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => {
                    setSelectedRecord(record);
                    fetchIndividualOperations(record.id); // ⬅️ BUSCA AS OPERAÇÕES AO CLICAR
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {/* 🔹 CORREÇÃO: Substitui hífens por barras para evitar problemas de fuso horário (UTC) */}
                          {format(
                            new Date(record.data.replace(/-/g, "/")),
                            "dd/MM/yyyy"
                          )}
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
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRecord(null);
          }}
        >
          <DialogContent className="w-[95vw] max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Detalhes do Dia
              </DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
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

                {/* CAMPO DE OBSERVAÇÃO EDITÁVEL */}
                <div className="space-y-2">
                  <Label htmlFor="observation-edit">Observações</Label>
                  <Textarea
                    id="observation-edit"
                    placeholder="Adicione uma nota sobre esta sessão..."
                    value={observationEditText}
                    onChange={(e) => setObservationEditText(e.target.value)}
                    className="h-24"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSaveObservation}
                    disabled={isSavingObservation}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingObservation ? "Salvando..." : "Salvar Observação"}
                  </Button>
                </div>

                {/* SEÇÃO PARA OPERAÇÕES INDIVIDUAIS */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-3">
                    Operações da Sessão
                  </h4>
                  {loadingOps ? (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Carregando operações...
                    </div>
                  ) : individualOps.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {individualOps.map((op) => (
                        <div
                          key={op.id}
                          className={`flex items-center justify-between p-2 rounded-md text-sm ${
                            op.result === "win"
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {op.result === "win" ? (
                              <PlusCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <MinusCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>
                              {format(new Date(op.created_at), "HH:mm:ss")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              Entrada: {formatCurrency(op.entry_value)}
                            </span>
                            <span
                              className={`font-bold ${
                                op.result === "win"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formatCurrency(op.profit_loss)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Nenhuma operação individual encontrada para esta sessão.
                    </p>
                  )}
                </div>

                {/* BOTÕES DE AÇÃO DO MODAL */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-border">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Excluindo..." : "Excluir Sessão"}
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={() => setSelectedRecord(null)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DailyHistory;

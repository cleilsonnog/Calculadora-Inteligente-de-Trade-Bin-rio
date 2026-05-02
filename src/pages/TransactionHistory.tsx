import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionRecord {
  id: string;
  tipo: "deposito" | "saque";
  valor: number;
  created_at: string;
}

const TransactionHistory = () => {
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalDeposited = useMemo(() => {
    return records
      .filter((r) => r.tipo === "deposito")
      .reduce((acc, record) => acc + record.valor, 0);
  }, [records]);

  const totalWithdrawn = useMemo(() => {
    return records
      .filter((r) => r.tipo === "saque")
      .reduce((acc, record) => acc + record.valor, 0);
  }, [records]);

  const groupedRecords = useMemo(() => {
    const groups: {
      [key: string]: { label: string; records: TransactionRecord[] };
    } = {};

    records.forEach((record) => {
      const dateObj = new Date(record.created_at);
      const monthKey = format(dateObj, "yyyy-MM");
      const monthLabel = format(dateObj, "MMMM yyyy", { locale: ptBR });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          records: [],
        };
      }
      groups[monthKey].records.push(record);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [records]);

  useEffect(() => {
    fetchHistory();
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
        .from("transacoes_banca")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Carregando histórico de transações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app")}
            className="hover-scale"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico de Transações</h1>
            <p className="text-muted-foreground">
              Seus depósitos e saques registrados.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Depositado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalDeposited)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sacado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalWithdrawn)}
              </p>
            </CardContent>
          </Card>
        </div>

        {records.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Landmark className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-muted-foreground">
                Seus depósitos e saques aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedRecords.map((group) => (
              <div key={group.label}>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b pb-2">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.records.map((record) => (
                    <Card
                      key={record.id}
                      className={cn(
                        "flex items-center justify-between p-4",
                        record.tipo === "deposito"
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {record.tipo === "deposito" ? (
                          <ArrowUpCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                          <p className="font-semibold capitalize">
                            {record.tipo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(record.created_at),
                              "dd/MM/yyyy 'às' HH:mm"
                            )}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-lg font-bold font-mono-numbers",
                          record.tipo === "deposito"
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {record.tipo === "deposito" ? "+" : "-"}
                        {formatCurrency(record.valor)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;

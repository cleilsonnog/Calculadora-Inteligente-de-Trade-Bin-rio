import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Save,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { TradeConfig, ConfigValue, OldTradeConfig } from "./Index";
import { useConfig } from "@/contexts/ConfigContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { differenceInDays, format } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState("80");
  const [initialBankroll, setInitialBankroll] = useState("1000");
  const [entry, setEntry] = useState<ConfigValue>({
    value: 2,
    type: "percentage",
  });
  const [dailyGoal, setDailyGoal] = useState<ConfigValue>({
    value: 10,
    type: "percentage",
  });
  const [stopLoss, setStopLoss] = useState<ConfigValue>({
    value: 5,
    type: "percentage",
  });

  // Estados para gerenciamento de assinatura
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const { config, loading: configLoading, refreshConfig } = useConfig();
  const pageLoading = configLoading || subscriptionLoading;

  useEffect(() => {
    // Quando o contexto carregar a configuração, preenchemos os campos do formulário.
    if (!configLoading) {
      if (config) {
        setPayout(config.payout.toString());
        setInitialBankroll(config.initialBankroll.toString());
        setEntry(config.entry);
        setDailyGoal(config.dailyGoal);
        setStopLoss(config.stopLoss);
      }
    }
  }, [config, configLoading]); // A dependência de configLoading garante que isso rode quando o estado de loading mudar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const configToSave = {
      user_id: user.id, // CORREÇÃO: Usar a coluna correta 'user_id'
      payout: parseFloat(payout),
      initial_bankroll: parseFloat(initialBankroll),
      entry: { ...entry, value: parseFloat(String(entry.value)) },
      daily_goal: { ...dailyGoal, value: parseFloat(String(dailyGoal.value)) },
      stop_loss: { ...stopLoss, value: parseFloat(String(stopLoss.value)) },
      updated_at: new Date().toISOString(),
    };

    // Usa 'upsert' para inserir ou atualizar o registro
    const { error } = await supabase
      .from("user_configs")
      .upsert(configToSave, { onConflict: "user_id" }); // CORREÇÃO: Especifica a coluna de conflito

    if (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Falha ao salvar as configurações.");
    } else {
      toast.success("⚙️ Configurações salvas com sucesso!");
      refreshConfig(); // Atualiza o contexto com os novos dados
      navigate("/app"); // Navega para a calculadora
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-portal-link"
      );

      if (error) throw error;

      // Redireciona para a URL do portal do cliente Stripe
      window.location.href = data.url;
    } catch (error: unknown) {
      console.error("Error creating portal link:", error);
      let message = "Ocorreu um erro ao tentar gerenciar sua assinatura.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const getRemainingDays = () => {
    if (!subscription?.current_period_end) return 0;
    return differenceInDays(
      new Date(subscription.current_period_end),
      new Date()
    );
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/app")}
          className="mb-6 animate-fade-in" // Redireciona para a calculadora
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* SEÇÃO DE ASSINATURA */}
        <Card className="glass-effect border-primary/20 animate-fade-in mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle>Assinatura</CardTitle>
            </div>
            <CardDescription>
              Gerencie seu plano e acesso à plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription && subscription.status === "active" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-md">
                  <p className="font-semibold text-green-600">Plano Ativo</p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Seu acesso expira em{" "}
                      <span className="font-bold text-foreground">
                        {getRemainingDays()} dias
                      </span>{" "}
                      (
                      {format(
                        new Date(subscription.current_period_end),
                        "dd/MM/yyyy"
                      )}
                      )
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isManagingSubscription
                    ? "Carregando..."
                    : "Gerenciar Assinatura"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="font-semibold text-yellow-500">Plano Inativo</p>
                <p className="text-sm text-muted-foreground">
                  Você não possui uma assinatura ativa.
                </p>
                <Button className="w-full" onClick={() => navigate("/")}>
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20 animate-scale-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <CardTitle>Configurações</CardTitle>
            </div>
            <CardDescription>
              Atualize os parâmetros da sua estratégia de trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payout">Payout (%)</Label>
                  <Input
                    id="payout"
                    type="number"
                    step="0.1"
                    value={payout}
                    onChange={(e) => setPayout(e.target.value)}
                    required
                    className="font-mono-numbers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankroll">Banca Inicial (R$)</Label>
                  <Input
                    id="bankroll"
                    type="number"
                    step="0.01"
                    value={initialBankroll}
                    onChange={(e) => setInitialBankroll(e.target.value)}
                    required
                    className="font-mono-numbers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry">Entrada por Operação</Label>
                  <div className="flex gap-2">
                    <Input
                      id="entry"
                      type="number"
                      step="0.01"
                      value={entry.value}
                      onChange={(e) =>
                        setEntry({
                          ...entry,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                      className="font-mono-numbers"
                    />
                    <ToggleGroup
                      type="single"
                      value={entry.type}
                      onValueChange={(value: ConfigValue["type"]) => {
                        if (value) setEntry({ ...entry, type: value });
                      }}
                    >
                      <ToggleGroupItem
                        value="percentage"
                        aria-label="Porcentagem"
                      >
                        %
                      </ToggleGroupItem>
                      <ToggleGroupItem value="currency" aria-label="Reais">
                        R$
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Meta Diária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="goal"
                      type="number"
                      step="0.01"
                      value={dailyGoal.value}
                      onChange={(e) =>
                        setDailyGoal({
                          ...dailyGoal,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                      className="font-mono-numbers"
                    />
                    <ToggleGroup
                      type="single"
                      value={dailyGoal.type}
                      onValueChange={(value: ConfigValue["type"]) => {
                        if (value) setDailyGoal({ ...dailyGoal, type: value });
                      }}
                    >
                      <ToggleGroupItem
                        value="percentage"
                        aria-label="Porcentagem"
                      >
                        %
                      </ToggleGroupItem>
                      <ToggleGroupItem value="currency" aria-label="Reais">
                        R$
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stopLoss"
                      type="number"
                      step="0.01"
                      value={stopLoss.value}
                      onChange={(e) =>
                        setStopLoss({
                          ...stopLoss,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                      className="font-mono-numbers"
                    />
                    <ToggleGroup
                      type="single"
                      value={stopLoss.type}
                      onValueChange={(value: ConfigValue["type"]) => {
                        if (value) setStopLoss({ ...stopLoss, type: value });
                      }}
                    >
                      <ToggleGroupItem
                        value="percentage"
                        aria-label="Porcentagem"
                      >
                        %
                      </ToggleGroupItem>
                      <ToggleGroupItem value="currency" aria-label="Reais">
                        R$
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

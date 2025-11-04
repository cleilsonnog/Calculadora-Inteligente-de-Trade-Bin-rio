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
import { Settings as SettingsIcon, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { TradeConfig, ConfigValue, OldTradeConfig } from "./Index";
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

  useEffect(() => {
    const checkAuthAndLoadConfig = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Se a sessão existe, carregamos a configuração
      const savedConfig = localStorage.getItem("tradeConfig");
      if (savedConfig) {
        const config: TradeConfig = JSON.parse(savedConfig);
        // 🔹 Adiciona verificações para garantir que os valores existem antes de usá-los
        setPayout((config.payout || 80).toString());
        setInitialBankroll((config.initialBankroll || 1000).toString());

        // Migração de configurações antigas para o novo formato
        if (typeof (config as OldTradeConfig).entryPercentage === "number") {
          const oldConfig = config as OldTradeConfig;
          setEntry({
            value: oldConfig.entryPercentage || 2,
            type: "percentage",
          });
          setDailyGoal({
            value: oldConfig.dailyGoal || 10,
            type: "percentage",
          });
          setStopLoss({ value: oldConfig.stopLoss || 5, type: "percentage" });
        } else {
          // 🔹 Garante que os objetos de configuração complexos e seus valores internos existam
          setEntry(config.entry || { value: 2, type: "percentage" });
          setDailyGoal(config.dailyGoal || { value: 10, type: "percentage" });
          setStopLoss(config.stopLoss || { value: 5, type: "percentage" });
        }
      }
      // Apenas paramos o loading depois de tudo verificado e carregado
      setLoading(false);
    };

    checkAuthAndLoadConfig();
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: TradeConfig = {
      payout: parseFloat(payout),
      initialBankroll: parseFloat(initialBankroll),
      entry: { ...entry, value: parseFloat(String(entry.value)) },
      dailyGoal: { ...dailyGoal, value: parseFloat(String(dailyGoal.value)) },
      stopLoss: { ...stopLoss, value: parseFloat(String(stopLoss.value)) },
    };

    localStorage.setItem("tradeConfig", JSON.stringify(config));
    toast.success("⚙️ Configurações salvas com sucesso!");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 animate-fade-in" // Redireciona para a calculadora
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

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

              <Button
                type="submit"
                className="w-full gradient-primary glow-primary"
              >
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

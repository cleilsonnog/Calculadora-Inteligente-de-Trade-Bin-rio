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
import { TradeConfig } from "./Index";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState("80");
  const [initialBankroll, setInitialBankroll] = useState("1000");
  const [entryPercentage, setEntryPercentage] = useState("2");
  const [dailyGoal, setDailyGoal] = useState("10");
  const [stopLoss, setStopLoss] = useState("5");

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      const savedConfig = localStorage.getItem("tradeConfig");
      if (savedConfig) {
        const config: TradeConfig = JSON.parse(savedConfig);
        setPayout(config.payout.toString());
        setInitialBankroll(config.initialBankroll.toString());
        setEntryPercentage(config.entryPercentage.toString());
        setDailyGoal(config.dailyGoal.toString());
        setStopLoss(config.stopLoss.toString());
      }
    }
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: TradeConfig = {
      payout: parseFloat(payout),
      initialBankroll: parseFloat(initialBankroll),
      entryPercentage: parseFloat(entryPercentage),
      dailyGoal: parseFloat(dailyGoal),
      stopLoss: parseFloat(stopLoss),
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
                  <Label htmlFor="entry">Entrada por Operação (%)</Label>
                  <Input
                    id="entry"
                    type="number"
                    step="0.1"
                    value={entryPercentage}
                    onChange={(e) => setEntryPercentage(e.target.value)}
                    required
                    className="font-mono-numbers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Meta Diária (%)</Label>
                  <Input
                    id="goal"
                    type="number"
                    step="0.1"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    required
                    className="font-mono-numbers"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.1"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    required
                    className="font-mono-numbers"
                  />
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

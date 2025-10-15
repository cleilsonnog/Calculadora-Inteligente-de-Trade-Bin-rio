import { useState } from "react";
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
import { Settings } from "lucide-react";
import { TradeConfig } from "@/pages/Index";

interface ConfigPanelProps {
  onConfigSubmit: (config: TradeConfig) => void;
}

export const ConfigPanel = ({ onConfigSubmit }: ConfigPanelProps) => {
  const [payout, setPayout] = useState("85");
  const [initialBankroll, setInitialBankroll] = useState("500");
  const [entryPercentage, setEntryPercentage] = useState("2");
  const [dailyGoal, setDailyGoal] = useState("3");
  const [stopLoss, setStopLoss] = useState("5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfigSubmit({
      payout: parseFloat(payout),
      initialBankroll: parseFloat(initialBankroll),
      entryPercentage: parseFloat(entryPercentage),
      dailyGoal: parseFloat(dailyGoal),
      stopLoss: parseFloat(stopLoss),
    });
  };

  return (
    <Card className="glass-effect border-primary/20 animate-scale-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <CardTitle>Configuração Inicial</CardTitle>
        </div>
        <CardDescription>
          Configure os parâmetros da sua estratégia de trading
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
            Iniciar Operações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

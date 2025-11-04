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
import { TradeConfig, ConfigValue } from "@/pages/Index";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ConfigPanelProps {
  onConfigSubmit: (config: TradeConfig) => void;
}

export const ConfigPanel = ({ onConfigSubmit }: ConfigPanelProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfigSubmit({
      payout: parseFloat(payout),
      initialBankroll: parseFloat(initialBankroll),
      entry: { ...entry, value: parseFloat(String(entry.value)) },
      dailyGoal: { ...dailyGoal, value: parseFloat(String(dailyGoal.value)) },
      stopLoss: { ...stopLoss, value: parseFloat(String(stopLoss.value)) },
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
                  <ToggleGroupItem value="percentage" aria-label="Porcentagem">
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
                  <ToggleGroupItem value="percentage" aria-label="Porcentagem">
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
                  <ToggleGroupItem value="percentage" aria-label="Porcentagem">
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
            Iniciar Operações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

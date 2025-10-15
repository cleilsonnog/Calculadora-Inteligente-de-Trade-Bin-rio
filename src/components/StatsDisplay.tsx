import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import { TradeConfig } from "@/pages/Index";

interface StatsDisplayProps {
  bankroll: number;
  totalProfit: number;
  progressPercentage: number;
  config: TradeConfig;
  goalReached: boolean;
  stopLossReached: boolean;
}

export const StatsDisplay = ({
  bankroll,
  totalProfit,
  progressPercentage,
  config,
  goalReached,
  stopLossReached,
}: StatsDisplayProps) => {
  const goalValue = (config.initialBankroll * config.dailyGoal) / 100;
  const isProfitable = totalProfit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      <Card className="glass-effect border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Banca Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold font-mono-numbers text-foreground">
            R$ {bankroll.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card
        className={`glass-effect ${
          isProfitable
            ? "border-success/30 glow-success"
            : "border-danger/30 glow-danger"
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger" />
            )}
            Lucro Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold font-mono-numbers ${
              isProfitable ? "text-success" : "text-danger"
            }`}
          >
            {isProfitable ? "+" : ""}R$ {totalProfit.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-warning" />
            Meta Diária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold font-mono-numbers text-warning">
            R$ {goalValue.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card
        className={`glass-effect ${
          goalReached
            ? "border-warning/50 animate-pulse-slow"
            : "border-primary/20"
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress
            value={Math.min(progressPercentage, 100)}
            className="h-3"
          />
          <p className="text-xl font-bold font-mono-numbers">
            {progressPercentage.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {goalReached && (
        <Card className="md:col-span-2 lg:col-span-4 glass-effect border-warning/50 animate-scale-in">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                🎯 Meta diária atingida! Parabéns!
              </p>
              <p className="text-muted-foreground mt-2">
                Hora de encerrar o dia e aproveitar seus lucros.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stopLossReached && (
        <Card className="md:col-span-2 lg:col-span-4 glass-effect border-danger/50 animate-scale-in">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">
                ⚠️ Stop Loss atingido!
              </p>
              <p className="text-muted-foreground mt-2">
                Reavalie suas operações antes de continuar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {progressPercentage >= 50 && progressPercentage < 100 && !goalReached && (
        <Card className="md:col-span-2 lg:col-span-4 glass-effect border-primary/30 animate-fade-in">
          <CardContent className="py-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">
                💪 Você está indo muito bem! Continue assim!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

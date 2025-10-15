import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RotateCcw, TrendingUp } from "lucide-react";

interface TradeControlsProps {
  currentEntry: number;
  onWin: () => void;
  onLoss: () => void;
  onReset: () => void;
  disabled: boolean;
}

export const TradeControls = ({
  currentEntry,
  onWin,
  onLoss,
  onReset,
  disabled,
}: TradeControlsProps) => {
  return (
    <Card className="glass-effect border-primary/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Controle de Operações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground mb-2">Próxima Entrada</p>
          <p className="text-4xl font-bold font-mono-numbers text-foreground">
            R$ {currentEntry.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onWin}
            disabled={disabled}
            size="lg"
            className="h-16 text-lg gradient-success glow-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            Win
          </Button>

          <Button
            onClick={onLoss}
            disabled={disabled}
            size="lg"
            className="h-16 text-lg gradient-danger glow-danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-6 h-6 mr-2" />
            Loss
          </Button>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Banca
        </Button>
      </CardContent>
    </Card>
  );
};

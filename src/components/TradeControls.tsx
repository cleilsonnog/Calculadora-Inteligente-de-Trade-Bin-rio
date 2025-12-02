import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  TrendingUp,
  ThumbsDown,
  ThumbsUp,
  Save,
} from "lucide-react";

interface TradeControlsProps {
  currentEntry: number;
  onWin: () => void;
  onLoss: () => void;
  onConservativeLoss: () => void;
  onReset: () => void;
  onEndSession: () => void;
  disabled: boolean;
}

export const TradeControls = ({
  currentEntry,
  onWin,
  onLoss,
  onConservativeLoss,
  onReset,
  onEndSession,
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Button
            onClick={onWin}
            disabled={disabled}
            className="bg-green-500 hover:bg-green-600 text-white text-lg py-6 flex flex-col h-full gap-2"
          >
            <ThumbsUp /> Win
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:col-span-2">
            <Button
              onClick={onLoss}
              disabled={disabled}
              className="bg-red-500 hover:bg-red-600 text-white text-lg py-6 flex flex-col h-full"
            >
              <div className="flex items-center gap-2">
                <ThumbsDown /> Loss
              </div>
              <span className="text-xs font-normal">(Martingale)</span>
            </Button>
            <Button
              onClick={onConservativeLoss}
              disabled={disabled}
              variant="destructive"
              className="bg-red-700 hover:bg-red-800 text-white text-lg py-6 flex flex-col h-full"
            >
              <div className="flex items-center gap-2">
                <ThumbsDown /> Loss
              </div>
              <span className="text-xs font-normal">(Conservador)</span>
            </Button>
          </div>

          <Button
            onClick={onEndSession}
            variant="outline"
            disabled={disabled}
            className="text-lg py-6 flex flex-col h-full gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 border-blue-500/20"
          >
            <Save /> Encerrar
          </Button>

          {/* O botão de Reset foi movido para o final e agora ocupa uma coluna inteira em telas pequenas */}
          <Button
            onClick={() => onReset(true)} // Passando true para salvar a sessão ao resetar
            variant="outline"
            className="text-lg py-6 flex flex-col h-full gap-2 col-span-2 md:col-span-1" // ⬅️ A classe 'col-span-2' agora se aplica apenas a telas pequenas
          >
            <RotateCcw /> Resetar Dia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

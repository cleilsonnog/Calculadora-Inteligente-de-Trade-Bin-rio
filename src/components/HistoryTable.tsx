import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Trash2, CheckCircle, XCircle } from "lucide-react";
import { TradeOperation } from "@/pages/Index";

interface HistoryTableProps {
  operations: TradeOperation[];
  onClearHistory: () => void;
}

export const HistoryTable = ({
  operations,
  onClearHistory,
}: HistoryTableProps) => {
  if (operations.length === 0) {
    return (
      <Card className="glass-effect border-primary/20 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Operações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma operação registrada ainda</p>
            <p className="text-sm mt-2">
              Comece suas operações para ver o histórico aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-primary/20 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Histórico de Operações
        </CardTitle>
        <Button
          onClick={onClearHistory}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Lucro/Perda</TableHead>
                <TableHead>Banca</TableHead>
                <TableHead className="hidden md:table-cell">Horário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-mono-numbers">{op.id}</TableCell>
                  <TableCell className="font-mono-numbers">
                    R$ {op.entryValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {op.result === "win" ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-success font-semibold">
                            Win
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-danger" />
                          <span className="text-danger font-semibold">
                            Loss
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`font-mono-numbers font-semibold ${
                      op.profitLoss >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {op.profitLoss >= 0 ? "+" : ""}R$ {op.profitLoss.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono-numbers">
                    R$ {op.bankrollAfter.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {op.timestamp.toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Operações
              </p>
              <p className="text-xl font-bold font-mono-numbers">
                {operations.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Wins</p>
              <p className="text-xl font-bold font-mono-numbers text-success">
                {operations.filter((op) => op.result === "win").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Losses</p>
              <p className="text-xl font-bold font-mono-numbers text-danger">
                {operations.filter((op) => op.result === "loss").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Taxa de Acerto
              </p>
              <p className="text-xl font-bold font-mono-numbers">
                {(
                  (operations.filter((op) => op.result === "win").length /
                    operations.length) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

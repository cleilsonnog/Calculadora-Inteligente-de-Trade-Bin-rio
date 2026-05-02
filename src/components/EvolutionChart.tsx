import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";
import { TradeOperation } from "@/pages/Index";

interface EvolutionChartProps {
  operations: TradeOperation[];
  initialBankroll: number;
}

export const EvolutionChart = ({ operations, initialBankroll }: EvolutionChartProps) => {
  if (operations.length === 0) return null;

  const chartData = [
    { name: "Inicio", banca: initialBankroll },
    ...[...operations].reverse().map((op, index) => ({
      name: `#${index + 1}`,
      banca: op.bankrollAfter,
      resultado: op.result,
    })),
  ];

  const minValue = Math.min(...chartData.map((d) => d.banca));
  const maxValue = Math.max(...chartData.map((d) => d.banca));
  const padding = (maxValue - minValue) * 0.1 || 10;

  return (
    <Card className="glass-effect border-primary/20 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Evolucao da Banca
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={[minValue - padding, maxValue + padding]}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `R$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Banca"]}
              />
              <ReferenceLine
                y={initialBankroll}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="banca"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

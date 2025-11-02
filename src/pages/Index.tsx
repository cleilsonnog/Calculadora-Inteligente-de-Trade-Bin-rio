import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { ConfigPanel } from "../components/ConfigPanel";
import { TradeControls } from "../components/TradeControls";
import { StatsDisplay } from "../components/StatsDisplay";
import { HistoryTable } from "../components/HistoryTable";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { TrendingUp, Settings, LogOut, History, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface TradeConfig {
  payout: number;
  initialBankroll: number;
  entryPercentage: number;
  dailyGoal: number;
  stopLoss: number;
}

export interface TradeOperation {
  id: number;
  entryValue: number;
  result: "win" | "loss";
  profitLoss: number;
  bankrollAfter: number;
  timestamp: Date;
}

const Index = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<TradeConfig | null>(null);
  const [bankroll, setBankroll] = useState(0);
  const [currentEntry, setCurrentEntry] = useState(0);
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const [stopLossReached, setStopLossReached] = useState(false);
  const [isSessionSaved, setIsSessionSaved] = useState(false);

  // O usuário e o estado de carregamento agora são gerenciados por AuthContext e ProtectedRoute.
  // Este componente apenas reage à presença de um usuário e configuração.
  const { session } = useAuth();
  const user = session?.user;

  // Refs para manter a versão mais atualizada dos estados e evitar "stale state"
  const bankrollRef = useRef(bankroll);
  const totalProfitRef = useRef(totalProfit);
  const operationsRef = useRef(operations);
  useEffect(() => {
    bankrollRef.current = bankroll;
  }, [bankroll]);
  useEffect(() => {
    totalProfitRef.current = totalProfit;
  }, [totalProfit]);
  useEffect(() => {
    operationsRef.current = operations;
  }, [operations]);

  useEffect(() => {
    if (user) {
      const savedConfig = localStorage.getItem("tradeConfig");
      if (savedConfig) {
        const parsedConfig: TradeConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      }
    }
  }, [user]);

  useEffect(() => {
    if (config) {
      localStorage.setItem("tradeConfig", JSON.stringify(config));
      const initialEntry =
        (config.initialBankroll * config.entryPercentage) / 100;
      setCurrentEntry(initialEntry);
      setBankroll(config.initialBankroll);
    }
  }, [config]);

  const saveDailyHistory = useCallback(
    async (statusOverride?: "Meta" | "Stop") => {
      if (!config || !user) return;

      // não tenta salvar se não houver operações
      if (!operationsRef.current || operationsRef.current.length === 0) {
        console.log("saveDailyHistory: nenhuma operação para salvar.");
        return;
      }

      try {
        let status =
          statusOverride ||
          (goalReached ? "Meta" : stopLossReached ? "Stop" : "Em aberto");

        // 🔹 CORREÇÃO: Gera a data no formato YYYY-MM-DD usando o fuso horário local
        const localDate = new Date();
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0"); // getMonth() é 0-indexado
        const day = String(localDate.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;

        // 🔹 Converte operações para garantir JSON serializável (Date -> ISO string)
        const safeOperations = operationsRef.current.map((op) => ({
          ...op,
          // se timestamp já for string, mantém; se for Date, converte
          timestamp:
            op.timestamp && typeof op.timestamp !== "string"
              ? op.timestamp.toISOString()
              : op.timestamp,
        }));

        // 🔹 Conta quantas sessões já existem hoje para este usuário (tolerante)
        let sessionNumber = 1;
        try {
          // primeiro tenta usar head:true para obter count (mais eficiente)
          const countResp = await supabase
            .from("historico_operacoes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("data", today);

          // quando usar head:true, data costuma ser null e count vem separado
          if (countResp && typeof countResp.count === "number") {
            sessionNumber = (countResp.count || 0) + 1;
          } else if (Array.isArray(countResp.data)) {
            // fallback: usa length do array
            sessionNumber = (countResp.data.length || 0) + 1;
          } else {
            // fallback seguro: buscar dados normais e contar
            const listResp = await supabase
              .from("historico_operacoes")
              .select("id")
              .eq("user_id", user.id)
              .eq("data", today);
            if (listResp.data && Array.isArray(listResp.data)) {
              sessionNumber = (listResp.data.length || 0) + 1;
            }
          }
        } catch (err) {
          console.warn(
            "saveDailyHistory: falha ao contar sessões (fallback):",
            err
          );
          sessionNumber = 1; // fallback seguro
        }

        const sessionName = `Sessão ${sessionNumber}`;

        const sessionData = {
          user_id: user.id,
          data: today,
          sessao: sessionName,
          banca_inicial: config.initialBankroll,
          banca_final: bankrollRef.current,
          lucro_total: totalProfitRef.current,
          status,
          operacoes: JSON.stringify(safeOperations),
        };

        // 🔹 Insere nova sessão no banco
        const insertResp = await supabase
          .from("historico_operacoes")
          .insert(sessionData)
          .select("id"); // 🔹 Retorna apenas o ID do registro inserido

        if (insertResp.error) {
          // log completo para debugging
          console.error(
            "saveDailyHistory: erro ao inserir sessão:",
            insertResp.error
          );
          console.error("Payload enviado:", sessionData);
          toast.error(
            "Erro ao salvar sessão no histórico. Veja console para detalhes."
          );
          return;
        }

        // 🔹 Pega o ID da sessão que acabamos de criar
        const newHistoricoId = insertResp.data?.[0]?.id;
        if (!newHistoricoId) {
          toast.error("Falha ao obter ID da sessão para salvar operações.");
          return;
        }

        // 🔹 Prepara as operações individuais para inserção em lote
        const individualOpsToSave = operationsRef.current.map((op) => ({
          user_id: user.id,
          historico_id: newHistoricoId, // ⬅️ VINCULANDO A OPERAÇÃO À SESSÃO!
          entry_value: op.entryValue,
          result: op.result,
          profit_loss: op.profitLoss,
          bankroll_after: op.bankrollAfter,
        }));

        // 🔹 Insere todas as operações individuais de uma vez
        const { error: opsError } = await supabase
          .from("operacoes_individuais")
          .insert(individualOpsToSave);

        if (opsError) {
          console.error("Erro ao salvar operações individuais:", opsError);
          toast.error("Sessão salva, mas as operações individuais falharam.");
        }

        // sucesso
        setIsSessionSaved(true);
        toast.success(`💾 Histórico salvo com sucesso (${sessionName})!`);
      } catch (err) {
        console.error("saveDailyHistory: erro inesperado:", err);
        toast.error("Erro inesperado ao salvar histórico. Ver console.");
      }
    },
    [config, user, goalReached, stopLossReached] // Removido bankroll e totalProfit para evitar stale state
  );

  useEffect(() => {
<<<<<<< HEAD
    // 🔹 CORREÇÃO: Só verifica meta/stop se houver configuração E operações.
    if (!config || operations.length === 0) return;
=======
     if (!config || operations.length === 0) return;
>>>>>>> c5a74bfac94adbf4976c9ccb1ccc23f763a6c25b

    // Calcula lucro atual
    let currentProfit = bankroll - config.initialBankroll;
    let adjustedBankroll = bankroll;

    // Limite de ganho e perda
    const goalValue = (config.initialBankroll * config.dailyGoal) / 100;
    const lossLimit = (config.initialBankroll * config.stopLoss) / 100;

    let status: "Meta" | "Stop" | "Em aberto" = "Em aberto";

    // Meta atingida
    if (currentProfit >= goalValue && !goalReached) {
      status = "Meta";
      setGoalReached(true);
      toast.success(
        "🎯 Meta diária atingida! Parabéns, hora de encerrar o dia.",
        {
          duration: 5000,
        }
      );

      // ✅ Mantém o lucro real do dia
      adjustedBankroll = bankroll; // banca atual real
      currentProfit = adjustedBankroll - config.initialBankroll;
      setBankroll(adjustedBankroll);
      setTotalProfit(currentProfit);
      saveDailyHistory(status);
      return; // já finaliza o effect
    }

    // Stop Loss atingido
    if (currentProfit <= -lossLimit && !stopLossReached) {
      status = "Stop";
      setStopLossReached(true);
      toast.error(
        "⚠️ Stop Loss atingido! Reavalie suas operações antes de continuar.",
        { duration: 5000 }
      );

      // Ajusta banca e lucro para refletir o stop loss
      adjustedBankroll = config.initialBankroll - lossLimit;
      currentProfit = -lossLimit;

      setBankroll(adjustedBankroll);
      setTotalProfit(currentProfit);
      saveDailyHistory(status);
      return; // já finaliza o effect
    }

    // Atualiza lucro normal se ainda não atingiu meta ou stop
    setTotalProfit(currentProfit);
  }, [
    bankroll,
    config,
    goalReached,
    stopLossReached,
    saveDailyHistory,
    operations.length,
  ]);

  // Salva a sessão quando o usuário sai da página
  useBeforeUnload(useCallback(() => saveDailyHistory(), [saveDailyHistory]));

  const handleWin = () => {
    if (!config) return;

    const profit = currentEntry * (config.payout / 100);
    const newBankroll = bankroll + profit;
    const initialEntry =
      (config.initialBankroll * config.entryPercentage) / 100;

    setOperations((prevOps) => [
      {
        id: Date.now(),
        entryValue: currentEntry,
        result: "win",
        profitLoss: profit,
        bankrollAfter: newBankroll,
        timestamp: new Date(),
      },
      ...prevOps,
    ]);
    setBankroll(newBankroll);
    setCurrentEntry(initialEntry);
    setIsSessionSaved(false); // Permite salvar novamente após nova operação

    toast.success(`✅ Win! +R$ ${profit.toFixed(2)}`, {
      duration: 2000,
    });
  };

  const handleLoss = () => {
    if (!config) return;

    const loss = currentEntry;
    const newBankroll = bankroll - loss;

    // Cálculo de Martingale: próxima entrada recupera a perda + gera lucro
    const desiredProfit =
      (config.initialBankroll * config.entryPercentage) / 100;
    const nextEntry = (currentEntry + desiredProfit) / (config.payout / 100);

    setOperations((prevOps) => [
      {
        id: Date.now(),
        entryValue: currentEntry,
        result: "loss",
        profitLoss: -loss,
        bankrollAfter: newBankroll,
        timestamp: new Date(),
      },
      ...prevOps,
    ]);
    setBankroll(newBankroll);
    setCurrentEntry(nextEntry);
    setIsSessionSaved(false); // Permite salvar novamente após nova operação

    toast.error(`❌ Loss! -R$ ${loss.toFixed(2)}`, {
      duration: 2000,
    });
  };

  const handleConservativeLoss = () => {
    if (!config) return;

    const loss = currentEntry;
    const newBankroll = bankroll - loss;

    // Lógica conservadora: retorna para a entrada inicial, igual ao 'handleWin'
    const initialEntry =
      (config.initialBankroll * config.entryPercentage) / 100;

    setOperations((prevOps) => [
      {
        id: Date.now(),
        entryValue: currentEntry,
        result: "loss", // O resultado ainda é uma perda
        profitLoss: -loss,
        bankrollAfter: newBankroll,
        timestamp: new Date(),
      },
      ...prevOps,
    ]);
    setBankroll(newBankroll);
    setCurrentEntry(initialEntry); // ⬅️ AQUI ESTÁ A DIFERENÇA
    setIsSessionSaved(false);

    toast.error(`❌ Loss (Conservador)! -R$ ${loss.toFixed(2)}`, {
      duration: 2000,
    });
  };

  const handleReset = () => {
    if (!config) return;

    saveDailyHistory(); // Salva a sessão atual antes de resetar

    setBankroll(config.initialBankroll);
    setCurrentEntry((config.initialBankroll * config.entryPercentage) / 100);
    setOperations([]);
    setTotalProfit(0);
    setGoalReached(false);
    setStopLossReached(false);
    setIsSessionSaved(false);

    toast.info("🔄 Banca resetada para novo dia de operações");
  };

  const handleClearHistory = () => {
    setOperations([]);
    toast.info("🗑️ Histórico limpo");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Desconectado com sucesso");
    navigate("/");
  };

  const handleGoToLanding = () => {
    navigate("/?fromApp=true"); // Navega para a landing page com um sinalizador
  };

  const progressPercentage = config
    ? (totalProfit / ((config.initialBankroll * config.dailyGoal) / 100)) * 100
    : 0;

  if (!config) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Calculadora Inteligente de Trade Binário
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gerencie suas operações com precisão, controle de risco e cálculos
              automáticos de Martingale
            </p>
          </div>

          <ConfigPanel onConfigSubmit={setConfig} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1" />
            <div className="inline-flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Calculadora de Trade Binário
              </h1>
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/historico")}
                className="border-primary/20"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/settings")}
                className="border-primary/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
              {/* Novo botão para ir para a Landing Page */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoToLanding}
                className="border-primary/20"
                title="Ir para a Página Inicial"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-primary/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <StatsDisplay
          bankroll={bankroll}
          totalProfit={totalProfit}
          progressPercentage={progressPercentage}
          config={config}
          goalReached={goalReached}
          stopLossReached={stopLossReached}
        />

        <TradeControls
          currentEntry={currentEntry}
          onWin={handleWin}
          onLoss={handleLoss}
          onConservativeLoss={handleConservativeLoss} // ⬅️ Passando a nova função
          onReset={handleReset}
          disabled={goalReached || stopLossReached}
        />

        <HistoryTable
          operations={operations}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
};

export default Index;

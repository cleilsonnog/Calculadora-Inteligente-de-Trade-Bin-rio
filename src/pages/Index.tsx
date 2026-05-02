import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { ConfigPanel } from "../components/ConfigPanel";
import { TradeControls } from "../components/TradeControls";
import { StatsDisplay } from "../components/StatsDisplay";
import { HistoryTable } from "../components/HistoryTable";
import { BankManagement } from "../components/BankManagement";
import { EvolutionChart } from "../components/EvolutionChart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp,
  Settings,
  LogOut,
  History,
  Home,
  Repeat,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

export interface ConfigValue {
  value: number;
  type: "percentage" | "currency";
}

export interface TradeConfig {
  payout: number;
  initialBankroll: number;
  entry: ConfigValue;
  dailyGoal: ConfigValue;
  stopLoss: ConfigValue;
}

// 🔹 Interface para a estrutura de configuração antiga (para migração)
export interface OldTradeConfig {
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

type TradeMode = "real" | "training";

// 🔹 Componente interno que gerencia a sessão ativa (isolada por modo)
const TradeSession = ({
  mode,
  onToggleMode,
}: {
  mode: TradeMode;
  onToggleMode: () => void;
}) => {
  const navigate = useNavigate();

  // 🔹 Helper para gerar chaves de storage únicas por modo
  const storageKey = (key: string) => `session:${mode}:${key}`;

  const [bankroll, setBankroll] = useLocalStorageState(
    storageKey("bankroll"),
    0
  );
  const [currentEntry, setCurrentEntry] = useLocalStorageState(
    storageKey("currentEntry"),
    0
  );
  const [operations, setOperations] = useLocalStorageState<TradeOperation[]>(
    storageKey("operations"),
    []
  );
  const [totalProfit, setTotalProfit] = useLocalStorageState(
    storageKey("totalProfit"),
    0
  );
  const [goalReached, setGoalReached] = useLocalStorageState(
    storageKey("goalReached"),
    false
  );
  const [stopLossReached, setStopLossReached] = useLocalStorageState(
    storageKey("stopLossReached"),
    false
  );
  const [isSessionSaved, setIsSessionSaved] = useLocalStorageState(
    storageKey("isSessionSaved"),
    false
  );
  const [capitalAdjustment, setCapitalAdjustment] = useLocalStorageState(
    storageKey("capitalAdjustment"),
    0
  );

  // O usuário e o estado de carregamento agora são gerenciados por AuthContext e ProtectedRoute.
  // Este componente apenas reage à presença de um usuário e configuração.
  const { session } = useAuth();
  const {
    config,
    loading: configLoading,
    setConfig: setGlobalConfig,
  } = useConfig(); // Usando o contexto
  const user = session?.user; // Mantém a referência ao usuário

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
    if (config) {
      let initialEntry = 0;
      if (config.entry.type === "percentage") {
        initialEntry = (config.initialBankroll * config.entry.value) / 100;
      } else {
        initialEntry = config.entry.value;
      }

      // Apenas define os valores iniciais se não houver operações salvas
      if (operations.length === 0 && bankroll === 0) {
        setCurrentEntry(initialEntry);
        setBankroll(config.initialBankroll);
      }
    }
  }, [config, operations.length, setBankroll, setCurrentEntry, bankroll]);

  const saveDailyHistory = useCallback(
    async (
      statusOverride?: "Meta" | "Stop",
      profitOverride?: number,
      bankrollOverride?: number
    ) => {
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
            .from("historico_operacoes") // Sempre contamos do histórico real para nomear a sessão
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

        // 🔹 Usa os valores sobrescritos (se fornecidos) ou os valores atuais das refs
        const finalProfit =
          profitOverride !== undefined
            ? profitOverride
            : totalProfitRef.current;
        const finalBankroll =
          bankrollOverride !== undefined
            ? bankrollOverride
            : bankrollRef.current;

        const sessionData = {
          user_id: user.id,
          data: today,
          sessao: sessionName,
          banca_inicial: config.initialBankroll,
          banca_final: finalBankroll,
          lucro_total: finalProfit,
          status,
          operacoes: JSON.stringify(safeOperations),
          mode: mode, // ⬅️ SALVANDO O MODO ATUAL
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

        // 🔹 Prepara as operações individuais para inserção em lote (inverte para ordem cronológica)
        const individualOpsToSave = [...operationsRef.current].reverse().map((op) => ({
          user_id: user.id,
          historico_id: newHistoricoId, // ⬅️ VINCULANDO A OPERAÇÃO À SESSÃO!
          entry_value: op.entryValue,
          result: op.result,
          profit_loss: op.profitLoss,
          bankroll_after: op.bankrollAfter,
          // A coluna 'mode' não é necessária aqui, pois a operação está vinculada ao histórico
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
    [config, user, goalReached, stopLossReached, mode, setIsSessionSaved]
  );

  // 🔹 NOVA FUNÇÃO: Atualiza a banca inicial na configuração do usuário
  const updateInitialBankroll = useCallback(
    async (newBankroll: number) => {
      if (!user || !config || mode !== "real") return; // 🔹 Só atualiza config se for conta REAL

      // 🔹 CORREÇÃO: Arredonda o valor para duas casas decimais ANTES de salvar.
      const roundedNewBankroll = parseFloat(newBankroll.toFixed(2));

      const newConfig: TradeConfig = {
        ...config,
        initialBankroll: roundedNewBankroll,
      };

      const { error } = await supabase
        .from("user_configs")
        .update({ initial_bankroll: roundedNewBankroll })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar a banca inicial:", error);
        toast.error("Falha ao atualizar a banca para a próxima sessão.");
      } else {
        // Atualiza o estado global da configuração para refletir a mudança
        setGlobalConfig(newConfig);
        toast.info(
          `💰 Banca inicial da próxima sessão atualizada para R$ ${roundedNewBankroll.toFixed(
            2
          )}`
        );
      }
    },
    [user, config, setGlobalConfig, mode]
  );

  const handleCapitalAdjustment = useCallback(
    async (amount: number, type: "deposito" | "saque") => {
      if (!user || !config || amount <= 0) return;

      const adjustment = type === "deposito" ? amount : -amount;

      if (type === "saque" && bankroll < amount) {
        toast.error("Saldo insuficiente para realizar o saque.");
        return;
      }

      // 1. Registra a transação no banco de dados
      const { error: transactionError } = await supabase
        .from("transacoes_banca")
        .insert({
          user_id: user.id,
          tipo: type,
          valor: amount,
        });

      if (transactionError) {
        console.error(`Erro ao registrar ${type}:`, transactionError);
        toast.error(`Falha ao registrar ${type}.`);
        return;
      }

      // 2. Atualiza a banca e o ajuste de capital
      const newBankroll = bankroll + adjustment;
      const newCapitalAdjustment = capitalAdjustment + adjustment;
      setBankroll(newBankroll);
      setCapitalAdjustment(newCapitalAdjustment);

      // 3. Atualiza a configuração de banca inicial para a PRÓXIMA sessão
      updateInitialBankroll(newBankroll);

      toast.success(
        `🚀 ${
          type === "deposito" ? "Depósito" : "Saque"
        } de R$ ${amount.toFixed(2)} realizado com sucesso!`
      );
    },
    [
      user,
      config,
      bankroll,
      capitalAdjustment,
      setBankroll,
      setCapitalAdjustment,
      updateInitialBankroll,
    ]
  );

  const handleDeposit = (amount: number) =>
    handleCapitalAdjustment(amount, "deposito");
  const handleWithdrawal = (amount: number) =>
    handleCapitalAdjustment(amount, "saque");

  useEffect(() => {
    // 🔹 CORREÇÃO: Só verifica meta/stop se houver configuração E operações.
    if (!config || operations.length === 0) return;

    // Calcula lucro atual
    // 🔹 CORREÇÃO: Usa 'bankroll' do estado atual, pois bankrollRef pode estar desatualizado neste ciclo
    let currentProfit = bankroll - config.initialBankroll - capitalAdjustment;
    let adjustedBankroll = bankroll;

    // Limite de ganho e perda
    const goalValue =
      config.dailyGoal.type === "percentage"
        ? (config.initialBankroll * config.dailyGoal.value) / 100
        : config.dailyGoal.value;
    const lossLimit =
      config.stopLoss.type === "percentage"
        ? (config.initialBankroll * config.stopLoss.value) / 100
        : config.stopLoss.value;

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
      saveDailyHistory(status, currentProfit, adjustedBankroll); // 🔹 Passa valores explícitos
      updateInitialBankroll(adjustedBankroll); // ⬅️ ATUALIZA A BANCA PARA A PRÓXIMA SESSÃO
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

      setBankroll(adjustedBankroll);
      setTotalProfit(currentProfit);
      saveDailyHistory(status, currentProfit, adjustedBankroll); // 🔹 Passa valores explícitos
      updateInitialBankroll(adjustedBankroll); // ⬅️ ATUALIZA A BANCA PARA A PRÓXIMA SESSÃO
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
    capitalAdjustment,
    updateInitialBankroll, // ⬅️ Adicionando a nova dependência
    setBankroll,
    setGoalReached,
    setStopLossReached,
    setTotalProfit,
  ]);

  // Salva a sessão quando o usuário sai da página
  useBeforeUnload(useCallback(() => saveDailyHistory(), [saveDailyHistory]));

  const handleWin = () => {
    if (!config) return;

    const profit = currentEntry * (config.payout / 100);
    const newBankroll = bankroll + profit;

    let initialEntry = 0;
    if (config.entry.type === "percentage") {
      initialEntry = (config.initialBankroll * config.entry.value) / 100;
    } else {
      initialEntry = config.entry.value;
    }

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
    let desiredProfit = 0;
    if (config.entry.type === "percentage") {
      desiredProfit = (config.initialBankroll * config.entry.value) / 100;
    } else {
      desiredProfit = config.entry.value;
    }
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
    let initialEntry = 0;
    if (config.entry.type === "percentage") {
      initialEntry = (config.initialBankroll * config.entry.value) / 100;
    } else {
      initialEntry = config.entry.value;
    }

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

  const handleReset = async (saveSession = true) => {
    if (!config) return;

    const finalBankroll = bankrollRef.current; // Captura a banca final antes de qualquer reset

    // 🔹 CORREÇÃO: Salva a sessão apenas se houver operações e não tiver sido salva ainda.
    if (saveSession && operations.length > 0 && !isSessionSaved) {
      await saveDailyHistory(); // ⬅️ AGUARDA o salvamento antes de continuar
      await updateInitialBankroll(finalBankroll); // ⬅️ ATUALIZA A BANCA PARA A PRÓXIMA SESSÃO
    }

    let initialEntry = 0;
    if (config.entry.type === "percentage") {
      initialEntry = (config.initialBankroll * config.entry.value) / 100;
    } else {
      initialEntry = config.entry.value;
    }

    setBankroll(config.initialBankroll);
    setCurrentEntry(initialEntry);
    setOperations([]);
    setTotalProfit(0);
    setGoalReached(false);
    setStopLossReached(false);
    setIsSessionSaved(false);
    setCapitalAdjustment(0);

    // 🔹 Limpa o localStorage para a próxima sessão
    localStorage.removeItem(storageKey("bankroll"));
    localStorage.removeItem(storageKey("currentEntry"));
    localStorage.removeItem(storageKey("operations"));
    localStorage.removeItem(storageKey("totalProfit"));
    localStorage.removeItem(storageKey("goalReached"));
    localStorage.removeItem(storageKey("stopLossReached"));
    localStorage.removeItem(storageKey("isSessionSaved"));
    localStorage.removeItem(storageKey("capitalAdjustment"));

    toast.info("🔄 Banca resetada para novo dia de operações");
  };

  const handleEndSession = async () => {
    if (!config || operations.length === 0) {
      toast.info("Nenhuma operação para salvar.");
      return;
    }
    if (isSessionSaved) {
      toast.info("A sessão atual já foi salva.");
      return;
    }
    // Reutiliza a lógica de reset, que já contém a chamada para saveDailyHistory
    await handleReset(true); // ⬅️ AGUARDA o reset (e o salvamento)
  };

  const handleClearHistory = () => {
    setOperations([]);
    localStorage.removeItem(storageKey("operations")); // Limpa também do localStorage
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

  const handleToggleModeClick = async () => {
    // Salva a sessão atual antes de trocar de modo
    if (operations.length > 0 && !isSessionSaved) {
      await saveDailyHistory();
    }

    onToggleMode(); // Chama a função do pai para trocar o modo

    toast.info(
      `Modo alterado para: ${mode === "real" ? "Treinamento" : "Conta Real"}`
    );
  };

  // 🔹 CORREÇÃO: Garante que `goalValue` só seja calculado se `config` existir, evitando NaN.
  const goalValue =
    config && config.dailyGoal
      ? config.dailyGoal.type === "percentage"
        ? (config.initialBankroll * config.dailyGoal.value) / 100
        : config.dailyGoal.value
      : 0;

  const progressPercentage =
    goalValue > 0 ? (totalProfit / goalValue) * 100 : 0;

  if (configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Carregando calculadora...
          </p>
        </div>
      </div>
    );
  }

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

          <ConfigPanel onConfigSubmit={setGlobalConfig} />
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
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Calculadora de Trade Binário
                </h1>
              </div>
              {/* MENSAGEM DE BOAS-VINDAS PERSONALIZADA */}
              <p className="text-sm text-muted-foreground mt-1">
                Seja bem-vindo(a),{" "}
                {session?.user?.user_metadata?.name || session?.user?.email}!
              </p>
              <p className="text-lg font-medium text-muted-foreground mt-1">
                {mode === "real" ? "Conta Real" : "Conta de Treinamento"}
              </p>
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
              {/* Novo botão para Histórico de Transações */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/historico-banca")}
                className="border-primary/20"
                title="Histórico de Transações"
              >
                <Landmark className="w-4 h-4" />
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
              {/* Botão para alternar modo */}
              <Button
                variant={mode === "training" ? "default" : "outline"}
                size="icon"
                onClick={handleToggleModeClick}
                title={`Mudar para modo ${
                  mode === "real" ? "Treinamento" : "Real"
                }`}
              >
                <Repeat className="w-4 h-4" />
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
          goalValue={goalValue}
          goalReached={goalReached}
          stopLossReached={stopLossReached}
        />

        <EvolutionChart
          operations={operations}
          initialBankroll={config.initialBankroll}
        />

        <BankManagement
          onDeposit={handleDeposit}
          onWithdraw={handleWithdrawal}
          disabled={goalReached || stopLossReached}
        />

        <TradeControls
          currentEntry={currentEntry}
          onWin={handleWin}
          onLoss={handleLoss}
          onConservativeLoss={handleConservativeLoss} // ⬅️ Passando a nova função
          onReset={handleReset}
          onEndSession={handleEndSession}
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

// 🔹 Componente Principal que gerencia apenas o estado do modo
const Index = () => {
  const [tradeMode, setTradeMode] = useLocalStorageState<TradeMode>(
    "session:tradeMode",
    "real"
  );

  return (
    <TradeSession
      key={tradeMode} // 🔹 A chave força o React a recriar o componente quando o modo muda
      mode={tradeMode}
      onToggleMode={() =>
        setTradeMode((prev) => (prev === "real" ? "training" : "real"))
      }
    />
  );
};

export default Index;

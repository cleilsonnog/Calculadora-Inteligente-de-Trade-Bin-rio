import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { TradeConfig } from "@/pages/Index";
import { toast } from "sonner";

interface ConfigContextType {
  config: TradeConfig | null;
  loading: boolean;
  refreshConfig: () => void;
  setConfig: (config: TradeConfig | null) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [config, setConfig] = useState<TradeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_configs")
        .select("*")
        .eq("user_id", session.user.id) // CORREÇÃO: Buscar pela coluna 'user_id'
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        const loadedConfig: TradeConfig = {
          payout: data.payout,
          initialBankroll: data.initial_bankroll,
          entry: data.entry,
          dailyGoal: data.daily_goal,
          stopLoss: data.stop_loss,
        };
        setConfig(loadedConfig);
      } else {
        setConfig(null); // Garante que a config seja nula se não houver no DB
      }
    } catch (error) {
      console.error("Erro ao carregar configuração de trade:", error);
      toast.error("Falha ao carregar sua configuração de trade.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = { config, loading, refreshConfig: fetchConfig, setConfig };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext"; // Importa o useAuth

interface Subscription {
  status: string | null;
  // Você pode adicionar mais campos da sua tabela 'subscriptions' aqui se precisar
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth(); // Usa o AuthContext como única fonte da verdade para a sessão
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", session.user.id)
        .in("status", ["trialing", "active"])
        .single()
        .then(({ data, error }) => {
          // Se encontrar uma assinatura, define. Se não, define como null.
          setSubscription(data ? (data as Subscription) : null);
          setLoading(false);
        });
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [session]);

  const value = { subscription, loading };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Aguarda os contextos terminarem de carregar
    if (authLoading || subscriptionLoading) return;

    // Sem sessão → redireciona para login
    if (!session) {
      navigate("/auth");
      return;
    }

    // Sessão ok, mas sem assinatura
    if (session && !subscription) {
      // Evita mostrar o toast repetidamente caso o usuário já esteja na tela inicial
      if (window.location.pathname !== "/") {
        toast.info("Sua sessão expirou ou você não tem um plano ativo.", {
          description: "Por favor, escolha um plano para continuar.",
          duration: 5000,
        });
        // Adiciona um parâmetro para evitar o loop de redirecionamento na Landing page.
        // O `replace: true` impede que o histórico do navegador fique poluído com os redirecionamentos.
        navigate("/?fromApp=true", { replace: true });
      }
    }
  }, [session, subscription, authLoading, subscriptionLoading, navigate]);

  // Enquanto carrega, exibe um loader.
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Apenas renderiza o conteúdo protegido se o carregamento terminou,
  // o usuário está logado E tem uma assinatura.
  // Em todos os outros casos, o useEffect já cuidou do redirecionamento,
  // e retornar null é seguro e evita renderizações indesejadas.
  return session && subscription ? <>{children}</> : null;
};

export default ProtectedRoute;

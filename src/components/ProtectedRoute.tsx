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

    // Verifica se o usuário tem a role de 'admin'
    const isAdmin = session.user?.app_metadata?.role === "admin";

    // Se o usuário tem sessão, mas não tem assinatura e não é admin,
    // ele deve ser enviado para a página de planos.
    if (session && !subscription && !isAdmin) {
      toast.info("Você não tem um plano ativo.", {
        description: "Por favor, escolha um plano para continuar.",
        duration: 5000,
      });
      // Redireciona para a página de planos, impedindo o acesso ao app.
      navigate("/", { replace: true });
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

  // Verifica se o usuário é admin
  const isAdmin = session?.user?.app_metadata?.role === "admin";

  // Apenas renderiza o conteúdo protegido se o carregamento terminou,
  // o usuário está logado E (tem uma assinatura OU é admin).
  // Em todos os outros casos, o useEffect já cuidou do redirecionamento,
  // e retornar null é seguro e evita renderizações indesejadas.
  return session && (subscription || isAdmin) ? <>{children}</> : null;
};

export default ProtectedRoute;

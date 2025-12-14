import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  Shield,
  History,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext"; // 1. Importar o useAuth
import { useSubscription } from "@/contexts/SubscriptionContext"; // 2. Importar o useSubscription
import { supabase } from "@/integrations/supabase/client"; //SupabaseClient retirei de dentro do bigode
import { getStripe } from "@/integrations/stripe/client";
import { Stripe } from "@stripe/stripe-js";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

interface Price {
  id: string;
  unit_amount: number;
  interval: "month" | "year";
}

const Landing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // 3. Usar os contextos para obter a sessão e a assinatura
  const { session } = useAuth();
  const { subscription } = useSubscription();

  useEffect(() => {
    // Verifica se o usuário veio do app para a landing page (para não redirecionar de volta)
    const cameFromApp =
      new URLSearchParams(window.location.search).get("fromApp") === "true";
    if (cameFromApp) {
      return;
    }

    // 4. Lógica de redirecionamento corrigida
    // Redireciona para /app APENAS se o usuário estiver logado E tiver uma assinatura ativa ou for admin.
    const isAdmin = session?.user?.app_metadata?.role === "admin";
    if (session && (subscription || isAdmin)) {
      navigate("/app");
    }
  }, [session, subscription, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const bg = document.querySelector(".landing-bg") as HTMLElement;
      if (bg) {
        const offset = window.scrollY * 0.4;
        bg.style.transform = `translateY(${offset}px) scale(1.1)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Efeito para carregar os produtos e preços do Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*, prices(*)")
        .eq("active", true)
        .eq("prices.active", true)
        .order("name");

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error("Não foi possível carregar os planos.");
        return;
      }

      if (productsData) {
        setProducts(productsData as Product[]);
      }
    };
    fetchProducts();
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: "Gerenciamento de Banca",
      description:
        "Controle total sobre sua banca com cálculos automáticos e precisos.",
    },
    {
      icon: Target,
      title: "Metas Diárias",
      description:
        "Defina e acompanhe suas metas de lucro diário com alertas automáticos.",
    },
    {
      icon: Shield,
      title: "Stop Loss Inteligente",
      description:
        "Proteção automática contra perdas excessivas com alertas em tempo real.",
    },
    {
      icon: History,
      title: "Histórico Completo",
      description:
        "Visualize e analise todas as suas operações e resultados diários.",
    },
  ];

  // Função para lidar com a navegação dos botões da landing page
  const handleAuthOrAppNavigation = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      // Se o usuário já estiver logado, leva para o app
      navigate("/app");
    } else {
      // Se não estiver logado, leva para a página de autenticação
      navigate("/auth");
    }
  }, [navigate]);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.info("Você precisa fazer login para iniciar um teste.");
        // 🔹 Redireciona para o login, mas informa para onde voltar depois
        const redirectUrl = `/auth?redirect=/checkout&priceId=${priceId}`;
        navigate(redirectUrl);
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        { body: { priceId } }
      );

      if (error) throw error;

      // Redireciona para a URL de checkout do Stripe
      window.location.href = data.url;
    } catch (error: unknown) {
      console.error("Error during checkout:", error);

      if (error instanceof Error) {
        toast.error("Ocorreu um erro ao iniciar o pagamento.", {
          description: error.message,
        });
      } else {
        toast.error("Ocorreu um erro inesperado ao iniciar o pagamento.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fundo com Parallax */}
      <div
        className="landing-bg absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}forex.jpg')`,
          filter: "brightness(1.8)",
        }}
      />
      {/* Brilho animado flutuante */}
      <div className="absolute inset-0 z-5 overflow-hidden">
        <div className="absolute w-72 h-72 bg-primary/20 blur-3xl rounded-full animate-pulse-slow top-1/4 left-1/3" />
        <div className="absolute w-96 h-96 bg-accent/20 blur-3xl rounded-full animate-pulse-slow bottom-1/4 right-1/3" />
      </div>

      {/* Gradiente escuro sobre o fundo */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/70 via-background/90 to-background" />

      {/* Conteúdo */}
      <div className="relative z-20">
        {/* HERO */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="space-y-6 animate-fade-slide-down">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent drop-shadow-md">
              Calculadora Suprema de Trader
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Gerencie sua banca e acompanhe seu desempenho com precisão
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              Aqui está uma ferramenta para ajudar você a gerenciar sua banca,
              definir metas e manter um histórico completo de operações.
            </p>

            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={handleAuthOrAppNavigation}
            >
              Começar Agora
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Funcionalidades
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/10 animate-fade-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* SEÇÃO DE PLANOS */}
        <section id="planos" className="container mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Escolha o Plano Ideal para Você
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Comece com 7 dias gratuitos. Cancele a qualquer momento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-8 max-w-4xl mx-auto">
            {products.length > 0 ? (
              products
                .flatMap((product) =>
                  product.prices.map((price) => ({ product, price }))
                )
                .map(({ product, price }) => (
                  <Card
                    key={price.id}
                    className="p-8 border-primary/50 shadow-lg w-full max-w-sm text-center transform hover:scale-105 transition-transform duration-300 mx-auto"
                  >
                    <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                    <p className="text-muted-foreground mb-6 h-12">
                      {price.interval === "month"
                        ? "Acesso mensal completo"
                        : "Acesso anual com desconto"}
                    </p>

                    <div className="mb-6">
                      <p className="text-4xl font-extrabold">
                        R$ {(price.unit_amount / 100).toFixed(2)}
                        <span className="text-lg font-medium">
                          /{price.interval === "month" ? "mês" : "ano"}
                        </span>
                      </p>
                      <Button
                        size="lg"
                        className="w-full mt-4"
                        variant={
                          price.interval === "year" ? "outline" : "default"
                        }
                        onClick={() => handleCheckout(price.id)}
                        disabled={loading === price.id}
                      >
                        {loading === price.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : price.interval === "month" ? (
                          "Começar Teste Gratuito"
                        ) : (
                          "Economize com o Anual"
                        )}
                      </Button>
                    </div>
                  </Card>
                ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                Carregando planos...
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-24 bg-primary/5 rounded-3xl my-16 text-center">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold">
              Por que usar nossa calculadora?
            </h2>
            <p className="text-lg text-muted-foreground">
              Para quem busca profissionalismo e controle total sobre suas
              operações. Com cálculos automáticos, gerenciamento de risco e
              histórico detalhado, você terá todas as ferramentas para crescer
              com consistência.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-6"
              onClick={handleAuthOrAppNavigation}
            >
              Acessar Plataforma
            </Button>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="border-t border-border mt-16">
          <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Calculadora Suprema de Trader. Todos os direitos
              reservados.
            </p>
            <div className="flex gap-6 text-sm">
              {/*<a
                href="mailto:cleilsonnogueira45@gmail.com?subject=Suporte - Calculadora de Trade"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Suporte
              </a>*/}
              <a
                href="mailto:cleilsonnogueira45@gmail.com?subject=Contato - Calculadora de Trade"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
              <a
                onClick={() => navigate("/termos-de-uso")}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Termos de Uso
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;

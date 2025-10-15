import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Target, Shield, History } from "lucide-react";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();

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
              Calculadora Inteligente de Trade Binário
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
              onClick={() => navigate("/auth")}
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

        {/* Benefícios */}
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
              onClick={() => navigate("/auth")}
            >
              Acessar Plataforma
            </Button>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="border-t border-border mt-16">
          <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Calculadora Inteligente de Trade Binário. Todos os direitos
              reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Suporte
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
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

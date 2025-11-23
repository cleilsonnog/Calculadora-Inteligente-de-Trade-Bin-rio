import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto animate-fade-in">
        <Button
          variant="outline"
          onClick={() => navigate(-1)} // Volta para a página anterior
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl md:text-3xl">
                Termos de Uso
              </CardTitle>
            </div>
            <CardDescription>
              Última atualização: 22 de Novembro de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e utilizar a Calculadora Inteligente de Trade Binário
                ("Plataforma"), você aceita e concorda em estar sujeito a estes
                Termos de Uso. Se você não concorda com estes termos, não deve
                utilizar a plataforma.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                2. Natureza da Ferramenta e Isenção de Responsabilidade
              </h2>
              <p>
                A Plataforma é uma ferramenta de auxílio para cálculos e
                gerenciamento de operações de trade. Ela não oferece
                recomendações de investimento, sinais de compra ou venda, nem
                garante qualquer tipo de lucro.
              </p>
              <p className="mt-2">
                <strong>
                  A responsabilidade por todas as operações financeiras,
                  decisões de investimento, perdas ou ganhos é inteira e
                  exclusivamente do usuário.
                </strong>{" "}
                Não nos responsabilizamos, sob nenhuma circunstância, por
                quaisquer perdas financeiras que o usuário venha a sofrer ao
                utilizar as informações ou cálculos fornecidos por esta
                ferramenta.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                3. Uso da Plataforma
              </h2>
              <p>
                Você concorda em utilizar a plataforma de forma legal e para os
                fins a que se destina. É proibido o uso da plataforma para
                atividades ilícitas ou que violem os direitos de terceiros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;

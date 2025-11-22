import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // ⬅️ NOVO ESTADO PARA O NOME
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        // Redireciona para a página principal. A própria Landing Page ou a ProtectedRoute
        // decidirá para onde o usuário deve ir (planos ou app).
        navigate("/");
      } else {
        // Handle Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name, // ⬅️ SALVANDO O NOME NO METADADO DO USUÁRIO
            },
          },
        });
        if (error) throw error;
        toast.info(
          "Cadastro realizado! Verifique seu e-mail para confirmar a conta."
        );
        // Volta para a tela de login após o cadastro
        setIsLogin(true);
      }
    } catch (error: unknown) {
      // Narrow unknown to extract a user-friendly message without using `any`
      let message = "Ocorreu um erro.";
      if (error instanceof Error) {
        message = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error_description" in error &&
        typeof (error as { error_description?: unknown }).error_description ===
          "string"
      ) {
        message = (error as { error_description?: string }).error_description;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in border-primary/20">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <LogIn className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl">
              {isLogin ? "Acessar Plataforma" : "Criar Conta"}
            </CardTitle>
          </div>
          <CardDescription>
            {isLogin
              ? "Insira seus dados para continuar."
              : "Crie sua conta para começar a usar a calculadora."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && ( // ⬅️ MOSTRA O CAMPO DE NOME APENAS NO CADASTRO
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => {
              setIsLogin(!isLogin);
              setName(""); // Limpa o campo de nome ao alternar
            }}
          >
            {isLogin
              ? "Não tem uma conta? Cadastre-se"
              : "Já tem uma conta? Faça login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;

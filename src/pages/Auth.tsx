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
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(""); // ⬅️ NOVO ESTADO PARA O NOME
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Função para redirecionar para o checkout
  const redirectToCheckout = async (priceId: string) => {
    toast.info("Redirecionando para o checkout...");
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        { body: { priceId } }
      );

      if (error) throw error;

      // Redireciona para a URL de checkout do Stripe
      window.location.href = data.url;
    } catch (error: unknown) {
      console.error("Error during checkout redirect:", error);
      let message = "Ocorreu um erro ao iniciar o pagamento.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setLoading(false); // Libera o botão em caso de erro
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const searchParams = new URLSearchParams(location.search);
    const redirectTo = searchParams.get("redirect");
    const priceId = searchParams.get("priceId");

    try {
      if (isLogin) {
        // Handle Login
        const {
          data: { session },
          error,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (session && redirectTo === "/checkout" && priceId) {
          await redirectToCheckout(priceId);
        } else {
          toast.success("Login realizado com sucesso!");
          navigate("/app");
        }
      } else {
        // Handle Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;

        // 🔹 VERIFICAÇÃO DE E-MAIL EXISTENTE
        // Se o usuário já existe (identities.length > 0) mas a sessão é nula,
        // significa que a conta existe mas não foi confirmada ou a senha está errada.
        if (
          data.user &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          // Se o cadastro foi para um checkout, loga o usuário e redireciona
          if (data.user && redirectTo === "/checkout" && priceId) {
            toast.success("Cadastro realizado!");
            await redirectToCheckout(priceId);
          } else {
            toast.info(
              "Cadastro realizado! Verifique seu e-mail para confirmar a conta."
            );
            // Volta para a tela de login após o cadastro
            setIsLogin(true);
          }
        } else {
          toast.warning("Este e-mail já está cadastrado. Tente fazer o login.");
        }
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <Link
                    to="/recuperar-senha"
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
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

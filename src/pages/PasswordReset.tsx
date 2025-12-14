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
import { Loader2, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // Rota para onde o usuário será redirecionado após clicar no link do e-mail
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link de recuperação enviado!");
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in border-primary/20">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          </div>
          <CardDescription>
            {sent
              ? "Verifique sua caixa de entrada para o link de redefinição."
              : "Digite seu e-mail para receber um link de recuperação."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Enviar Link"}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Se um usuário com este e-mail existir, um link será enviado.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link to="/auth">Voltar para o login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordReset;

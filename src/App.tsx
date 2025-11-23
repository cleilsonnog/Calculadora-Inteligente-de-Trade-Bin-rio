import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";
import DailyHistory from "./pages/DailyHistory";
import { supabase } from "./integrations/supabase/client"; // Ajuste o caminho se necessário
import ProtectedRoute from "./components/ProtectedRoute"; // 🔹
import { AuthProvider } from "./contexts/AuthContext"; // 🔹
import { SubscriptionProvider } from "./contexts/SubscriptionContext"; // 🔹
import { ConfigProvider } from "./contexts/ConfigContext";
import TermsOfUse from "./pages/TermsOfUse";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // A página de Auth agora lida com o redirecionamento pós-login.
      // Este listener agora só cuida do logout.
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/termos-de-uso" element={<TermsOfUse />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <DailyHistory />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* 🔹 Envolve as rotas com os providers para que os contextos fiquem disponíveis */}
        <AuthProvider>
          <SubscriptionProvider>
            <ConfigProvider>
              <AppRoutes />
            </ConfigProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

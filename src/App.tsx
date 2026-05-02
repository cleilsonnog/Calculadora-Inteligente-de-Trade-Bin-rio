import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./integrations/supabase/client"; // Ajuste o caminho se necessário
import ProtectedRoute from "./components/ProtectedRoute"; // 🔹
import { AuthProvider } from "./contexts/AuthContext"; // 🔹
import { SubscriptionProvider } from "./contexts/SubscriptionContext"; // 🔹
import { ConfigProvider } from "./contexts/ConfigContext";

// 🔹 Lazy Loading para Code Splitting (Otimização de Build)
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DailyHistory = lazy(() => import("./pages/DailyHistory"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/recuperar-senha" element={<PasswordReset />} />
        <Route path="/update-password" element={<Auth />} />
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
        <Route
          path="/historico-banca"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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

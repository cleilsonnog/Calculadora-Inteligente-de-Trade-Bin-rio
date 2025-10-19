-- Criar tabela para operações individuais
CREATE TABLE public.operacoes_individuais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  historico_id UUID REFERENCES public.historico_operacoes(id) ON DELETE SET NULL, -- Opcional, para vincular à sessão
  entry_value NUMERIC(10, 2) NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  profit_loss NUMERIC(10, 2) NOT NULL,
  bankroll_after NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_operacoes_individuais_user_id ON public.operacoes_individuais(user_id);
CREATE INDEX idx_operacoes_individuais_historico_id ON public.operacoes_individuais(historico_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.operacoes_individuais ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para permitir que usuários gerenciem suas próprias operações
CREATE POLICY "Allow user to manage their own individual operations"
ON public.operacoes_individuais FOR ALL
TO authenticated USING (auth.uid() = user_id);


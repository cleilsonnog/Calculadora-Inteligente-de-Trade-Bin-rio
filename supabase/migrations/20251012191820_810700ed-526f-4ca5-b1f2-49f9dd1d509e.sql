-- Criar tabela de histórico de operações diárias
CREATE TABLE public.historico_operacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  sessao TEXT, -- 🆕 Nova coluna para identificar sessões no mesmo dia
  banca_inicial NUMERIC(10, 2) NOT NULL,
  banca_final NUMERIC(10, 2) NOT NULL,
  lucro_total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Meta', 'Stop', 'Em aberto')),
  observacoes TEXT,
  operacoes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para busca
CREATE INDEX idx_historico_operacoes_data ON public.historico_operacoes(data DESC);
CREATE INDEX idx_historico_operacoes_user_id ON public.historico_operacoes(user_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_historico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_historico_operacoes_updated_at
BEFORE UPDATE ON public.historico_operacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_historico_updated_at();

-- Habilitar Row Level Security (RLS) na tabela
ALTER TABLE public.historico_operacoes ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que usuários insiram seus próprios registros
CREATE POLICY "Allow authenticated user to insert their own history"
ON public.historico_operacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Criar política para permitir que usuários leiam seus próprios registros
CREATE POLICY "Allow authenticated user to read their own history"
ON public.historico_operacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Criar política para permitir que usuários atualizem seus próprios registros
CREATE POLICY "Allow authenticated user to update their own history"
ON public.historico_operacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
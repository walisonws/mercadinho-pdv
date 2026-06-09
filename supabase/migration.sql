-- Migration para banco JÁ EXISTENTE
-- Execute no Supabase: SQL Editor > New query

-- Novas colunas em pdv_produtos
alter table pdv_produtos
  add column if not exists custo_compra float not null default 0,
  add column if not exists codigos_alternativos jsonb default '[]'::jsonb;

-- Estoque por peso (kg) precisa de casas decimais → muda int para numeric.
-- (Sem isso, vender 0,5 kg é arredondado para inteiro no banco.)
alter table pdv_produtos
  alter column estoque type numeric,
  alter column estoque_minimo type numeric;

-- Novas colunas em pdv_vendas
alter table pdv_vendas
  add column if not exists operador_id text,
  add column if not exists operador_nome text;

-- Nova tabela de operadores
create table if not exists pdv_operadores (
  id text primary key,
  loja_id text not null,
  nome text not null,
  pin text not null,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);
create index if not exists idx_pdv_operadores_loja on pdv_operadores(loja_id);

-- Desabilitar RLS em pdv_operadores (igual ao pdv_clientes — sem isso gravações falham silenciosamente)
alter table pdv_operadores disable row level security;

-- Habilitar Realtime para pdv_operadores
alter publication supabase_realtime add table pdv_operadores;

-- Tabela de controle de clientes (painel admin)
create table if not exists pdv_clientes (
  loja_id text primary key,
  status text not null default 'ativo', -- ativo, vitalicio, trial, suspenso
  data_vencimento date,
  observacao text default '',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
create index if not exists idx_pdv_clientes_status on pdv_clientes(status);

-- IMPORTANTE: desabilita RLS em pdv_clientes para o painel admin funcionar
-- O Supabase habilita RLS por padrão em novas tabelas, bloqueando o upsert com anon_key
alter table pdv_clientes disable row level security;

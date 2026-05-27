-- Migration para banco JÁ EXISTENTE
-- Execute no Supabase: SQL Editor > New query

-- Novas colunas em pdv_produtos
alter table pdv_produtos
  add column if not exists custo_compra float not null default 0,
  add column if not exists codigos_alternativos jsonb default '[]'::jsonb;

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

-- Habilitar Realtime para pdv_operadores:
-- Supabase Dashboard > Database > Replication > habilitar pdv_operadores

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

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

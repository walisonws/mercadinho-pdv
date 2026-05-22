-- Execute este SQL no painel do Supabase: SQL Editor > New query
-- Para banco NOVO: rode tudo. Para banco existente: rode apenas supabase/migration.sql

create table if not exists pdv_produtos (
  id text primary key,
  loja_id text not null,
  nome text not null,
  codigo text not null,
  tipo text not null default 'unidade',
  preco float not null default 0,
  custo_compra float not null default 0,
  categoria text not null default 'mercearia',
  ativo boolean not null default true,
  estoque int not null default 0,
  estoque_minimo int not null default 0,
  codigos_alternativos jsonb default '[]'::jsonb
);
create index if not exists idx_pdv_produtos_loja on pdv_produtos(loja_id);

create table if not exists pdv_vendas (
  id text primary key,
  loja_id text not null,
  itens jsonb not null default '[]',
  total float not null default 0,
  pagamento text not null,
  valor_recebido float,
  troco float,
  data timestamptz not null default now(),
  operador_id text,
  operador_nome text
);
create index if not exists idx_pdv_vendas_loja on pdv_vendas(loja_id);

create table if not exists pdv_config (
  loja_id text primary key,
  nome_mercadinho text default 'Meu Mercadinho',
  endereco text default '',
  telefone text default ''
);

create table if not exists pdv_listas (
  id text primary key,
  loja_id text not null,
  nome text not null,
  status text not null default 'aberta',
  itens jsonb not null default '[]',
  data_criacao timestamptz default now(),
  data_conclusao timestamptz
);
create index if not exists idx_pdv_listas_loja on pdv_listas(loja_id);

create table if not exists pdv_operadores (
  id text primary key,
  loja_id text not null,
  nome text not null,
  pin text not null,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);
create index if not exists idx_pdv_operadores_loja on pdv_operadores(loja_id);

-- Habilitar Realtime para todas as tabelas:
-- Supabase Dashboard > Database > Replication > habilitar pdv_produtos, pdv_vendas, pdv_config, pdv_listas, pdv_operadores

-- Desabilitar confirmação de e-mail (para facilitar testes):
-- Supabase Dashboard > Authentication > Settings > desativar "Enable email confirmations"

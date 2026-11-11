-- Opcional: o servidor já cria isso sozinho ao subir. Use este arquivo no
-- SQL Editor do Supabase se preferir criar as tabelas antes.

create table if not exists ocorrencias (
  id text primary key,
  data date not null,
  loja text not null,
  regional text default '',
  descricao text not null,
  "valorRecuperado" numeric default 0,
  quadrilha boolean default false,
  nome text default '',
  inibido boolean default false,
  "apoioCopia" boolean default false,
  monitoramento boolean default false,
  confirmado boolean default false,
  "confirmadoPor" text default '',
  "confirmadoEm" timestamptz,
  "criadoEm" timestamptz default now(),
  foto text,
  "faceId" boolean default false,
  produtos jsonb default '[]'::jsonb,
  subprodutos jsonb default '[]'::jsonb
);

create table if not exists faceid_testes (
  id text primary key,
  data date not null,
  regional text not null,
  avaliador text default '',
  resultados jsonb default '{}'::jsonb,
  "atualizadoPor" text default '',
  "atualizadoEm" timestamptz default now()
);

create table if not exists configuracoes (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  "atualizadoEm" timestamptz default now()
);

-- Segurança: bloqueia acesso pela API pública do Supabase (chave anon).
-- O servidor Node conecta como postgres e ignora o RLS.
alter table ocorrencias enable row level security;
alter table faceid_testes enable row level security;
alter table configuracoes enable row level security;

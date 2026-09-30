alter table public.compras
  add column if not exists custo_transporte numeric(12,2) not null default 0,
  add column if not exists custo_reparo numeric(12,2) not null default 0,
  add column if not exists custo_limpeza numeric(12,2) not null default 0,
  add column if not exists custo_taxas numeric(12,2) not null default 0,
  add column if not exists outros_custos numeric(12,2) not null default 0,
  add column if not exists custos_observacao text,
  add column if not exists preco_minimo_venda numeric(12,2),
  add column if not exists situacao_estoque text not null default 'em_estoque',
  add column if not exists observacoes text,
  add column if not exists historico_negociacao jsonb not null default '[]'::jsonb,
  add column if not exists data_reserva timestamptz;

alter table public.compras drop constraint if exists compras_situacao_estoque_check;
alter table public.compras add constraint compras_situacao_estoque_check
check (situacao_estoque in ('em_estoque','reservado','vendido','prejuizo'));

alter table public.compras drop column if exists lucro_realizado;
alter table public.compras drop column if exists roi_realizado;
alter table public.compras
  add column lucro_realizado numeric(12,2) generated always as (
    case when preco_venda is not null then preco_venda-(preco_compra+coalesce(custo_transporte,0)+coalesce(custo_reparo,0)+coalesce(custo_limpeza,0)+coalesce(custo_taxas,0)+coalesce(outros_custos,0)) else null end
  ) stored,
  add column roi_realizado numeric(10,2) generated always as (
    case when preco_venda is not null and (preco_compra+coalesce(custo_transporte,0)+coalesce(custo_reparo,0)+coalesce(custo_limpeza,0)+coalesce(custo_taxas,0)+coalesce(outros_custos,0))>0
    then ((preco_venda-(preco_compra+coalesce(custo_transporte,0)+coalesce(custo_reparo,0)+coalesce(custo_limpeza,0)+coalesce(custo_taxas,0)+coalesce(outros_custos,0)))/(preco_compra+coalesce(custo_transporte,0)+coalesce(custo_reparo,0)+coalesce(custo_limpeza,0)+coalesce(custo_taxas,0)+coalesce(outros_custos,0)))*100
    else null end
  ) stored;

alter table public.analises
  add column if not exists inspecao_notas text,
  add column if not exists inspecao_data timestamptz,
  add column if not exists teto_compra_reavaliado numeric(12,2),
  add column if not exists historico_negociacao jsonb not null default '[]'::jsonb;

create table if not exists public.radar_config (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  capital_disponivel numeric(12,2) not null default 0,
  lucro_minimo numeric(12,2) not null default 150,
  roi_minimo numeric(8,2) not null default 25,
  dias_alerta_estoque integer not null default 14,
  data_atualizacao timestamptz not null default now()
);
alter table public.radar_config enable row level security;
revoke all on table public.radar_config from anon;
grant select,insert,update,delete on table public.radar_config to authenticated;
drop policy if exists "usuario_le_config" on public.radar_config;
create policy "usuario_le_config" on public.radar_config for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "usuario_cria_config" on public.radar_config;
create policy "usuario_cria_config" on public.radar_config for insert to authenticated with check((select auth.uid())=user_id);
drop policy if exists "usuario_atualiza_config" on public.radar_config;
create policy "usuario_atualiza_config" on public.radar_config for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

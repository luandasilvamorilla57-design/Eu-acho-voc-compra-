-- BRIKE RADAR v23: assisted negotiation conversations.

create table if not exists public.negociacoes_assistidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  produto text not null default '',
  categoria text,
  marca text,
  modelo text,
  preco_pedido numeric(12,2) not null default 0 check (preco_pedido >= 0),
  preco_final numeric(12,2) check (preco_final is null or preco_final >= 0),
  status text not null default 'ativa' check (status in ('ativa','comprado','nao_fechou','pausada')),
  resumo_produto text,
  estrategia_atual jsonb not null default '{}'::jsonb,
  conversa jsonb not null default '[]'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  turn_count integer not null default 0 check (turn_count between 0 and 12),
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

create index if not exists negociacoes_assistidas_user_status_idx
  on public.negociacoes_assistidas(user_id,status,data_atualizacao desc);

alter table public.negociacoes_assistidas enable row level security;

revoke all on table public.negociacoes_assistidas from anon, authenticated;
grant select on table public.negociacoes_assistidas to authenticated;

drop policy if exists negociacoes_assistidas_select_own on public.negociacoes_assistidas;
create policy negociacoes_assistidas_select_own
on public.negociacoes_assistidas
for select to authenticated
using (
  (select auth.uid())=user_id
  and private.tem_acesso_radar((select auth.uid()))
);

create or replace function public.touch_negociacoes_assistidas()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.data_atualizacao=now();
  return new;
end;
$$;

drop trigger if exists trg_negociacoes_assistidas_updated_at on public.negociacoes_assistidas;
create trigger trg_negociacoes_assistidas_updated_at
before update on public.negociacoes_assistidas
for each row execute function public.touch_negociacoes_assistidas();

revoke all on function public.touch_negociacoes_assistidas() from public,anon,authenticated;
grant execute on function public.touch_negociacoes_assistidas() to service_role;

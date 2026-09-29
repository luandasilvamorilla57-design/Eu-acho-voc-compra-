create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  analise_id uuid unique references public.analises(id) on delete set null,
  origem_compra text not null default 'externo' check (origem_compra in ('analise','externo')),
  produto text not null,
  categoria text,
  preco_compra numeric(12,2) not null check (preco_compra > 0),
  preco_venda numeric(12,2) check (preco_venda is null or preco_venda > 0),
  status text not null default 'comprado' check (status in ('comprado','vendido')),
  lucro_realizado numeric(12,2) generated always as (
    case when preco_venda is not null then preco_venda - preco_compra else null end
  ) stored,
  roi_realizado numeric(10,2) generated always as (
    case when preco_venda is not null and preco_compra > 0
      then ((preco_venda - preco_compra) / preco_compra) * 100
      else null end
  ) stored,
  data_compra timestamptz not null default now(),
  data_venda timestamptz,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

create index if not exists compras_user_data_idx on public.compras(user_id,data_compra desc);
create index if not exists compras_user_status_idx on public.compras(user_id,status);

alter table public.compras enable row level security;
revoke all on table public.compras from anon;
grant select,insert,update,delete on table public.compras to authenticated;
grant select,insert,update,delete on table public.compras to service_role;

drop policy if exists "usuarios_leem_suas_compras" on public.compras;
create policy "usuarios_leem_suas_compras" on public.compras for select to authenticated using((select auth.uid())=user_id);

drop policy if exists "usuarios_criam_suas_compras" on public.compras;
create policy "usuarios_criam_suas_compras" on public.compras for insert to authenticated with check((select auth.uid())=user_id);

drop policy if exists "usuarios_atualizam_suas_compras" on public.compras;
create policy "usuarios_atualizam_suas_compras" on public.compras for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "usuarios_excluem_suas_compras" on public.compras;
create policy "usuarios_excluem_suas_compras" on public.compras for delete to authenticated using((select auth.uid())=user_id);

create or replace function public.set_compras_updated_at()
returns trigger language plpgsql security invoker set search_path='' as $$
begin new.data_atualizacao=now(); return new; end; $$;

drop trigger if exists set_compras_updated_at on public.compras;
create trigger set_compras_updated_at before update on public.compras
for each row execute function public.set_compras_updated_at();

create or replace function public.sync_compra_analise()
returns trigger language plpgsql security definer set search_path='public' as $$
begin
  if new.analise_id is not null then
    if new.status='vendido' then
      update public.analises set status='vendi',preco_compra_real=new.preco_compra,preco_venda_real=new.preco_venda
      where id=new.analise_id and user_id=new.user_id;
    else
      update public.analises set status='comprei',preco_compra_real=new.preco_compra
      where id=new.analise_id and user_id=new.user_id;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists sync_compra_analise on public.compras;
create trigger sync_compra_analise after insert or update on public.compras
for each row execute function public.sync_compra_analise();

insert into public.compras (user_id,analise_id,origem_compra,produto,categoria,preco_compra,preco_venda,status,data_compra,data_venda)
select a.user_id,a.id,'analise',a.titulo_anuncio,a.categoria,a.preco_compra_real,a.preco_venda_real,
       case when a.status='vendi' then 'vendido' else 'comprado' end,
       a.data_atualizacao,case when a.status='vendi' then a.data_atualizacao else null end
from public.analises a
where a.status in ('comprei','vendi')
  and a.preco_compra_real is not null
  and not exists(select 1 from public.compras c where c.analise_id=a.id);

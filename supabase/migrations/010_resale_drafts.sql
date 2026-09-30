create table if not exists public.anuncios_revenda(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  origem_item text not null check (origem_item in ('radar','externo')),
  compra_id uuid references public.compras(id) on delete set null,
  analise_id uuid references public.analises(id) on delete set null,
  produto text not null,
  categoria text,
  marca text,
  modelo text,
  condicao text,
  tempo_uso text,
  observacoes text,
  preco_minimo numeric(12,2) check (preco_minimo is null or preco_minimo >= 0),
  preco_ideal numeric(12,2) check (preco_ideal is null or preco_ideal >= 0),
  fotos jsonb not null default '[]'::jsonb,
  resultado_ia jsonb,
  titulo text,
  descricao text,
  preco_venda_rapida numeric(12,2),
  preco_equilibrado numeric(12,2),
  preco_premium numeric(12,2),
  status text not null default 'rascunho' check (status in ('rascunho','pronto')),
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

create index if not exists anuncios_revenda_user_date_idx on public.anuncios_revenda(user_id,data_atualizacao desc);
create index if not exists anuncios_revenda_compra_idx on public.anuncios_revenda(compra_id) where compra_id is not null;

alter table public.anuncios_revenda enable row level security;
revoke all on table public.anuncios_revenda from anon;
grant select,insert,update,delete on table public.anuncios_revenda to authenticated;

drop policy if exists "anuncios_revenda_select_own" on public.anuncios_revenda;
create policy "anuncios_revenda_select_own" on public.anuncios_revenda for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "anuncios_revenda_insert_own" on public.anuncios_revenda;
create policy "anuncios_revenda_insert_own" on public.anuncios_revenda for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "anuncios_revenda_update_own" on public.anuncios_revenda;
create policy "anuncios_revenda_update_own" on public.anuncios_revenda for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "anuncios_revenda_delete_own" on public.anuncios_revenda;
create policy "anuncios_revenda_delete_own" on public.anuncios_revenda for delete to authenticated using ((select auth.uid())=user_id);

create or replace function public.set_anuncios_revenda_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.data_atualizacao=now(); return new; end;
$$;
drop trigger if exists trg_anuncios_revenda_updated_at on public.anuncios_revenda;
create trigger trg_anuncios_revenda_updated_at before update on public.anuncios_revenda for each row execute function public.set_anuncios_revenda_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('resale-photos','resale-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "resale_photos_select_own" on storage.objects;
create policy "resale_photos_select_own" on storage.objects for select to authenticated using (bucket_id='resale-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "resale_photos_insert_own" on storage.objects;
create policy "resale_photos_insert_own" on storage.objects for insert to authenticated with check (bucket_id='resale-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "resale_photos_delete_own" on storage.objects;
create policy "resale_photos_delete_own" on storage.objects for delete to authenticated using (bucket_id='resale-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

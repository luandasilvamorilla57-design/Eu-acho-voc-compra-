alter table public.analises
  add column if not exists referencias_usuario jsonb not null default '[]'::jsonb;

alter table public.compras
  add column if not exists fotos jsonb not null default '[]'::jsonb,
  add column if not exists anuncio_revenda jsonb;

create index if not exists analises_user_pipeline_idx on public.analises(user_id,pipeline_status,data_atualizacao desc);
create index if not exists compras_user_status_idx on public.compras(user_id,status,data_compra desc);

create table if not exists public.client_errors(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  context text not null default 'app',
  message text not null,
  stack text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.client_errors enable row level security;
revoke all on table public.client_errors from anon;
grant insert,select,delete on table public.client_errors to authenticated;

drop policy if exists "user_insert_own_errors" on public.client_errors;
create policy "user_insert_own_errors" on public.client_errors for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "user_read_own_errors" on public.client_errors;
create policy "user_read_own_errors" on public.client_errors for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "user_delete_own_errors" on public.client_errors;
create policy "user_delete_own_errors" on public.client_errors for delete to authenticated using ((select auth.uid())=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('purchase-photos','purchase-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "purchase_photos_select_own" on storage.objects;
create policy "purchase_photos_select_own" on storage.objects for select to authenticated using (bucket_id='purchase-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "purchase_photos_insert_own" on storage.objects;
create policy "purchase_photos_insert_own" on storage.objects for insert to authenticated with check (bucket_id='purchase-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "purchase_photos_delete_own" on storage.objects;
create policy "purchase_photos_delete_own" on storage.objects for delete to authenticated using (bucket_id='purchase-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

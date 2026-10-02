alter table public.analises
  add column if not exists fotos jsonb not null default '[]'::jsonb;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('analysis-photos','analysis-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='analysis_photos_select_own') then
    create policy analysis_photos_select_own on storage.objects for select to authenticated
    using (bucket_id='analysis-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and private.tem_acesso_radar((select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='analysis_photos_insert_own') then
    create policy analysis_photos_insert_own on storage.objects for insert to authenticated
    with check (bucket_id='analysis-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and private.tem_acesso_radar((select auth.uid())));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='analysis_photos_delete_own') then
    create policy analysis_photos_delete_own on storage.objects for delete to authenticated
    using (bucket_id='analysis-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and private.tem_acesso_radar((select auth.uid())));
  end if;
end $$;

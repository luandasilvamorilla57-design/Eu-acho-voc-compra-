-- BRIKE RADAR v16 security hardening.
-- Applied to production through Supabase migration security_hardening_v16.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.tem_acesso_radar(p_user_id uuid)
returns boolean language plpgsql stable security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' and p_user_id is distinct from auth.uid() then return false; end if;
  return
    coalesce((select r.acesso_total from public.radar_config r where r.user_id=p_user_id),false)
    or exists(
      select 1 from public.assinaturas a
      join public.billing_config bc on bc.id=1 and bc.ambiente=a.ambiente
      where a.user_id=p_user_id and a.ultimo_pagamento_em is not null
        and (lower(a.status) in ('authorized','active')
          or (lower(a.status)='cancelled' and a.valido_ate is not null and a.valido_ate > now()))
    );
end;
$$;

create or replace function private.tem_recurso_pro(p_user_id uuid)
returns boolean language plpgsql stable security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' and p_user_id is distinct from auth.uid() then return false; end if;
  return
    coalesce((select r.acesso_total from public.radar_config r where r.user_id=p_user_id),false)
    or exists(
      select 1 from public.assinaturas a
      join public.billing_config bc on bc.id=1 and bc.ambiente=a.ambiente
      where a.user_id=p_user_id and a.plano in ('pro','max') and a.ultimo_pagamento_em is not null
        and (lower(a.status) in ('authorized','active')
          or (lower(a.status)='cancelled' and a.valido_ate is not null and a.valido_ate > now()))
    );
end;
$$;

revoke all on function private.tem_acesso_radar(uuid) from public, anon;
revoke all on function private.tem_recurso_pro(uuid) from public, anon;
grant execute on function private.tem_acesso_radar(uuid) to authenticated, service_role;
grant execute on function private.tem_recurso_pro(uuid) to authenticated, service_role;

alter policy usuarios_leem_suas_analises on public.analises using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_criam_suas_analises on public.analises with check (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_atualizam_suas_analises on public.analises using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid()))) with check (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_excluem_suas_analises on public.analises using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));

alter policy usuarios_leem_suas_compras on public.compras using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_criam_suas_compras on public.compras with check (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_atualizam_suas_compras on public.compras using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid()))) with check (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));
alter policy usuarios_excluem_suas_compras on public.compras using (((select auth.uid())=user_id) and private.tem_acesso_radar((select auth.uid())));

alter policy anuncios_revenda_select_own on public.anuncios_revenda using (((select auth.uid())=user_id) and private.tem_recurso_pro((select auth.uid())));
alter policy anuncios_revenda_insert_own on public.anuncios_revenda with check (((select auth.uid())=user_id) and private.tem_recurso_pro((select auth.uid())));
alter policy anuncios_revenda_update_own on public.anuncios_revenda using (((select auth.uid())=user_id) and private.tem_recurso_pro((select auth.uid()))) with check (((select auth.uid())=user_id) and private.tem_recurso_pro((select auth.uid())));
alter policy anuncios_revenda_delete_own on public.anuncios_revenda using (((select auth.uid())=user_id) and private.tem_recurso_pro((select auth.uid())));

alter policy purchase_photos_select_own on storage.objects using ((bucket_id='purchase-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_acesso_radar((select auth.uid())));
alter policy purchase_photos_insert_own on storage.objects with check ((bucket_id='purchase-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_acesso_radar((select auth.uid())));
alter policy purchase_photos_delete_own on storage.objects using ((bucket_id='purchase-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_acesso_radar((select auth.uid())));
alter policy resale_photos_select_own on storage.objects using ((bucket_id='resale-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_recurso_pro((select auth.uid())));
alter policy resale_photos_insert_own on storage.objects with check ((bucket_id='resale-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_recurso_pro((select auth.uid())));
alter policy resale_photos_delete_own on storage.objects using ((bucket_id='resale-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text) and private.tem_recurso_pro((select auth.uid())));

revoke all on function public.tem_acesso_radar(uuid) from public, anon, authenticated;
revoke all on function public.tem_recurso_pro(uuid) from public, anon, authenticated;
grant execute on function public.tem_acesso_radar(uuid) to service_role;
grant execute on function public.tem_recurso_pro(uuid) to service_role;

revoke all on function public.bootstrap_new_radar_user() from public, anon, authenticated;
revoke all on function public.enforce_owner_access() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.sync_compra_analise() from public, anon, authenticated;
grant execute on function public.bootstrap_new_radar_user() to service_role;
grant execute on function public.enforce_owner_access() to service_role;
grant execute on function public.rls_auto_enable() to service_role;
grant execute on function public.sync_compra_analise() to service_role;

alter function public.registrar_resultado_anuncio_revenda(uuid,text,numeric) security invoker;
revoke all on function public.registrar_resultado_anuncio_revenda(uuid,text,numeric) from public, anon;
grant execute on function public.registrar_resultado_anuncio_revenda(uuid,text,numeric) to authenticated, service_role;

drop policy if exists billing_config_deny_client on public.billing_config;
create policy billing_config_deny_client on public.billing_config for all to anon,authenticated using(false) with check(false);
drop policy if exists webhook_eventos_deny_client on public.mercadopago_webhook_eventos;
create policy webhook_eventos_deny_client on public.mercadopago_webhook_eventos for all to anon,authenticated using(false) with check(false);
drop policy if exists uso_plano_eventos_deny_client on public.uso_plano_eventos;
create policy uso_plano_eventos_deny_client on public.uso_plano_eventos for all to anon,authenticated using(false) with check(false);

revoke all on table public.billing_config from anon,authenticated;
revoke all on table public.mercadopago_webhook_eventos from anon,authenticated;
revoke all on table public.uso_plano_eventos from anon,authenticated;
revoke all on table public.assinaturas from anon,authenticated; grant select on table public.assinaturas to authenticated;
revoke all on table public.creditos_extras from anon,authenticated; grant select on table public.creditos_extras to authenticated;
revoke all on table public.pagamentos_extras from anon,authenticated; grant select on table public.pagamentos_extras to authenticated;
revoke all on table public.planos_catalogo from anon,authenticated; grant select on table public.planos_catalogo to anon,authenticated;
revoke all on table public.pacotes_extras_catalogo from anon,authenticated; grant select on table public.pacotes_extras_catalogo to authenticated;
revoke all on table public.radar_config from anon,authenticated; grant select,insert,update on table public.radar_config to authenticated;
revoke all on table public.client_errors from anon,authenticated; grant select,insert,delete on table public.client_errors to authenticated;
revoke all on table public.analises from anon,authenticated; grant select,insert,update,delete on table public.analises to authenticated;
revoke all on table public.compras from anon,authenticated; grant select,insert,update,delete on table public.compras to authenticated;
revoke all on table public.anuncios_revenda from anon,authenticated; grant select,insert,update,delete on table public.anuncios_revenda to authenticated;

alter default privileges for role postgres in schema public revoke select,insert,update,delete on tables from anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke usage,select on sequences from anon,authenticated;

create index if not exists anuncios_revenda_analise_idx on public.anuncios_revenda(analise_id);
create index if not exists client_errors_user_idx on public.client_errors(user_id);

-- BRIKE RADAR v17: reduce residual RPC surface and harden client error telemetry.

drop policy if exists user_read_own_errors on public.client_errors;
drop policy if exists user_delete_own_errors on public.client_errors;

revoke all on table public.client_errors from anon, authenticated;
grant insert on table public.client_errors to authenticated;

alter table public.client_errors
  drop constraint if exists client_errors_context_len,
  drop constraint if exists client_errors_message_len,
  drop constraint if exists client_errors_stack_len,
  drop constraint if exists client_errors_metadata_len;

alter table public.client_errors
  add constraint client_errors_context_len check (char_length(context) <= 80),
  add constraint client_errors_message_len check (char_length(message) <= 1000),
  add constraint client_errors_stack_len check (stack is null or char_length(stack) <= 6000),
  add constraint client_errors_metadata_len check (metadata is null or octet_length(metadata::text) <= 20000);

revoke all on function public.proteger_campos_plano_radar_config() from public, anon, authenticated;
revoke all on function public.set_anuncios_revenda_updated_at() from public, anon, authenticated;
revoke all on function public.set_compras_updated_at() from public, anon, authenticated;
revoke all on function public.set_radar_config_updated_at() from public, anon, authenticated;
revoke all on function public.touch_assinaturas_updated_at() from public, anon, authenticated;
revoke all on function public.touch_creditos_extras() from public, anon, authenticated;
revoke all on function public.touch_pagamentos_extras() from public, anon, authenticated;

grant execute on function public.proteger_campos_plano_radar_config() to service_role;
grant execute on function public.set_anuncios_revenda_updated_at() to service_role;
grant execute on function public.set_compras_updated_at() to service_role;
grant execute on function public.set_radar_config_updated_at() to service_role;
grant execute on function public.touch_assinaturas_updated_at() to service_role;
grant execute on function public.touch_creditos_extras() to service_role;
grant execute on function public.touch_pagamentos_extras() to service_role;

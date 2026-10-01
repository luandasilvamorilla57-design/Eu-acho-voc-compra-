alter table public.radar_config
  add column if not exists giro_preferido text not null default 'rapido';

alter table public.radar_config
  drop constraint if exists radar_config_giro_preferido_check;

alter table public.radar_config
  add constraint radar_config_giro_preferido_check
  check (giro_preferido in ('rapido','medio'));

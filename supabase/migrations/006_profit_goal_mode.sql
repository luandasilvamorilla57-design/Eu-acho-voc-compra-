alter table public.radar_config
  add column if not exists lucro_minimo_modo text not null default 'valor',
  add column if not exists lucro_minimo_percentual numeric(8,2) not null default 20;

alter table public.radar_config drop constraint if exists radar_config_lucro_minimo_modo_check;
alter table public.radar_config add constraint radar_config_lucro_minimo_modo_check
  check (lucro_minimo_modo in ('valor','percentual'));

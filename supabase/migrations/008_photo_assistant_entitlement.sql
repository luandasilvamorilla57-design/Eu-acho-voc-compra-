alter table public.radar_config
  add column if not exists plano_atual text not null default 'start';

alter table public.radar_config drop constraint if exists radar_config_plano_atual_check;
alter table public.radar_config add constraint radar_config_plano_atual_check
  check (plano_atual in ('start','pro','max'));

-- Existing pre-launch accounts receive Pro so the new feature can be tested.
-- New accounts created after this migration start on "start".
update public.radar_config
set plano_atual='pro'
where plano_atual='start';

alter table public.analises
  add column if not exists origem text not null default 'manual';

update public.analises
set origem = case
  when link_anuncio ilike '%olx%' then 'olx'
  when link_anuncio ilike '%facebook%' then 'facebook'
  else coalesce(origem, 'manual')
end
where origem is null or origem = 'manual';

alter table public.analises
  drop constraint if exists analises_origem_check;

alter table public.analises
  add constraint analises_origem_check
  check (origem in ('olx','facebook','manual'));

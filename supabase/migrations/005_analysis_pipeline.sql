alter table public.analises
  add column if not exists pipeline_status text not null default 'analisado',
  add column if not exists veredito_radar text;

alter table public.analises drop constraint if exists analises_pipeline_status_check;
alter table public.analises add constraint analises_pipeline_status_check
  check (pipeline_status in ('analisado','aguardando_negociacao','descartado','negociacao_falhou','comprado','vendido'));

alter table public.analises drop constraint if exists analises_veredito_radar_check;
alter table public.analises add constraint analises_veredito_radar_check
  check (veredito_radar is null or veredito_radar in ('compensa','nao_compensa'));

create index if not exists analises_user_pipeline_idx on public.analises(user_id,pipeline_status);

create or replace function public.sync_compra_analise()
returns trigger language plpgsql security definer set search_path='public' as $$
begin
  if new.analise_id is not null then
    if new.status='vendido' then
      update public.analises set status='vendi',pipeline_status='vendido',preco_compra_real=new.preco_compra,preco_venda_real=new.preco_venda
      where id=new.analise_id and user_id=new.user_id;
    else
      update public.analises set status='comprei',pipeline_status='comprado',preco_compra_real=new.preco_compra
      where id=new.analise_id and user_id=new.user_id;
    end if;
  end if;
  return new;
end; $$;

update public.analises
set pipeline_status=case when status='vendi' then 'vendido' when status='comprei' then 'comprado' else pipeline_status end;

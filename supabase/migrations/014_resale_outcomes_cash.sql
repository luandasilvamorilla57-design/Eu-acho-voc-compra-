alter table public.anuncios_revenda
  add column if not exists resultado_venda text not null default 'pendente',
  add column if not exists preco_venda_real numeric(12,2),
  add column if not exists data_venda timestamptz;

alter table public.anuncios_revenda drop constraint if exists anuncios_revenda_resultado_venda_check;
alter table public.anuncios_revenda add constraint anuncios_revenda_resultado_venda_check
  check (resultado_venda in ('pendente','vendido','nao_vendido'));

alter table public.anuncios_revenda drop constraint if exists anuncios_revenda_preco_venda_real_check;
alter table public.anuncios_revenda add constraint anuncios_revenda_preco_venda_real_check
  check (preco_venda_real is null or preco_venda_real > 0);

create index if not exists anuncios_revenda_user_resultado_idx
  on public.anuncios_revenda(user_id,resultado_venda,data_atualizacao desc);

create or replace function public.registrar_resultado_anuncio_revenda(
  p_anuncio_id uuid,
  p_resultado text,
  p_preco_venda numeric default null
)
returns public.anuncios_revenda
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_user uuid := auth.uid();
  v_ad public.anuncios_revenda;
  v_total numeric := 0;
begin
  if v_user is null then raise exception 'sessao_invalida'; end if;
  if p_resultado not in ('vendido','nao_vendido','pendente') then raise exception 'resultado_invalido'; end if;

  select * into v_ad
  from public.anuncios_revenda
  where id=p_anuncio_id and user_id=v_user
  for update;

  if not found then raise exception 'anuncio_nao_encontrado'; end if;

  if p_resultado='vendido' then
    if p_preco_venda is null or p_preco_venda<=0 then raise exception 'preco_venda_invalido'; end if;

    update public.anuncios_revenda
      set resultado_venda='vendido',
          preco_venda_real=p_preco_venda,
          data_venda=coalesce(data_venda,now())
      where id=p_anuncio_id
      returning * into v_ad;

    if v_ad.compra_id is not null then
      select preco_compra + coalesce(custo_transporte,0) + coalesce(custo_reparo,0)
        + coalesce(custo_limpeza,0) + coalesce(custo_taxas,0) + coalesce(outros_custos,0)
      into v_total
      from public.compras
      where id=v_ad.compra_id and user_id=v_user
      for update;

      update public.compras
        set preco_venda=p_preco_venda,
            status='vendido',
            situacao_estoque=case when p_preco_venda<v_total then 'prejuizo' else 'vendido' end,
            data_venda=coalesce(data_venda,now())
        where id=v_ad.compra_id and user_id=v_user;
    end if;

  elsif p_resultado='nao_vendido' then
    update public.anuncios_revenda
      set resultado_venda='nao_vendido',preco_venda_real=null,data_venda=null
      where id=p_anuncio_id returning * into v_ad;
  else
    update public.anuncios_revenda
      set resultado_venda='pendente',preco_venda_real=null,data_venda=null
      where id=p_anuncio_id returning * into v_ad;
  end if;

  return v_ad;
end;
$$;

revoke all on function public.registrar_resultado_anuncio_revenda(uuid,text,numeric) from public,anon;
grant execute on function public.registrar_resultado_anuncio_revenda(uuid,text,numeric) to authenticated;

create or replace function public.registrar_pagamento_extra(
  p_user_id uuid,
  p_gateway text,
  p_ambiente text,
  p_external_reference text,
  p_gateway_payment_id text,
  p_quantidade integer,
  p_valor numeric,
  p_payload jsonb default '{}'::jsonb
)
returns table(processado boolean,saldo integer)
language plpgsql security definer set search_path=public
as $$
declare v_balance integer := 0;
begin
  if p_quantidade<=0 then raise exception 'quantidade_invalida'; end if;
  if p_gateway_payment_id is null or btrim(p_gateway_payment_id)='' then raise exception 'payment_id_invalido'; end if;

  perform pg_advisory_xact_lock(hashtext(p_gateway||':'||p_gateway_payment_id));

  if exists(
    select 1 from public.pagamentos_extras
    where ambiente=p_ambiente and gateway=p_gateway and gateway_payment_id=p_gateway_payment_id
      and status='approved'
  ) then
    select coalesce(c.saldo_analises,0) into v_balance from public.creditos_extras c where c.user_id=p_user_id;
    return query select false,coalesce(v_balance,0);
    return;
  end if;

  insert into public.pagamentos_extras(
    user_id,gateway,ambiente,external_reference,gateway_payment_id,
    quantidade,valor,status,payload,pago_em
  ) values(
    p_user_id,p_gateway,p_ambiente,p_external_reference,p_gateway_payment_id,
    p_quantidade,p_valor,'approved',coalesce(p_payload,'{}'::jsonb),now()
  )
  on conflict (ambiente,gateway,gateway_payment_id) where gateway_payment_id is not null
  do update set status='approved',payload=excluded.payload,
    pago_em=coalesce(public.pagamentos_extras.pago_em,now()),updated_at=now();

  v_balance:=public.conceder_creditos_extras(p_user_id,p_quantidade);
  return query select true,v_balance;
end;
$$;

revoke all on function public.registrar_pagamento_extra(uuid,text,text,text,text,integer,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.registrar_pagamento_extra(uuid,text,text,text,text,integer,numeric,jsonb) to service_role;

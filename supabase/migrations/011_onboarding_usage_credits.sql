-- BRIKE RADAR: onboarding, usage enforcement and extra analysis credits.

alter table public.radar_config
  add column if not exists onboarding_concluido boolean not null default false,
  add column if not exists perfil_operacao text not null default 'revenda',
  add column if not exists experiencia text not null default 'iniciante',
  add column if not exists categorias_preferidas jsonb not null default '[]'::jsonb,
  add column if not exists objetivo_lucro_mensal numeric(12,2) not null default 0,
  add column if not exists notificacoes_ativas boolean not null default true;

alter table public.radar_config drop constraint if exists radar_config_perfil_operacao_check;
alter table public.radar_config add constraint radar_config_perfil_operacao_check
  check (perfil_operacao in ('revenda','garimpo','desapego','misto'));

alter table public.radar_config drop constraint if exists radar_config_experiencia_check;
alter table public.radar_config add constraint radar_config_experiencia_check
  check (experiencia in ('iniciante','intermediario','avancado'));

alter table public.uso_plano_eventos
  add column if not exists usou_credito_extra boolean not null default false;

create table if not exists public.creditos_extras (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saldo_analises integer not null default 0 check (saldo_analises >= 0),
  total_comprado integer not null default 0 check (total_comprado >= 0),
  updated_at timestamptz not null default now()
);

alter table public.creditos_extras enable row level security;
revoke all on table public.creditos_extras from anon;
grant select on table public.creditos_extras to authenticated;

drop policy if exists "creditos_extras_select_own" on public.creditos_extras;
create policy "creditos_extras_select_own" on public.creditos_extras
for select to authenticated using ((select auth.uid())=user_id);

create table if not exists public.pagamentos_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gateway text not null default 'mercado_pago',
  ambiente text not null default 'test' check (ambiente in ('test','production')),
  external_reference text not null,
  gateway_payment_id text,
  quantidade integer not null check (quantidade > 0),
  valor numeric(12,2) not null check (valor >= 0),
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pagamentos_extras_gateway_payment_uq
  on public.pagamentos_extras(ambiente,gateway,gateway_payment_id)
  where gateway_payment_id is not null;

create index if not exists pagamentos_extras_user_idx
  on public.pagamentos_extras(user_id,created_at desc);

alter table public.pagamentos_extras enable row level security;
revoke all on table public.pagamentos_extras from anon;
grant select on table public.pagamentos_extras to authenticated;

drop policy if exists "pagamentos_extras_select_own" on public.pagamentos_extras;
create policy "pagamentos_extras_select_own" on public.pagamentos_extras
for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.touch_creditos_extras()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end;
$$;
drop trigger if exists trg_creditos_extras_updated_at on public.creditos_extras;
create trigger trg_creditos_extras_updated_at
before update on public.creditos_extras
for each row execute function public.touch_creditos_extras();

create or replace function public.touch_pagamentos_extras()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end;
$$;
drop trigger if exists trg_pagamentos_extras_updated_at on public.pagamentos_extras;
create trigger trg_pagamentos_extras_updated_at
before update on public.pagamentos_extras
for each row execute function public.touch_pagamentos_extras();

drop function if exists public.status_acesso_radar(uuid);
create function public.status_acesso_radar(p_user_id uuid)
returns table(
  liberado boolean,
  plano text,
  owner_access boolean,
  assinatura_status text,
  valido_ate timestamptz,
  analises_mes integer,
  analises_dia integer,
  usadas_mes bigint,
  usadas_dia bigint,
  geracoes_venda_mes integer,
  usadas_venda_mes bigint,
  creditos_extras integer,
  proxima_cobranca timestamptz,
  valor numeric,
  gateway text
)
language plpgsql stable security definer
set search_path=public,auth
as $$
declare
  v_owner boolean := false;
  v_plan text;
  v_status text;
  v_valid_until timestamptz;
  v_next timestamptz;
  v_value numeric;
  v_gateway text;
  v_month integer;
  v_day integer;
  v_sales integer;
  v_extra integer := 0;
begin
  select coalesce(r.acesso_total,false) into v_owner
  from public.radar_config r where r.user_id=p_user_id;

  if coalesce(v_owner,false) then
    return query select true,'max'::text,true,'owner'::text,null::timestamptz,
      2147483647,2147483647,0::bigint,0::bigint,
      2147483647,0::bigint,2147483647,null::timestamptz,null::numeric,'owner'::text;
    return;
  end if;

  select a.plano,a.status,a.valido_ate,a.proxima_cobranca,a.valor,a.gateway
    into v_plan,v_status,v_valid_until,v_next,v_value,v_gateway
  from public.assinaturas a
  join public.billing_config bc on bc.id=1 and bc.ambiente=a.ambiente
  where a.user_id=p_user_id
    and a.ultimo_pagamento_em is not null
    and (
      lower(a.status) in ('authorized','active')
      or (lower(a.status)='cancelled' and a.valido_ate is not null and a.valido_ate>now())
    )
  order by a.updated_at desc limit 1;

  if v_plan is null then
    return query select false,null::text,false,null::text,null::timestamptz,
      0,0,0::bigint,0::bigint,0,0::bigint,0,null::timestamptz,null::numeric,null::text;
    return;
  end if;

  select p.analises_mes,p.analises_dia,coalesce(p.geracoes_venda_mes,0)
    into v_month,v_day,v_sales
  from public.planos_catalogo p where p.slug=v_plan and p.ativo=true;

  select coalesce(c.saldo_analises,0) into v_extra
  from public.creditos_extras c where c.user_id=p_user_id;

  return query select
    true,v_plan,false,v_status,v_valid_until,
    coalesce(v_month,0),coalesce(v_day,0),
    (select count(*) from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='analise'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('month',now())),
    (select count(*) from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='analise'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('day',now())),
    coalesce(v_sales,0),
    (select count(*) from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='preparar_venda'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('month',now())),
    coalesce(v_extra,0),v_next,v_value,v_gateway;
end;
$$;

revoke all on function public.status_acesso_radar(uuid) from public,anon,authenticated;
grant execute on function public.status_acesso_radar(uuid) to service_role;

create or replace function public.reservar_uso_radar(p_user_id uuid,p_tipo text,p_request_id uuid)
returns table(
  permitido boolean,motivo text,plano text,owner_access boolean,usou_credito_extra boolean,
  evento_id uuid,restantes_dia integer,restantes_mes integer,creditos_extras integer
)
language plpgsql security definer set search_path=public,auth
as $$
declare
  v_owner boolean := false;
  v_plan text;
  v_month integer := 0;
  v_day integer := 0;
  v_sales integer := 0;
  v_used_month bigint := 0;
  v_used_day bigint := 0;
  v_used_sales bigint := 0;
  v_extra integer := 0;
  v_use_extra boolean := false;
  v_event uuid;
begin
  if p_tipo not in ('analise','preparar_venda') then
    return query select false,'tipo_invalido'::text,null::text,false,false,null::uuid,0,0,0;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select coalesce(r.acesso_total,false) into v_owner
  from public.radar_config r where r.user_id=p_user_id;

  if coalesce(v_owner,false) then
    insert into public.uso_plano_eventos(user_id,tipo,plano,status,request_id)
    values(p_user_id,p_tipo,'owner','reserved',p_request_id)
    on conflict(request_id) do update set request_id=excluded.request_id
    returning id into v_event;
    return query select true,'owner'::text,'max'::text,true,false,v_event,2147483647,2147483647,2147483647;
    return;
  end if;

  select a.plano into v_plan
  from public.assinaturas a
  join public.billing_config bc on bc.id=1 and bc.ambiente=a.ambiente
  where a.user_id=p_user_id
    and a.ultimo_pagamento_em is not null
    and (
      lower(a.status) in ('authorized','active')
      or (lower(a.status)='cancelled' and a.valido_ate is not null and a.valido_ate>now())
    )
  order by a.updated_at desc limit 1;

  if v_plan is null then
    return query select false,'assinatura_inativa'::text,null::text,false,false,null::uuid,0,0,0;
    return;
  end if;

  select p.analises_mes,p.analises_dia,coalesce(p.geracoes_venda_mes,0)
    into v_month,v_day,v_sales
  from public.planos_catalogo p where p.slug=v_plan and p.ativo=true;

  if p_tipo='analise' then
    select count(*) into v_used_day from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='analise'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('day',now());

    if v_used_day>=coalesce(v_day,0) then
      select coalesce(c.saldo_analises,0) into v_extra from public.creditos_extras c where c.user_id=p_user_id;
      return query select false,'limite_diario'::text,v_plan,false,false,null::uuid,0,0,coalesce(v_extra,0);
      return;
    end if;

    select count(*) into v_used_month from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='analise'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('month',now());

    select coalesce(c.saldo_analises,0) into v_extra from public.creditos_extras c where c.user_id=p_user_id;

    if v_used_month>=coalesce(v_month,0) then
      if coalesce(v_extra,0)<=0 then
        return query select false,'limite_mensal'::text,v_plan,false,false,null::uuid,
          greatest(0,coalesce(v_day,0)-v_used_day)::int,0,0;
        return;
      end if;
      update public.creditos_extras set saldo_analises=saldo_analises-1
      where user_id=p_user_id and saldo_analises>0;
      v_extra:=v_extra-1;
      v_use_extra:=true;
    end if;
  else
    if coalesce(v_sales,0)<=0 then
      return query select false,'recurso_pro'::text,v_plan,false,false,null::uuid,0,0,0;
      return;
    end if;

    select count(*) into v_used_sales from public.uso_plano_eventos u
      where u.user_id=p_user_id and u.tipo='preparar_venda'
        and (u.status='success' or (u.status='reserved' and u.created_at>now()-interval '10 minutes'))
        and u.created_at>=date_trunc('month',now());

    if v_used_sales>=v_sales then
      return query select false,'limite_venda_ia'::text,v_plan,false,false,null::uuid,0,0,coalesce(v_extra,0);
      return;
    end if;
  end if;

  insert into public.uso_plano_eventos(user_id,tipo,plano,status,request_id,usou_credito_extra)
  values(p_user_id,p_tipo,v_plan,'reserved',p_request_id,v_use_extra)
  on conflict(request_id) do update set request_id=excluded.request_id
  returning id into v_event;

  return query select true,'ok'::text,v_plan,false,v_use_extra,v_event,
    case when p_tipo='analise' then greatest(0,coalesce(v_day,0)-v_used_day-1)::int else 0 end,
    case when p_tipo='analise' then greatest(0,coalesce(v_month,0)-v_used_month-1)::int else greatest(0,coalesce(v_sales,0)-v_used_sales-1)::int end,
    coalesce(v_extra,0);
end;
$$;

revoke all on function public.reservar_uso_radar(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.reservar_uso_radar(uuid,text,uuid) to service_role;

create or replace function public.finalizar_uso_radar(p_request_id uuid,p_success boolean,p_error text default null)
returns void language plpgsql security definer set search_path=public
as $$
declare v_user uuid; v_extra boolean; v_status text;
begin
  select user_id,usou_credito_extra,status into v_user,v_extra,v_status
  from public.uso_plano_eventos where request_id=p_request_id for update;
  if v_user is null or v_status<>'reserved' then return; end if;

  update public.uso_plano_eventos
    set status=case when p_success then 'success' else 'failed' end,
        erro=case when p_success then null else left(coalesce(p_error,'falha'),500) end,
        finished_at=now()
  where request_id=p_request_id;

  if not p_success and coalesce(v_extra,false) then
    insert into public.creditos_extras(user_id,saldo_analises,total_comprado)
    values(v_user,1,0)
    on conflict(user_id) do update set saldo_analises=public.creditos_extras.saldo_analises+1;
  end if;
end;
$$;

revoke all on function public.finalizar_uso_radar(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.finalizar_uso_radar(uuid,boolean,text) to service_role;

create or replace function public.conceder_creditos_extras(p_user_id uuid,p_quantidade integer)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_balance integer;
begin
  if p_quantidade<=0 then raise exception 'quantidade_invalida'; end if;
  insert into public.creditos_extras(user_id,saldo_analises,total_comprado)
  values(p_user_id,p_quantidade,p_quantidade)
  on conflict(user_id) do update
    set saldo_analises=public.creditos_extras.saldo_analises+p_quantidade,
        total_comprado=public.creditos_extras.total_comprado+p_quantidade
  returning saldo_analises into v_balance;
  return v_balance;
end;
$$;

revoke all on function public.conceder_creditos_extras(uuid,integer) from public,anon,authenticated;
grant execute on function public.conceder_creditos_extras(uuid,integer) to service_role;

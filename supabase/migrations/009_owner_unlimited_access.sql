alter table public.radar_config
  add column if not exists acesso_total boolean not null default false;

create or replace function public.enforce_owner_access()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  new.acesso_total := exists(
    select 1
    from auth.users u
    where u.id = new.user_id
      and lower(u.email) = lower('luandasilvamorilla57@gmail.com')
  );
  return new;
end;
$$;

drop trigger if exists trg_enforce_owner_access on public.radar_config;
create trigger trg_enforce_owner_access
before insert or update on public.radar_config
for each row execute function public.enforce_owner_access();

update public.radar_config
set acesso_total = acesso_total;

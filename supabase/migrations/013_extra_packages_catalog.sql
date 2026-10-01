create table if not exists public.pacotes_extras_catalogo(
  slug text primary key,
  nome text not null,
  quantidade integer not null check (quantidade>0),
  preco numeric(12,2) not null check (preco>=0),
  ativo boolean not null default true,
  destaque boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.pacotes_extras_catalogo(slug,nome,quantidade,preco,ativo,destaque)
values ('extra20','+20 análises',20,6.90,true,true)
on conflict(slug) do update set
  nome=excluded.nome,quantidade=excluded.quantidade,preco=excluded.preco,
  ativo=excluded.ativo,destaque=excluded.destaque,updated_at=now();

alter table public.pacotes_extras_catalogo enable row level security;
grant select on public.pacotes_extras_catalogo to authenticated;
drop policy if exists "pacotes_extras_read" on public.pacotes_extras_catalogo;
create policy "pacotes_extras_read" on public.pacotes_extras_catalogo
for select to authenticated using (ativo=true);

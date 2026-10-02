alter table public.negociacoes_assistidas
  add column if not exists analise_id uuid null references public.analises(id) on delete set null;

create index if not exists negociacoes_assistidas_analise_idx
  on public.negociacoes_assistidas(user_id, analise_id)
  where analise_id is not null;

create unique index if not exists negociacoes_assistidas_analise_unique
  on public.negociacoes_assistidas(user_id, analise_id)
  where analise_id is not null;

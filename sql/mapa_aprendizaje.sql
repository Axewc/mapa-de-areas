-- Rutas por vacante: diagnósticos y repasos. Una fila por intento; solo se agregan o se borran.
-- Aplicada como migración "mapa_aprendizaje" en el proyecto fbd-lab-tracker.
-- Las políticas copian las de mapa_respuestas.

create table public.mapa_aprendizaje (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text not null default lower((auth.jwt() ->> 'email')),
  created_at timestamptz not null default now(),
  ruta text not null check (char_length(ruta) between 1 and 64),
  kind text not null check (kind in ('diagnostico', 'repaso')),
  topic text check (topic is null or char_length(topic) between 1 and 64),
  answers smallint[] not null check (cardinality(answers) between 1 and 30 and answers <@ array[0, 1, 2, 3, 4]::smallint[]),
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  check ((kind = 'repaso') = (topic is not null))
);

create index mapa_aprendizaje_user_ruta_idx on public.mapa_aprendizaje (user_id, ruta, created_at desc);

alter table public.mapa_aprendizaje enable row level security;

create policy "insertar propio" on public.mapa_aprendizaje
  for insert to authenticated
  with check (user_id = (select auth.uid()) and email = lower((select auth.jwt() ->> 'email')));

create policy "ver propio o docente" on public.mapa_aprendizaje
  for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.mapa_admins a where a.email = lower((select auth.jwt() ->> 'email'))
  ));

create policy "borrar propio" on public.mapa_aprendizaje
  for delete to authenticated
  using (user_id = (select auth.uid()));

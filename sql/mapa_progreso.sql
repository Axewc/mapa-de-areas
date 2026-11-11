-- Progreso del hub de estudio: una fila por usuario con su estado (jsonb, versión 2).
-- Aplicada como migración "mapa_progreso" en el proyecto fbd-lab-tracker.
-- Las políticas copian las de mapa_respuestas.

create table public.mapa_progreso (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  email text not null default lower((auth.jwt() ->> 'email')),
  state jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 200000),
  updated_at timestamptz not null default now()
);

create function public.mapa_progreso_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger mapa_progreso_touch
  before update on public.mapa_progreso
  for each row execute function public.mapa_progreso_touch();

alter table public.mapa_progreso enable row level security;

create policy "insertar propio" on public.mapa_progreso
  for insert to authenticated
  with check (user_id = (select auth.uid()) and email = lower((select auth.jwt() ->> 'email')));

create policy "ver propio o docente" on public.mapa_progreso
  for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.mapa_admins a where a.email = lower((select auth.jwt() ->> 'email'))
  ));

create policy "actualizar propio" on public.mapa_progreso
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and email = lower((select auth.jwt() ->> 'email')));

create policy "borrar propio" on public.mapa_progreso
  for delete to authenticated
  using (user_id = (select auth.uid()));

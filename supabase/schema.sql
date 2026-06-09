-- ============================================================================
-- Radiographie de patrimoine — schéma Supabase
-- À exécuter tel quel dans : Dashboard Supabase > SQL Editor > New query.
-- Idempotent : ré-exécutable sans erreur.
-- ============================================================================

-- 1. Table des analyses
create table if not exists public.analyses (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  snapshot    jsonb       not null,   -- { input, metrics } : le patrimoine saisi + métriques calculées
  result      jsonb       not null    -- l'analyse renvoyée par Claude (synthese, forces, vigilances, pistes, score_robustesse)
);

-- Index pour retrouver rapidement l'historique d'un utilisateur (du plus récent au plus ancien)
create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

-- 2. Row Level Security : chaque utilisateur ne voit QUE ses propres lignes
alter table public.analyses enable row level security;

-- SELECT : lire uniquement ses analyses
drop policy if exists "Lecture de ses propres analyses" on public.analyses;
create policy "Lecture de ses propres analyses"
  on public.analyses
  for select
  using (auth.uid() = user_id);

-- INSERT : n'insérer que des lignes à son nom
drop policy if exists "Insertion de ses propres analyses" on public.analyses;
create policy "Insertion de ses propres analyses"
  on public.analyses
  for insert
  with check (auth.uid() = user_id);

-- DELETE : supprimer uniquement ses analyses
drop policy if exists "Suppression de ses propres analyses" on public.analyses;
create policy "Suppression de ses propres analyses"
  on public.analyses
  for delete
  using (auth.uid() = user_id);

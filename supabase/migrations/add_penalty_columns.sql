-- Agrega soporte para penales en la tabla live_scores.
-- Correr en el SQL Editor de Supabase ANTES de deployar la nueva versión de sync-scores.

ALTER TABLE live_scores
  ADD COLUMN IF NOT EXISTS home_penalties INTEGER,
  ADD COLUMN IF NOT EXISTS away_penalties INTEGER,
  ADD COLUMN IF NOT EXISTS duration        TEXT;

-- ─── Correcciones manuales de partidos ya cerrados ───────────────────────────
-- football-data (free) suma los penales al fullTime, así que hay que restarlos.
-- Alemania vs Paraguay: 1-1 en 90', penales 3-4 (Paraguay ganó).
-- Verificá que home_goals/away_goals estén en 4/5 o 5/4 antes de correr esto.
-- Si Germany está como home_team:
UPDATE live_scores
SET
  home_penalties = 3,
  away_penalties = 4,
  home_goals     = 1,
  away_goals     = 1,
  duration       = 'PENALTY_SHOOTOUT'
WHERE home_team = 'Germany' AND away_team = 'Paraguay'
  AND duration IS NULL;

-- Si Paraguay está como home_team (la otra posibilidad):
UPDATE live_scores
SET
  home_penalties = 4,
  away_penalties = 3,
  home_goals     = 1,
  away_goals     = 1,
  duration       = 'PENALTY_SHOOTOUT'
WHERE home_team = 'Paraguay' AND away_team = 'Germany'
  AND duration IS NULL;

-- Marruecos vs Países Bajos: ajustar con el marcador real una vez confirmado.
-- Formato esperado: home_goals = goles reales, home_penalties = goles en tanda.
-- UPDATE live_scores SET home_penalties = ?, away_penalties = ?, home_goals = ?, away_goals = ?, duration = 'PENALTY_SHOOTOUT'
-- WHERE (home_team = 'Morocco' OR home_team = 'Netherlands') AND (away_team = 'Morocco' OR away_team = 'Netherlands') AND duration IS NULL;

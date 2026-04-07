-- ============================================================
-- Pulse — Migration 004 : image sur les commentaires
-- ============================================================
ALTER TABLE comments ADD COLUMN image_url VARCHAR(500);

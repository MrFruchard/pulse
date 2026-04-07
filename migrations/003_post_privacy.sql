-- ============================================================
-- Pulse — Migration 003 : privacy des posts
-- ============================================================

CREATE TYPE post_privacy AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

ALTER TABLE posts ADD COLUMN privacy post_privacy NOT NULL DEFAULT 'PUBLIC';

-- Liste des utilisateurs autorisés pour les posts en mode PRIVATE
CREATE TABLE post_allowed_users (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_allowed_users_post ON post_allowed_users(post_id);

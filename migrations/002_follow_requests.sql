-- ============================================================
-- Pulse — Migration 002 : follow requests + profil privé
-- ============================================================

-- Profil public/privé sur les utilisateurs
ALTER TABLE users ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- Enum statut follow request
CREATE TYPE follow_request_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- Table follow_requests
CREATE TABLE follow_requests (
    id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id    UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       follow_request_status NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP             NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP             NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_follow_request UNIQUE (requester_id, target_id),
    CONSTRAINT no_self_request CHECK (requester_id != target_id)
);

-- Nouveaux types de notifications
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'FOLLOW_REQUEST';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'FOLLOW_ACCEPTED';

-- Index
CREATE INDEX idx_follow_requests_target    ON follow_requests(target_id, status);
CREATE INDEX idx_follow_requests_requester ON follow_requests(requester_id);

-- ============================================================
-- Pulse — Modèle Physique des Données (MPD)
-- PostgreSQL 16+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'dormant', 'suspended');
CREATE TYPE post_intention AS ENUM ('QUESTION', 'SHARE', 'PROJECT', 'CHALLENGE');
CREATE TYPE reaction_type AS ENUM ('LIKE', 'FIRE', 'INSIGHTFUL', 'SUPPORT');
CREATE TYPE notification_type AS ENUM ('SESSION_OPEN', 'REACTION', 'COMMENT', 'FOLLOW', 'REPORT');
CREATE TYPE report_reason AS ENUM ('SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER');
CREATE TYPE report_status AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pseudo        VARCHAR(50)  NOT NULL UNIQUE,
    avatar_url    VARCHAR(500),
    bio           TEXT,
    role          user_role    NOT NULL DEFAULT 'user',
    streak        INTEGER      NOT NULL DEFAULT 0,
    status        user_status  NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: sessions
-- ============================================================
CREATE TABLE sessions (
    id         UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    opens_at   TIMESTAMP NOT NULL,
    closes_at  TIMESTAMP NOT NULL,
    is_active  BOOLEAN   NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: posts
-- ============================================================
CREATE TABLE posts (
    id         UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID           NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content    TEXT           NOT NULL,
    intention  post_intention NOT NULL,
    image_url  VARCHAR(500),
    is_flagged BOOLEAN        NOT NULL DEFAULT false,
    created_at TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: comments
-- ============================================================
CREATE TABLE comments (
    id         UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reactions
-- ============================================================
CREATE TABLE reactions (
    id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID          NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       reaction_type NOT NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reaction_per_user_post UNIQUE (post_id, user_id)
);

-- ============================================================
-- TABLE: follows
-- ============================================================
CREATE TABLE follows (
    id           UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id  UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
    id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    payload    JSONB             NOT NULL DEFAULT '{}',
    is_read    BOOLEAN           NOT NULL DEFAULT false,
    created_at TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE reports (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID          NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      report_reason NOT NULL,
    status      report_status NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: session_attendances
-- ============================================================
CREATE TABLE session_attendances (
    id         UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance UNIQUE (user_id, session_id)
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX idx_posts_user_id      ON posts(user_id);
CREATE INDEX idx_posts_session_id   ON posts(session_id);
CREATE INDEX idx_posts_created_at   ON posts(created_at DESC);
CREATE INDEX idx_reactions_post     ON reactions(post_id);
CREATE INDEX idx_follows_follower   ON follows(follower_id);
CREATE INDEX idx_follows_following  ON follows(following_id);
CREATE INDEX idx_notifs_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_attendance_user    ON session_attendances(user_id);
CREATE INDEX idx_attendance_session ON session_attendances(session_id);

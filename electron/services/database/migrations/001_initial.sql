-- Core organizational hierarchy
CREATE TABLE IF NOT EXISTS subjects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    color       TEXT DEFAULT '#6366f1',
    icon        TEXT DEFAULT 'book-open',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
    id              TEXT PRIMARY KEY,
    subject_id      TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    parent_topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    sort_order      INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id);

-- Study materials
CREATE TABLE IF NOT EXISTS materials (
    id              TEXT PRIMARY KEY,
    topic_id        TEXT REFERENCES topics(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    source_type     TEXT NOT NULL CHECK (source_type IN ('pdf','docx','md','txt','manual')),
    file_path       TEXT,
    file_name       TEXT,
    file_size_bytes INTEGER,
    content_text    TEXT NOT NULL,
    content_html    TEXT,
    word_count      INTEGER,
    parsed_at       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON materials(topic_id);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    mode              TEXT NOT NULL CHECK (mode IN ('feynman','first_principles','socratic')),
    subject_id        TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id          TEXT REFERENCES topics(id) ON DELETE SET NULL,
    material_id       TEXT REFERENCES materials(id) ON DELETE SET NULL,
    status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','completed','abandoned')),
    started_at        TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at          TEXT,
    duration_seconds  INTEGER DEFAULT 0,
    overall_notes     TEXT DEFAULT '',
    ai_model_provider TEXT,
    ai_model_name     TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_topic ON study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON study_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON study_sessions(status);

-- Feynman attempts
CREATE TABLE IF NOT EXISTS feynman_attempts (
    id                   TEXT PRIMARY KEY,
    session_id           TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    concept              TEXT NOT NULL,
    student_explanation  TEXT NOT NULL,
    ai_feedback          TEXT NOT NULL,
    understanding_score  REAL CHECK (understanding_score >= 0 AND understanding_score <= 100),
    gaps_identified      TEXT,
    jargon_issues        TEXT,
    attempt_number       INTEGER DEFAULT 1,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feynman_session ON feynman_attempts(session_id);

-- First Principles steps
CREATE TABLE IF NOT EXISTS first_principles_steps (
    id                TEXT PRIMARY KEY,
    session_id        TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    step_order        INTEGER NOT NULL,
    concept_name      TEXT NOT NULL,
    fundamental_truth TEXT,
    ai_guidance       TEXT,
    student_response  TEXT,
    is_leaf           INTEGER DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fp_session ON first_principles_steps(session_id);

-- Socratic turns
CREATE TABLE IF NOT EXISTS socratic_turns (
    id               TEXT PRIMARY KEY,
    session_id       TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    turn_number      INTEGER NOT NULL,
    ai_question      TEXT NOT NULL,
    student_answer   TEXT,
    question_type    TEXT CHECK (question_type IN
                      ('clarification','assumption','evidence','implication',
                       'viewpoint','consequence','origin')),
    student_reflection TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_socratic_session ON socratic_turns(session_id);

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_interactions (
    id                TEXT PRIMARY KEY,
    session_id        TEXT REFERENCES study_sessions(id) ON DELETE SET NULL,
    model_provider    TEXT NOT NULL,
    model_name        TEXT NOT NULL,
    prompt_tokens     INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens      INTEGER DEFAULT 0,
    latency_ms        INTEGER,
    cost_estimate_usd REAL DEFAULT 0.0,
    truncated         INTEGER DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_session ON ai_interactions(session_id);

-- API credentials (encrypted at rest)
CREATE TABLE IF NOT EXISTS api_credentials (
    provider       TEXT PRIMARY KEY,
    api_key_enc    TEXT NOT NULL,
    api_secret_enc TEXT,
    base_url       TEXT,
    is_active      INTEGER DEFAULT 1,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings key-value store
CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- ============================================================
-- Tables below were added via migrations 002–004.
-- They are duplicated here so 001_initial.sql stays in sync
-- with the inline migration definitions in index.ts.
-- ============================================================

-- Flashcards (Spaced Repetition) — migration 002
CREATE TABLE IF NOT EXISTS flashcards (
    id                TEXT PRIMARY KEY,
    material_id       TEXT REFERENCES materials(id) ON DELETE SET NULL,
    feynman_attempt_id TEXT REFERENCES feynman_attempts(id) ON DELETE SET NULL,
    socratic_turn_id  TEXT REFERENCES socratic_turns(id) ON DELETE SET NULL,
    topic_id          TEXT REFERENCES topics(id) ON DELETE SET NULL,
    front             TEXT NOT NULL,
    back              TEXT NOT NULL,
    ease_factor       REAL DEFAULT 2.5,
    interval_days     INTEGER DEFAULT 0,
    repetitions       INTEGER DEFAULT 0,
    next_review_at    TEXT NOT NULL,
    last_review_at    TEXT,
    last_rating       TEXT CHECK (last_rating IN ('again','hard','good','easy')),
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON flashcards(topic_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_material ON flashcards(material_id);

-- Achievements — migration 002
CREATE TABLE IF NOT EXISTS achievements (
    id            TEXT PRIMARY KEY,
    key           TEXT NOT NULL UNIQUE,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    icon          TEXT DEFAULT '🥉',
    unlocked_at   TEXT,
    progress      REAL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Courses — migration 003
CREATE TABLE IF NOT EXISTS courses (
    id          TEXT PRIMARY KEY,
    subject_id  TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    instructor  TEXT DEFAULT '',
    semester    TEXT NOT NULL,
    schedule    TEXT DEFAULT '[]',
    exam_date   TEXT,
    credits     REAL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_exam ON courses(exam_date);

-- Study Goals — migration 003
CREATE TABLE IF NOT EXISTS study_goals (
    id          TEXT PRIMARY KEY,
    course_id   TEXT REFERENCES courses(id) ON DELETE CASCADE,
    topic_id    TEXT REFERENCES topics(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    target_date TEXT NOT NULL,
    completed   INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_goals_course ON study_goals(course_id);

-- Chat Messages — migration 004
CREATE TABLE IF NOT EXISTS chat_messages (
    id            TEXT PRIMARY KEY,
    session_id    TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    role          TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
    content       TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    metadata      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS photo_submissions (
  id TEXT PRIMARY KEY,
  station_slug TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_province TEXT,
  station_country TEXT,
  station_coords JSONB,
  title TEXT NOT NULL,
  composition JSONB NOT NULL DEFAULT '[]'::jsonb,
  train_type TEXT NOT NULL,
  image TEXT NOT NULL,
  date_text TEXT NOT NULL,
  operator_text TEXT NOT NULL,
  notes TEXT,
  submitted_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  moderated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS photo_submissions_status_idx ON photo_submissions(status);
CREATE INDEX IF NOT EXISTS photo_submissions_submitted_at_idx ON photo_submissions(submitted_at DESC);

CREATE TABLE IF NOT EXISTS photo_comments (
  id BIGSERIAL PRIMARY KEY,
  photo_key TEXT NOT NULL,
  body TEXT NOT NULL,
  author_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photo_comments_photo_key_idx ON photo_comments(photo_key);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

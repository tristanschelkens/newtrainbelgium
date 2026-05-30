const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const dbUrl = String(process.env.DATABASE_URL || '');
const sessionSecret = String(process.env.SESSION_SECRET || 'change_me');
const ownerUsername = String(process.env.OWNER_USERNAME || 'trainbelgium').trim().toLowerCase();

if (!dbUrl) {
  console.warn('DATABASE_URL is not set. Auth API will fail until configured.');
}

const pool = new Pool({ connectionString: dbUrl || undefined });

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser(sessionSecret));

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function readSessionToken(req) {
  return String(req.signedCookies?.tb_session || '').trim();
}

async function loadSessionUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;
  const q = `
    SELECT u.id, u.username, u.email, u.role
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = $1 AND s.expires_at > now()
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [token]);
  return rows[0] || null;
}

async function requireUser(req, res) {
  const user = await loadSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return null;
  }
  return user;
}

function isModeratorUser(user) {
  const role = String(user?.role || '').toLowerCase();
  const username = String(user?.username || '').toLowerCase();
  return role === 'moderator' || role === 'admin' || username === ownerUsername;
}

async function clearSession(token) {
  if (!token) return;
  await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie('tb_session', token, {
    signed: true,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });
}

function clearSessionCookie(res) {
  res.clearCookie('tb_session', { path: '/' });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/session', async (req, res) => {
  try {
    const user = await loadSessionUser(req);
    if (!user) return res.status(401).json({ ok: false, error: 'Not authenticated' });
    return res.json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!username || username.length < 3) return res.status(400).json({ ok: false, error: 'Username must be at least 3 characters.' });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
  if (!/[A-Z]/.test(password)) return res.status(400).json({ ok: false, error: 'Password must contain at least 1 uppercase letter.' });
  if (!/[0-9]/.test(password)) return res.status(400).json({ ok: false, error: 'Password must contain at least 1 number.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1', [username, email]);
    if (existing.rowCount > 0) return res.status(409).json({ ok: false, error: 'Username or email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const insert = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
      [username, email, passwordHash]
    );

    const user = insert.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await pool.query('INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, user.id, expiresAt.toISOString()]);
    setSessionCookie(res, token, expiresAt);

    return res.status(201).json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || '');
  if (!username || !password) return res.status(400).json({ ok: false, error: 'Username and password are required.' });

  try {
    const q = 'SELECT id, username, email, role, password_hash FROM users WHERE username = $1 LIMIT 1';
    const { rows } = await pool.query(q, [username]);
    const userRow = rows[0];
    if (!userRow) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await pool.query('INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, userRow.id, expiresAt.toISOString()]);
    setSessionCookie(res, token, expiresAt);

    return res.json({
      ok: true,
      user: {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        role: userRow.role
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = readSessionToken(req);
    await clearSession(token);
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const b = req.body || {};
    const id = `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const stationSlug = String(b.stationSlug || '').trim().toLowerCase();
    const stationName = String(b.stationName || '').trim();
    const title = String(b.title || '').trim();
    const trainType = String(b.trainType || '').trim();
    const image = String(b.image || '').trim();
    const dateText = String(b.date || '').trim();
    const operatorText = String(b.operator || '').trim();
    if (!stationSlug || !stationName || !title || !trainType || !image || !dateText || !operatorText) {
      return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
    }
    const composition = Array.isArray(b.composition) ? b.composition : [];
    await pool.query(
      `INSERT INTO photo_submissions
      (id, station_slug, station_name, station_province, station_country, station_coords, title, composition, train_type, image, date_text, operator_text, notes, submitted_by, status)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,'pending')`,
      [
        id,
        stationSlug,
        stationName,
        String(b.stationProvince || ''),
        String(b.stationCountry || ''),
        JSON.stringify(b.stationCoords || null),
        title,
        JSON.stringify(composition),
        trainType,
        image,
        dateText,
        operatorText,
        String(b.notes || ''),
        user.id,
      ],
    );
    return res.status(201).json({ ok: true, id });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/api/submissions/pending', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!isModeratorUser(user)) return res.status(403).json({ ok: false, error: 'Only moderators can access this page.' });
    const { rows } = await pool.query(
      `SELECT s.*, u.username AS submitted_by_name
       FROM photo_submissions s
       JOIN users u ON u.id = s.submitted_by
       WHERE s.status = 'pending'
       ORDER BY s.submitted_at ASC`
    );
    return res.json({
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        stationSlug: r.station_slug,
        stationName: r.station_name,
        stationProvince: r.station_province || '',
        stationCountry: r.station_country || '',
        stationCoords: r.station_coords || null,
        title: r.title,
        composition: Array.isArray(r.composition) ? r.composition : [],
        trainType: r.train_type,
        image: r.image,
        date: r.date_text,
        operator: r.operator_text,
        notes: r.notes || '',
        submittedBy: r.submitted_by_name,
        submittedAt: r.submitted_at,
        status: r.status,
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/api/submissions/approved', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || '60'), 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 200))
      : 60;
    const { rows } = await pool.query(
      `SELECT s.*, u.username AS submitted_by_name
       FROM photo_submissions s
       JOIN users u ON u.id = s.submitted_by
       WHERE s.status = 'approved'
       ORDER BY s.moderated_at DESC NULLS LAST, s.submitted_at DESC
       LIMIT $1`,
      [limit],
    );
    return res.json({
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        stationSlug: r.station_slug,
        stationName: r.station_name,
        stationProvince: r.station_province || '',
        stationCountry: r.station_country || '',
        stationCoords: r.station_coords || null,
        title: r.title,
        composition: Array.isArray(r.composition) ? r.composition : [],
        trainType: r.train_type,
        image: r.image,
        date: r.date_text,
        operator: r.operator_text,
        notes: r.notes || '',
        submittedBy: r.submitted_by_name,
        submittedAt: r.submitted_at,
        moderatedAt: r.moderated_at,
        status: r.status,
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/submissions/:id/moderate', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!isModeratorUser(user)) return res.status(403).json({ ok: false, error: 'Only moderators can moderate.' });
    const id = String(req.params.id || '').trim();
    const action = String(req.body?.action || '').trim().toLowerCase();
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ ok: false, error: 'Invalid moderation action.' });
    }
    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    const result = await pool.query(
      `UPDATE photo_submissions
       SET status = $2, moderated_by = $3, moderated_at = now()
       WHERE id = $1 AND status = 'pending'`,
      [id, nextStatus, user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, error: 'Submission not found.' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    const photoKey = String(req.query.photoKey || '').trim();
    if (!photoKey) return res.status(400).json({ ok: false, error: 'Missing photoKey' });
    const { rows } = await pool.query(
      `SELECT c.id, c.body, c.created_at, u.username AS author
       FROM photo_comments c
       JOIN users u ON u.id = c.author_user_id
       WHERE c.photo_key = $1
       ORDER BY c.created_at ASC`,
      [photoKey],
    );
    return res.json({ ok: true, items: rows });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const photoKey = String(req.body?.photoKey || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!photoKey || !body) return res.status(400).json({ ok: false, error: 'Missing comment data.' });
    if (body.length > 400) return res.status(400).json({ ok: false, error: 'Comment is too long.' });
    const { rows } = await pool.query(
      `INSERT INTO photo_comments (photo_key, body, author_user_id)
       VALUES ($1,$2,$3)
       RETURNING id, body, created_at`,
      [photoKey, body, user.id],
    );
    return res.status(201).json({
      ok: true,
      item: { ...rows[0], author: user.username },
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const id = Number(req.params.id || 0);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ ok: false, error: 'Invalid comment id.' });
    const q = `SELECT c.id, c.author_user_id, u.username AS author_name
               FROM photo_comments c
               JOIN users u ON u.id = c.author_user_id
               WHERE c.id = $1 LIMIT 1`;
    const found = await pool.query(q, [id]);
    const comment = found.rows[0];
    if (!comment) return res.status(404).json({ ok: false, error: 'Comment not found.' });
    const canDelete = isModeratorUser(user) || Number(comment.author_user_id) === Number(user.id);
    if (!canDelete) return res.status(403).json({ ok: false, error: 'Only moderators or owner can delete comments.' });
    await pool.query('DELETE FROM photo_comments WHERE id = $1', [id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.use(express.static(path.resolve(__dirname, '..')));

app.listen(port, () => {
  console.log(`TrainBelgium server on http://localhost:${port}`);
});

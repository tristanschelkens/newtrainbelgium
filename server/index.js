const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const dbUrl = String(process.env.DATABASE_URL || '');
const sessionSecret = String(process.env.SESSION_SECRET || 'change_me');
const ownerUsername = String(process.env.OWNER_USERNAME || 'EURORAILSHOTS').trim().toLowerCase();
const ownerUserId = String(process.env.OWNER_USER_ID || '').trim();
const smtpHost = String(process.env.SMTP_HOST || '').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = String(process.env.SMTP_USER || '').trim();
const smtpPass = String(process.env.SMTP_PASS || '').trim();
const smtpFrom = String(process.env.SMTP_FROM || smtpUser || '').trim();
const smtpSecure = String(process.env.SMTP_SECURE || 'false').trim().toLowerCase() === 'true';
const appBaseUrl = String(process.env.APP_BASE_URL || `http://localhost:${port}`).trim().replace(/\/+$/, '');

if (!dbUrl) {
  console.warn('DATABASE_URL is not set. Auth API will fail until configured.');
}

const pool = new Pool({ connectionString: dbUrl || undefined });
const mailTransporter = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass }
    })
  : null;

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser(sessionSecret));

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isStrongPassword(password) {
  return String(password || '').length >= 6 && /[A-Z]/.test(String(password || '')) && /[0-9]/.test(String(password || ''));
}

function generateNumericCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOneTimeCode(rawCode) {
  return crypto.createHash('sha256').update(String(rawCode || '')).digest('hex');
}

async function sendMailOrThrow({ to, subject, text, html }) {
  if (!mailTransporter || !smtpFrom) {
    throw new Error('Mail service is not configured on the server.');
  }
  await mailTransporter.sendMail({ from: smtpFrom, to, subject, text, html });
}

async function storeEmailVerificationCode(userId, email, rawCode) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [userId]);
  await pool.query(
    'INSERT INTO email_verification_codes (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, email, hashOneTimeCode(rawCode), expiresAt.toISOString()],
  );
}

async function storePasswordResetCode(userId, email, rawCode) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId]);
  await pool.query(
    'INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, email, hashOneTimeCode(rawCode), expiresAt.toISOString()],
  );
}

function buildPasswordResetLink(email, token) {
  const query = `mode=reset&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  return `${appBaseUrl}/pages/Login.html?${query}`;
}

function formatSubmissionDateForDisplay(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const slashMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 3000) {
      return `${day} ${monthNames[month - 1]} ${year}`;
    }
  }
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 3000) {
      return `${day} ${monthNames[month - 1]} ${year}`;
    }
  }
  return value;
}

async function isResetEmailCooldownActive(userId, cooldownSeconds = 30) {
  const q = 'SELECT created_at FROM password_reset_codes WHERE user_id = $1 LIMIT 1';
  const found = await pool.query(q, [userId]);
  const row = found.rows[0];
  if (!row?.created_at) return false;
  const elapsedMs = Date.now() - new Date(row.created_at).getTime();
  return elapsedMs < cooldownSeconds * 1000;
}

async function isVerificationEmailCooldownActive(userId, cooldownSeconds = 30) {
  const q = 'SELECT created_at FROM email_verification_codes WHERE user_id = $1 LIMIT 1';
  const found = await pool.query(q, [userId]);
  const row = found.rows[0];
  if (!row?.created_at) return false;
  const elapsedMs = Date.now() - new Date(row.created_at).getTime();
  return elapsedMs < cooldownSeconds * 1000;
}

async function ensureAuthTables() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
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
  const userId = String(user?.id || '').trim();
  const isOwnerById = Boolean(ownerUserId) && userId === ownerUserId;
  return role === 'moderator' || role === 'admin' || isOwnerById || username === ownerUsername;
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

function generateRandomUserId() {
  return crypto.randomInt(1_000_000_000, 999_999_999_999);
}

async function insertUserWithRandomId(username, email, passwordHash) {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const id = generateRandomUserId();
    try {
      const insert = await pool.query(
        'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [id, username, email, passwordHash],
      );
      return insert.rows[0];
    } catch (err) {
      if (err?.code === '23505' && String(err?.constraint || '').includes('users_pkey')) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Could not generate a unique user id.');
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const stationSlugAliases = {
  'antwerpen-berchem': 'antwerp-berchem',
  'antwerpen-centraal': 'antwerp-central',
  'antwerpen-linkeroever': 'antwerp-linkeroever',
  'antwerpen-luchtbal': 'antwerp-luchtbal',
  'antwerpen-noorderdokken': 'antwerp-noorderdokken',
  'antwerpen-zuid': 'antwerp-south',
};

const stationNameAliases = {
  'antwerp-berchem': 'Antwerp-Berchem',
  'antwerp-central': 'Antwerp-Central',
  'antwerp-linkeroever': 'Antwerp-Linkeroever',
  'antwerp-luchtbal': 'Antwerp-Luchtbal',
  'antwerp-noorderdokken': 'Antwerp-Noorderdokken',
  'antwerp-south': 'Antwerp-South',
  'antwerpen-berchem': 'Antwerp-Berchem',
  'antwerpen-centraal': 'Antwerp-Central',
  'antwerpen-linkeroever': 'Antwerp-Linkeroever',
  'antwerpen-luchtbal': 'Antwerp-Luchtbal',
  'antwerpen-noorderdokken': 'Antwerp-Noorderdokken',
  'antwerpen-zuid': 'Antwerp-South',
};

function slugifyStationValue(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canonicalStationSlug(value) {
  const slug = slugifyStationValue(value);
  return stationSlugAliases[slug] || slug;
}

function canonicalStationName(name, slug) {
  const nameKey = slugifyStationValue(name);
  const slugKey = canonicalStationSlug(slug || nameKey);
  return stationNameAliases[nameKey] || stationNameAliases[slugKey] || String(name || '').trim();
}

const vehiclePrefixNames = {
  am: 'AM',
  ar: 'AR',
  br: 'BR',
  desiro: 'Desiro',
  e: 'E',
  hld: 'HLD',
  hle: 'HLE',
  hlr: 'HLR',
  i: 'I',
  m: 'M',
  p: 'P',
  mw: 'MW',
  ms: 'MS',
  traxx: 'TRAXX',
  tgv: 'TGV',
};

const spacedVehiclePrefixes = new Set(['am', 'ar', 'hle', 'hld', 'hlr', 'mw', 'ms']);
const compactVehiclePrefixes = new Set(['i', 'm', 'p']);

function normalizeVehicleLabel(value) {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  const compact = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const match = compact.match(/^([a-z]+)(\d+)(.*)$/);
  if (!match) {
    return raw
      .split(' ')
      .map((part) => vehiclePrefixNames[part.toLowerCase()] || part)
      .join(' ');
  }
  const prefixKey = match[1];
  const prefix = vehiclePrefixNames[prefixKey] || prefixKey.toUpperCase();
  const digits = match[2];
  const tail = match[3] ? ` ${match[3].toUpperCase()}` : '';
  if (prefixKey === 'br') {
    if (digits.length === 7) return `BR ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}${tail}`;
    if (digits.length === 6) return `BR ${digits.slice(0, 3)} ${digits.slice(3)}${tail}`;
  }
  if (spacedVehiclePrefixes.has(prefixKey)) {
    if (digits.length <= 2) return `${prefix} ${digits.padStart(2, '0')}${tail}`;
    return `${prefix} ${digits}${tail}`;
  }
  if (compactVehiclePrefixes.has(prefixKey) || prefixKey.length === 1) return `${prefix}${digits}${tail}`;
  return `${prefix} ${digits}${tail}`;
}

function pickLeadCompositionItem(parts) {
  const list = Array.isArray(parts) ? parts.filter(Boolean) : [];
  if (list.length === 0) return null;
  const explicitLead = list.find((part) => part?.lead === true);
  if (explicitLead) return explicitLead;
  const firstTraction = list.find((part) => String(part?.train || part?.label || '').trim());
  return firstTraction || list[0];
}

function normalizeSubmissionComposition(parts) {
  if (!Array.isArray(parts)) return [];
  function splitTrainNumber(value) {
    const raw = normalizeVehicleLabel(value).replace(/^\d+\s*x\s*/i, '').trim();
    if (!raw) return { train: '', number: '' };
    const chunks = raw.split(/\s+/).filter(Boolean);
    if (chunks.length < 2) return { train: raw, number: '' };
    const familyPrefixes = new Set(['AM', 'AR', 'HLE', 'HLD', 'HLR', 'TRAXX', 'BR', 'E', 'MW', 'MS']);
    if (familyPrefixes.has(String(chunks[0] || '').toUpperCase()) && /^\d{1,4}$/.test(String(chunks[1] || ''))) {
      const train = `${chunks[0]} ${chunks[1]}`;
      const maybeNumber = String(chunks[2] || '');
      return { train, number: /^\d+(?:-\d+)?$/.test(maybeNumber) ? maybeNumber : '' };
    }
    if (String(chunks[0] || '').toLowerCase() === 'class' && /^\d{1,4}$/.test(String(chunks[1] || ''))) {
      const train = `Class ${chunks[1]}`;
      const maybeNumber = String(chunks[2] || '');
      return { train, number: /^\d+(?:-\d+)?$/.test(maybeNumber) ? maybeNumber : '' };
    }
    const last = chunks[chunks.length - 1];
    if (/^\d+(?:-\d+)?$/.test(last)) {
      return { train: chunks.slice(0, -1).join(' ').trim(), number: last };
    }
    return { train: raw, number: '' };
  }
  const normalized = parts
    .map((part) => {
      const split = splitTrainNumber(part?.train || part?.label);
      if (!split.train) return null;
      return { train: split.train, number: split.number, lead: Boolean(part?.lead) };
    })
    .filter(Boolean);
  const lead = pickLeadCompositionItem(normalized);
  return lead ? [lead] : [];
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
  if (!isStrongPassword(password)) return res.status(400).json({ ok: false, error: 'Password must be at least 6 chars, include 1 uppercase and 1 number.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1', [username, email]);
    if (existing.rowCount > 0) return res.status(409).json({ ok: false, error: 'Username or email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await insertUserWithRandomId(username, email, passwordHash);
    const code = generateNumericCode();
    await storeEmailVerificationCode(user.id, email, code);
    await sendMailOrThrow({
      to: email,
      subject: 'Your EURORAILSHOTS verification code',
      text: `Your verification code is: ${code}. It expires in 15 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
    return res.status(201).json({ ok: true, requiresEmailVerification: true, email });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || '');
  if (!username || !password) return res.status(400).json({ ok: false, error: 'Username and password are required.' });

  try {
    const q = 'SELECT id, username, email, role, password_hash, email_verified FROM users WHERE username = $1 LIMIT 1';
    const { rows } = await pool.query(q, [username]);
    const userRow = rows[0];
    if (!userRow) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
    if (!userRow.email_verified) {
      const code = generateNumericCode();
      await storeEmailVerificationCode(userRow.id, userRow.email, code);
      await sendMailOrThrow({
        to: userRow.email,
        subject: 'Your EURORAILSHOTS verification code',
        text: `Your verification code is: ${code}. It expires in 15 minutes.`,
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
      });
      return res.status(403).json({ ok: false, error: 'Email verification required.', requiresEmailVerification: true, email: userRow.email });
    }

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
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email and 6-digit code.' });
  }
  try {
    const { rows } = await pool.query('SELECT id, username, email, role FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid code.' });
    const codeRows = await pool.query('SELECT code_hash, expires_at, used_at FROM email_verification_codes WHERE user_id = $1 LIMIT 1', [user.id]);
    const codeRow = codeRows.rows[0];
    if (!codeRow || codeRow.used_at || new Date(codeRow.expires_at).getTime() < Date.now() || codeRow.code_hash !== hashOneTimeCode(code)) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired code.' });
    }
    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);
    await pool.query('UPDATE email_verification_codes SET used_at = now() WHERE user_id = $1', [user.id]);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await pool.query('INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, user.id, expiresAt.toISOString()]);
    setSessionCookie(res, token, expiresAt);
    return res.json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
  }
});

app.post('/api/auth/resend-verification-code', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  try {
    const { rows } = await pool.query('SELECT id, email_verified FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];
    if (!user) return res.json({ ok: true });
    if (user.email_verified) return res.status(400).json({ ok: false, error: 'This email is already verified.' });
    if (await isVerificationEmailCooldownActive(user.id, 30)) {
      return res.status(429).json({ ok: false, error: 'Please wait 30 seconds before requesting a new code.' });
    }
    const code = generateNumericCode();
    await storeEmailVerificationCode(user.id, email, code);
    await sendMailOrThrow({
      to: email,
      subject: 'Your EURORAILSHOTS verification code',
      text: `Your verification code is: ${code}. It expires in 15 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
  }
});

app.post('/api/auth/request-password-reset', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];
    if (user) {
      if (await isResetEmailCooldownActive(user.id, 30)) {
        return res.status(429).json({ ok: false, error: 'Please wait 30 seconds before requesting another reset email.' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      await storePasswordResetCode(user.id, email, token);
      const resetLink = buildPasswordResetLink(email, token);
      await sendMailOrThrow({
        to: email,
        subject: 'Reset your EURORAILSHOTS password',
        text: `Click this link to reset your password: ${resetLink}\n\nThis link expires in 15 minutes.`,
        html: `<p>Click this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 15 minutes.</p>`,
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  if (!isValidEmail(email) || (!token && !/^\d{6}$/.test(code))) return res.status(400).json({ ok: false, error: 'Invalid reset request.' });
  if (!isStrongPassword(password)) return res.status(400).json({ ok: false, error: 'Password must be at least 6 chars, include 1 uppercase and 1 number.' });
  try {
    const userRows = await pool.query('SELECT id, username, email, role FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = userRows.rows[0];
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid or expired code.' });
    const codeRows = await pool.query('SELECT code_hash, expires_at, used_at FROM password_reset_codes WHERE user_id = $1 LIMIT 1', [user.id]);
    const codeRow = codeRows.rows[0];
    const presentedSecret = token || code;
    if (!codeRow || codeRow.used_at || new Date(codeRow.expires_at).getTime() < Date.now() || codeRow.code_hash !== hashOneTimeCode(presentedSecret)) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired code.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
    await pool.query('UPDATE password_reset_codes SET used_at = now() WHERE user_id = $1', [user.id]);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await pool.query('INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [sessionToken, user.id, expiresAt.toISOString()]);
    setSessionCookie(res, sessionToken, expiresAt);
    return res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || 'Server error') });
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
    const stationSlug = canonicalStationSlug(b.stationSlug || b.stationName);
    const stationName = canonicalStationName(b.stationName, stationSlug);
    const stationCountry = String(b.stationCountry || '').trim();
    const title = String(b.title || '').trim();
    const trainType = String(b.trainType || '').trim();
    const image = String(b.image || '').trim();
    const dateText = formatSubmissionDateForDisplay(String(b.date || '').trim());
    const operatorText = String(b.operator || '').trim();
    if (!stationSlug || !stationName || !stationCountry || !title || !trainType || !image || !dateText || !operatorText) {
      return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
    }
    const composition = normalizeSubmissionComposition(b.composition);
    await pool.query(
      `INSERT INTO photo_submissions
      (id, station_slug, station_name, station_province, station_country, station_coords, title, composition, train_type, image, date_text, operator_text, notes, submitted_by, status)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,'pending')`,
      [
        id,
        stationSlug,
        stationName,
        String(b.stationProvince || ''),
        stationCountry,
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
        composition: normalizeSubmissionComposition(parseJsonArray(r.composition)),
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
        composition: normalizeSubmissionComposition(parseJsonArray(r.composition)),
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

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const username = String(user?.username || '').trim().toLowerCase();
    const userId = String(user?.id || '').trim();
    const isOwnerById = Boolean(ownerUserId) && userId === ownerUserId;
    if (!isOwnerById && username !== ownerUsername) {
      return res.status(403).json({ ok: false, error: 'Only owner can delete photos.' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ ok: false, error: 'Missing submission id.' });

    const result = await pool.query('DELETE FROM photo_submissions WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ ok: false, error: 'Photo not found.' });
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

ensureAuthTables()
  .then(() => {
    app.listen(port, () => {
      console.log(`EURORAILSHOTS server on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize auth tables:', err);
    process.exit(1);
  });

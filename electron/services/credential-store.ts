import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getDatabase, forceSave } from './database/connection'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const ALGORITHM = 'aes-256-gcm'

// ═══════════════════════════════════════════════════════════
// Security: Per-machine encryption key (fixes hardcoded-key vulnerability)
// Each installation gets a unique AES-256 key stored separately from the database.
// Even if an attacker steals the DB file, they cannot decrypt API keys without
// also obtaining the machine-specific key file.
// ═══════════════════════════════════════════════════════════

function getMachineKeyPath(): string {
  return join(app.getPath('userData'), '.machine-key')
}

function getOrCreateMachineKey(): Buffer {
  const keyPath = getMachineKeyPath()
  if (existsSync(keyPath)) {
    const raw = readFileSync(keyPath).toString().trim()
    // Validate: must be exactly 64 hex chars (32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex')
    }
    // Key file is corrupted — regenerate it (user will need to re-enter credentials)
    console.error('[Credentials] Machine key corrupted, regenerating. Stored credentials will need to be re-entered.')
    try { writeFileSync(keyPath + '.corrupted.' + Date.now() + '.bak', raw) } catch {}
  }
  const key = randomBytes(32)
  const dir = app.getPath('userData')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 })
  return key
}

const KEY = getOrCreateMachineKey()

// Legacy hardcoded key — used ONLY for one-time migration of old data
const OLD_SALT = 'learning-assistant-salt-v1'
const OLD_KEY = scryptSync('learning-assistant-key', OLD_SALT, 32)

export interface APICredentials {
  apiKey: string
  apiSecret?: string
  baseUrl?: string
  isActive?: boolean
}

function encryptWithKey(text: string, key: Buffer): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptWithKey(encryptedText: string, key: Buffer): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted data format')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = Buffer.from(parts[2], 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf-8')
}

// Current key operations (use machine-specific key)
function encrypt(text: string): string {
  return encryptWithKey(text, KEY)
}

function decrypt(encryptedText: string): string {
  return decryptWithKey(encryptedText, KEY)
}

/**
 * One-time migration: re-encrypt credentials from the old hardcoded key
 * to the new per-machine key. Safe to call multiple times — once migrated,
 * the flag prevents re-running.
 */
function migrateFromLegacyKey(): void {
  const db = getDatabase()

  // Check migration flag
  const flag = db.prepare(
    "SELECT value FROM app_settings WHERE key = 'credential_migration_done'"
  ).get() as any
  if (flag?.value === '1') return

  // Try to migrate each stored credential
  const rows = db.prepare(
    'SELECT provider, api_key_enc, api_secret_enc FROM api_credentials'
  ).all() as any[]

  for (const row of rows) {
    try {
      // Attempt decryption with old key
      const decryptedKey = decryptWithKey(row.api_key_enc, OLD_KEY)
      // Re-encrypt with new machine key
      const reEncryptedKey = encryptWithKey(decryptedKey, KEY)

      let reEncryptedSecret: string | null = null
      if (row.api_secret_enc) {
        // Try old key first — if that fails, try the new key. If BOTH fail,
        // the secret is corrupt and we leave it (user can re-enter).
        try {
          const decryptedSecret = decryptWithKey(row.api_secret_enc, OLD_KEY)
          reEncryptedSecret = encryptWithKey(decryptedSecret, KEY)
        } catch {
          // Couldn't decrypt with old key — check if it's already using the new key
          try {
            decryptWithKey(row.api_secret_enc, KEY)
            // Already migrated: leave as-is
          } catch {
            // Neither key works — data is corrupt, leave as-is (user must re-enter)
          }
        }
      }

      db.prepare(
        'UPDATE api_credentials SET api_key_enc = ?, api_secret_enc = COALESCE(?, api_secret_enc) WHERE provider = ?'
      ).run(reEncryptedKey, reEncryptedSecret, row.provider)
    } catch {
      // Decryption with old key failed — credential is either already migrated
      // or was created after the machine key was generated. Skip.
    }
  }

  // Mark migration as complete
  db.prepare(
    "INSERT INTO app_settings (key, value) VALUES ('credential_migration_done', '1') ON CONFLICT(key) DO UPDATE SET value = '1'"
  ).run()
  forceSave()
}

export function setCredentials(provider: string, credentials: APICredentials): void {
  const db = getDatabase()
  const encryptedKey = encrypt(credentials.apiKey)
  const encryptedSecret = credentials.apiSecret ? encrypt(credentials.apiSecret) : null

  db.prepare(`
    INSERT INTO api_credentials (provider, api_key_enc, api_secret_enc, base_url, is_active)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      api_key_enc = excluded.api_key_enc,
      api_secret_enc = excluded.api_secret_enc,
      base_url = excluded.base_url,
      is_active = excluded.is_active,
      updated_at = datetime('now')
  `).run(
    provider,
    encryptedKey,
    encryptedSecret,
    credentials.baseUrl || null,
    credentials.isActive !== false ? 1 : 0
  )

  // Force immediate disk write — credentials must not be lost on crash
  forceSave()
}

export function getCredentials(provider: string): APICredentials | null {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM api_credentials WHERE provider = ?'
  ).get(provider) as any

  if (!row) return null

  try {
    return {
      apiKey: decrypt(row.api_key_enc),
      apiSecret: row.api_secret_enc ? decrypt(row.api_secret_enc) : undefined,
      baseUrl: row.base_url || undefined,
      isActive: row.is_active === 1,
    }
  } catch {
    // If decryption fails (e.g. machine-key was deleted), return null
    // rather than crashing — user can re-enter credentials
    return null
  }
}

export function deleteCredentials(provider: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM api_credentials WHERE provider = ?').run(provider)
  forceSave()
}

export function listProviders(): string[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT provider FROM api_credentials WHERE is_active = 1').all() as any[]
  return rows.map((row) => {
    // Auto-migrate 'local' → 'custom' for backward compatibility
    if (row.provider === 'local') return 'custom'
    return row.provider
  })
}

/**
 * Migrate old 'local' provider credentials to new 'custom' provider.
 * Called once on app startup. Safe to call multiple times.
 */
export function migrateLocalToCustom(): void {
  const localCreds = getCredentials('local')
  if (!localCreds) return

  // Only migrate if 'custom' doesn't already exist
  const existingCustom = getCredentials('custom')
  if (existingCustom) {
    // Custom already configured — just clean up local
    deleteCredentials('local')
    return
  }

  // Copy local → custom
  setCredentials('custom', localCreds)
  // Remove old entry
  deleteCredentials('local')
}

/**
 * Run credential key migration on startup. Converts old hardcoded-key
 * encrypted credentials to per-machine key encryption.
 */
export function runCredentialMigration(): void {
  try {
    migrateFromLegacyKey()
  } catch {
    // Migration failure is non-fatal — users can re-enter credentials
  }
}

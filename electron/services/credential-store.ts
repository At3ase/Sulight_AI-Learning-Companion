import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getDatabase, forceSave } from './database/connection'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'learning-assistant-salt-v1' // In production, store this securely
const KEY = scryptSync('learning-assistant-key', SALT, 32)

export interface APICredentials {
  apiKey: string
  apiSecret?: string
  baseUrl?: string
  isActive?: boolean
}

function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Store iv + authTag + encrypted as hex
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = Buffer.from(parts[2], 'hex')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf-8')
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

  return {
    apiKey: decrypt(row.api_key_enc),
    apiSecret: row.api_secret_enc ? decrypt(row.api_secret_enc) : undefined,
    baseUrl: row.base_url || undefined,
    isActive: row.is_active === 1,
  }
}

export function deleteCredentials(provider: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM api_credentials WHERE provider = ?').run(provider)
  forceSave()
}

export function listProviders(): string[] {
  const db = getDatabase()
  return (db.prepare('SELECT provider FROM api_credentials WHERE is_active = 1').all() as any[]).map(
    (row) => row.provider
  )
}

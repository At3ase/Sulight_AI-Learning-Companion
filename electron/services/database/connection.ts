import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, copyFileSync, unlinkSync } from 'fs'
import { runMigrations } from './migrations'

let db: SqlJsDatabase | null = null
let SQL: SqlJsStatic | null = null
let dbPath: string = ''

// Simple adapter to make sql.js API similar to better-sqlite3
export class Statement {
  private stmt: any
  private sql: string

  constructor(db: SqlJsDatabase, sql: string) {
    this.sql = sql
    this.stmt = db.prepare(sql)
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number } {
    this.stmt.bind(params)
    this.stmt.step()
    const rowsModified = db!.getRowsModified()
    this.stmt.free()
    return { changes: rowsModified, lastInsertRowid: 0 }
  }

  get(...params: any[]): any | undefined {
    this.stmt.bind(params)
    if (this.stmt.step()) {
      const row = this.stmt.getAsObject()
      this.stmt.free()
      return row
    }
    this.stmt.free()
    return undefined
  }

  all(...params: any[]): any[] {
    this.stmt.bind(params)
    const results: any[] = []
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject())
    }
    this.stmt.free()
    return results
  }
}

export class DatabaseAdapter {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  prepare(sql: string): Statement {
    return new Statement(this.db, sql)
  }

  exec(sql: string): void {
    this.db.run(sql)
  }

  pragma(pragmaStr: string): void {
    this.db.run(`PRAGMA ${pragmaStr}`)
  }

  transaction(fn: (...args: any[]) => void): (...args: any[]) => void {
    return (...args: any[]) => {
      this.db.run('BEGIN')
      try {
        fn(...args)
        this.db.run('COMMIT')
      } catch (e) {
        this.db.run('ROLLBACK')
        throw e
      }
    }
  }

  getRawDb(): SqlJsDatabase {
    return this.db
  }
}

let adapter: DatabaseAdapter | null = null

export function getDatabase(): DatabaseAdapter {
  if (!adapter) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return adapter
}

function saveToDisk(): void {
  if (!db || !dbPath) return
  let data: Uint8Array | null = null
  try {
    data = db.export()
    const buffer = Buffer.from(data)
    const tmpPath = dbPath + '.tmp'

    // Phase 1: write new data to temp file
    writeFileSync(tmpPath, buffer)

    // Phase 2: atomically replace main file with temp file
    // On modern Node.js (14+), renameSync handles cross-platform replace.
    // Keep a .bak fallback in case something goes wrong.
    try {
      renameSync(tmpPath, dbPath)
    } catch (moveErr: any) {
      // If rename fails (e.g. antivirus lock on Windows), fall back to copy
      console.warn('[DB] renameSync failed, using copy fallback:', moveErr.code || moveErr.message)
      copyFileSync(tmpPath, dbPath)
      try { unlinkSync(tmpPath) } catch {}
    }
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err)
    // Last resort: try direct overwrite if we still have data
    if (data) {
      try { writeFileSync(dbPath, Buffer.from(data)) } catch {}
    }
  }
}

/**
 * Force an immediate database save. Call this after critical writes
 * (credential changes, settings saves) that must not be lost.
 */
export function forceSave(): void {
  saveToDisk()
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')

  // Ensure data directory exists
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  dbPath = join(dbDir, 'learning-assistant.db')

  // Initialize sql.js
  SQL = await initSqlJs()

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
    console.log(`Database loaded from: ${dbPath}`)
  } else {
    db = new SQL.Database()
    console.log(`New database created at: ${dbPath}`)
  }

  // Enable WAL mode (best effort - sql.js may not support all pragmas)
  try { db.run('PRAGMA journal_mode = WAL') } catch {}
  db.run('PRAGMA foreign_keys = ON')

  adapter = new DatabaseAdapter(db)

  // Run migrations
  runMigrations()

  // Initial save
  saveToDisk()

  // Auto-save every 30 seconds
  setInterval(saveToDisk, 30000)

  // Save on app exit
  app.on('before-quit', () => {
    saveToDisk()
  })
}

export function saveDatabase(): void {
  saveToDisk()
}

export function closeDatabase(): void {
  saveToDisk()
  if (db) {
    db.close()
    db = null
    adapter = null
  }
}

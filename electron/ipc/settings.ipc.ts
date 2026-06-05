import { ipcMain } from 'electron'
import { getDatabase, forceSave } from '../services/database/connection'
import { setCredentials, getCredentials, deleteCredentials, listProviders } from '../services/credential-store'

export function registerSettingsHandlers(): void {
  // App settings (plain key-value)
  ipcMain.handle('settings:get', (_e, key: string) => {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    const db = getDatabase()
    db.prepare(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run(key, value)
    // Immediately persist critical settings (provider selection, etc.)
    forceSave()
  })

  ipcMain.handle('settings:getAll', () => {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM app_settings').all() as any[]
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })

  // Credential management (encrypted)
  ipcMain.handle('settings:setCredentials', (_e, provider: string, credentials: any) => {
    setCredentials(provider, credentials)
  })

  ipcMain.handle('settings:getCredentials', (_e, provider: string) => {
    return getCredentials(provider)
  })

  ipcMain.handle('settings:deleteCredentials', (_e, provider: string) => {
    deleteCredentials(provider)
  })

  ipcMain.handle('settings:listProviders', () => {
    return listProviders()
  })
}

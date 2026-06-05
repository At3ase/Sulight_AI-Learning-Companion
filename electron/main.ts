import { app, BrowserWindow, dialog } from 'electron'
import { createWindow } from './window'
import { initDatabase } from './services/database/connection'
import { registerAllIPCHandlers } from './ipc'
import { closeDatabase } from './services/database/connection'

let mainWindow: BrowserWindow | null = null

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(async () => {
  // Initialize database with corruption recovery
  try {
    await initDatabase()
  } catch (err) {
    console.error('Failed to initialize database:', err)
    // Attempt recovery: rename the corrupted DB and create a fresh one
    try {
      const { join } = require('path')
      const { renameSync, existsSync } = require('fs')
      const userDataPath = app.getPath('userData')
      const dbPath = join(userDataPath, 'data', 'learning-assistant.db')
      const backupPath = dbPath + '.corrupted.' + Date.now() + '.bak'
      if (existsSync(dbPath)) {
        renameSync(dbPath, backupPath)
        console.log(`Corrupted DB backed up to: ${backupPath}`)
      }
      // Retry with fresh DB
      await initDatabase()
    } catch (retryErr) {
      console.error('Database recovery failed:', retryErr)
      dialog.showErrorBox('数据库错误', '无法初始化数据库。请尝试重启应用或删除数据目录后重试。')
      app.quit()
      return
    }
  }

  // Register IPC handlers
  registerAllIPCHandlers()

  // Create main window
  mainWindow = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})

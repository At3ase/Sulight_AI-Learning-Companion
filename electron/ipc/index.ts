import { registerDatabaseHandlers } from './database.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerAppHandlers } from './app.ipc'
import { registerAIHandlers } from './ai.ipc'
import { registerFileHandlers } from './file.ipc'

export function registerAllIPCHandlers(): void {
  registerDatabaseHandlers()
  registerSettingsHandlers()
  registerAppHandlers()
  registerAIHandlers()
  registerFileHandlers()
}

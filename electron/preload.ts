import { contextBridge, ipcRenderer } from 'electron'

// Type-safe API exposed to renderer via contextBridge
const electronAPI = {
  // ── AI ──────────────────────────────────────────────────
  ai: {
    streamChat: (params: any) => ipcRenderer.invoke('ai:streamChat', params),
    complete: (params: any) => ipcRenderer.invoke('ai:complete', params),
    cancelStream: (streamId: string) => ipcRenderer.invoke('ai:cancelStream', streamId),
    listModels: (provider: string) => ipcRenderer.invoke('ai:listModels', provider),
    testConnection: (provider: string, apiKey: string, baseUrl?: string) =>
      ipcRenderer.invoke('ai:testConnection', provider, apiKey, baseUrl),
    onStreamChunk: (callback: (data: any) => void) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('ai:chunk', handler)
      return () => ipcRenderer.removeListener('ai:chunk', handler)
    },
    onStreamDone: (callback: (data: any) => void) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('ai:done', handler)
      return () => ipcRenderer.removeListener('ai:done', handler)
    },
    onStreamError: (callback: (data: any) => void) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('ai:error', handler)
      return () => ipcRenderer.removeListener('ai:error', handler)
    },
  },

  // ── File Operations ─────────────────────────────────────
  files: {
    importFile: (topicId?: string) => ipcRenderer.invoke('file:import', topicId),
    parseFile: (filePath: string) => ipcRenderer.invoke('file:parse', filePath),
    readMaterial: (materialId: string) => ipcRenderer.invoke('file:readMaterial', materialId),
    deleteFile: (materialId: string) => ipcRenderer.invoke('file:deleteFile', materialId),
    getDataPath: () => ipcRenderer.invoke('file:getDataPath'),
    export: {
      markdown: (data: any) => ipcRenderer.invoke('file:export:markdown', data),
      anki: (data: any) => ipcRenderer.invoke('file:export:anki', data),
      sessionLog: (sessionId: string) => ipcRenderer.invoke('file:export:sessionLog', sessionId),
      allData: () => ipcRenderer.invoke('file:export:allData'),
    },
  },

  // ── Database (CRUD per entity) ──────────────────────────
  db: {
    subjects: {
      list: () => ipcRenderer.invoke('db:subjects:list'),
      get: (id: string) => ipcRenderer.invoke('db:subjects:get', id),
      create: (data: any) => ipcRenderer.invoke('db:subjects:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:subjects:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:subjects:delete', id),
    },
    topics: {
      listBySubject: (subjectId: string) => ipcRenderer.invoke('db:topics:listBySubject', subjectId),
      get: (id: string) => ipcRenderer.invoke('db:topics:get', id),
      getTree: (subjectId: string) => ipcRenderer.invoke('db:topics:getTree', subjectId),
      create: (data: any) => ipcRenderer.invoke('db:topics:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:topics:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:topics:delete', id),
      reorder: (subjectId: string, orderedIds: string[]) =>
        ipcRenderer.invoke('db:topics:reorder', subjectId, orderedIds),
    },
    materials: {
      listByTopic: (topicId: string) => ipcRenderer.invoke('db:materials:listByTopic', topicId),
      get: (id: string) => ipcRenderer.invoke('db:materials:get', id),
      search: (query: string) => ipcRenderer.invoke('db:materials:search', query),
      update: (id: string, data: any) => ipcRenderer.invoke('db:materials:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:materials:delete', id),
    },
    sessions: {
      list: (filters?: any) => ipcRenderer.invoke('db:sessions:list', filters),
      get: (id: string) => ipcRenderer.invoke('db:sessions:get', id),
      getActive: () => ipcRenderer.invoke('db:sessions:getActive'),
      create: (data: any) => ipcRenderer.invoke('db:sessions:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:sessions:update', id, data),
      getStats: () => ipcRenderer.invoke('db:sessions:getStats'),
    },
    chatMessages: {
      listBySession: (sessionId: string) => ipcRenderer.invoke('db:chatMessages:listBySession', sessionId),
      create: (data: { sessionId: string; role: string; content: string; metadata?: string }) =>
        ipcRenderer.invoke('db:chatMessages:create', data),
      deleteBySession: (sessionId: string) => ipcRenderer.invoke('db:chatMessages:deleteBySession', sessionId),
    },
    feynman: {
      list: (sessionId: string) => ipcRenderer.invoke('db:feynman:list', sessionId),
      create: (data: any) => ipcRenderer.invoke('db:feynman:create', data),
    },
    firstPrinciples: {
      list: (sessionId: string) => ipcRenderer.invoke('db:firstPrinciples:list', sessionId),
      create: (data: any) => ipcRenderer.invoke('db:firstPrinciples:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:firstPrinciples:update', id, data),
    },
    socratic: {
      list: (sessionId: string) => ipcRenderer.invoke('db:socratic:list', sessionId),
      create: (data: any) => ipcRenderer.invoke('db:socratic:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:socratic:update', id, data),
    },
    aiInteractions: {
      list: (sessionId?: string) => ipcRenderer.invoke('db:aiInteractions:list', sessionId),
      getStats: () => ipcRenderer.invoke('db:aiInteractions:getStats'),
    },
    flashcards: {
      listDue: (topicId?: string, examUrgency?: boolean) =>
        ipcRenderer.invoke('db:flashcards:listDue', topicId, examUrgency),
      listByTopic: (topicId: string) => ipcRenderer.invoke('db:flashcards:listByTopic', topicId),
      create: (data: any) => ipcRenderer.invoke('db:flashcards:create', data),
      review: (id: string, rating: string) => ipcRenderer.invoke('db:flashcards:review', id, rating),
      generate: (data: any) => ipcRenderer.invoke('db:flashcards:generate', data),
      getStats: (topicId?: string) => ipcRenderer.invoke('db:flashcards:getStats', topicId),
    },
    achievements: {
      list: () => ipcRenderer.invoke('db:achievements:list'),
      check: () => ipcRenderer.invoke('db:achievements:check'),
    },
    courses: {
      list: () => ipcRenderer.invoke('db:courses:list'),
      get: (id: string) => ipcRenderer.invoke('db:courses:get', id),
      listBySubject: (subjectId: string) => ipcRenderer.invoke('db:courses:listBySubject', subjectId),
      create: (data: any) => ipcRenderer.invoke('db:courses:create', data),
      update: (id: string, data: any) => ipcRenderer.invoke('db:courses:update', id, data),
      delete: (id: string) => ipcRenderer.invoke('db:courses:delete', id),
      getExamCountdown: () => ipcRenderer.invoke('db:courses:getExamCountdown'),
    },
    studyGoals: {
      listByCourse: (courseId: string) => ipcRenderer.invoke('db:studyGoals:listByCourse', courseId),
      create: (data: any) => ipcRenderer.invoke('db:studyGoals:create', data),
      toggle: (id: string) => ipcRenderer.invoke('db:studyGoals:toggle', id),
      delete: (id: string) => ipcRenderer.invoke('db:studyGoals:delete', id),
    },
    analytics: {
      comprehensionHeatmap: () => ipcRenderer.invoke('db:analytics:comprehensionHeatmap'),
      learningStreak: () => ipcRenderer.invoke('db:analytics:learningStreak'),
      timeDistribution: () => ipcRenderer.invoke('db:analytics:timeDistribution'),
      feynmanScoreTrend: () => ipcRenderer.invoke('db:analytics:feynmanScoreTrend'),
      masteryOverview: () => ipcRenderer.invoke('db:analytics:masteryOverview'),
      weeklyReport: () => ipcRenderer.invoke('db:analytics:weeklyReport'),
      subjectProgress: () => ipcRenderer.invoke('db:analytics:subjectProgress'),
    },
  },

  // ── Settings ────────────────────────────────────────────
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    setCredentials: (provider: string, credentials: any) =>
      ipcRenderer.invoke('settings:setCredentials', provider, credentials),
    getCredentials: (provider: string) => ipcRenderer.invoke('settings:getCredentials', provider),
    deleteCredentials: (provider: string) =>
      ipcRenderer.invoke('settings:deleteCredentials', provider),
    listProviders: () => ipcRenderer.invoke('settings:listProviders'),
  },

  // ── App ─────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    minimizeWindow: () => ipcRenderer.invoke('app:minimizeWindow'),
    maximizeWindow: () => ipcRenderer.invoke('app:maximizeWindow'),
    closeWindow: () => ipcRenderer.invoke('app:closeWindow'),
    toggleFullscreen: () => ipcRenderer.invoke('app:toggleFullscreen'),
    isFullscreen: () => ipcRenderer.invoke('app:isFullscreen'),
    sendNotification: (title: string, body: string) => ipcRenderer.invoke('app:sendNotification', title, body),
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer process
export type ElectronAPI = typeof electronAPI

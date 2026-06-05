import type {
  Subject, Topic, TopicTreeNode, Material, StudySession, SessionStats,
  FeynmanAttempt, FirstPrinciplesStep, SocraticTurn, AIInteraction,
  Flashcard, FlashcardStats, Achievement, Course, StudyGoal
} from './database'

export interface ElectronAPI {
  ai: {
    streamChat: (params: any) => Promise<{ streamId: string }>
    complete: (params: any) => Promise<{ content: string; usage: any }>
    cancelStream: (streamId: string) => Promise<void>
    listModels: (provider: string) => Promise<any[]>
    testConnection: (provider: string, apiKey: string, baseUrl?: string) => Promise<{ success: boolean; error?: string }>
    onStreamChunk: (callback: (data: { streamId: string; delta: string }) => void) => () => void
    onStreamDone: (callback: (data: { streamId: string; usage?: any; finishReason?: string }) => void) => () => void
    onStreamError: (callback: (data: { streamId: string; error: string }) => void) => () => void
  }
  files: {
    importFile: (topicId?: string) => Promise<{ canceled: boolean; result?: any }>
    parseFile: (filePath: string) => Promise<any>
    readMaterial: (materialId: string) => Promise<any>
    deleteFile: (materialId: string) => Promise<void>
    getDataPath: () => Promise<string>
    export: {
      markdown: (data: any) => Promise<{ canceled: boolean; filePath?: string }>
      anki: (data: any) => Promise<{ canceled: boolean; filePath?: string }>
      sessionLog: (sessionId: string) => Promise<{ canceled: boolean; filePath?: string }>
      allData: () => Promise<{ canceled: boolean; filePath?: string }>
    }
  }
  db: {
    subjects: {
      list: () => Promise<Subject[]>
      get: (id: string) => Promise<Subject | null>
      create: (data: Partial<Subject>) => Promise<Subject>
      update: (id: string, data: Partial<Subject>) => Promise<Subject>
      delete: (id: string) => Promise<void>
    }
    topics: {
      listBySubject: (subjectId: string) => Promise<Topic[]>
      get: (id: string) => Promise<Topic | null>
      getTree: (subjectId: string) => Promise<TopicTreeNode[]>
      create: (data: Partial<Topic>) => Promise<Topic>
      update: (id: string, data: Partial<Topic>) => Promise<Topic>
      delete: (id: string) => Promise<void>
      reorder: (subjectId: string, orderedIds: string[]) => Promise<void>
    }
    materials: {
      listByTopic: (topicId: string) => Promise<Material[]>
      get: (id: string) => Promise<Material | null>
      search: (query: string) => Promise<Material[]>
      update: (id: string, data: Partial<Material>) => Promise<Material>
      delete: (id: string) => Promise<void>
    }
    sessions: {
      list: (filters?: any) => Promise<StudySession[]>
      get: (id: string) => Promise<StudySession | null>
      getActive: () => Promise<StudySession | null>
      create: (data: Partial<StudySession>) => Promise<StudySession>
      update: (id: string, data: Partial<StudySession>) => Promise<StudySession>
      getStats: () => Promise<SessionStats>
    }
    chatMessages: {
      listBySession: (sessionId: string) => Promise<any[]>
      create: (data: { sessionId: string; role: string; content: string; metadata?: string }) => Promise<any>
      deleteBySession: (sessionId: string) => Promise<void>
    }
    feynman: {
      list: (sessionId: string) => Promise<FeynmanAttempt[]>
      create: (data: Partial<FeynmanAttempt>) => Promise<FeynmanAttempt>
    }
    firstPrinciples: {
      list: (sessionId: string) => Promise<FirstPrinciplesStep[]>
      create: (data: Partial<FirstPrinciplesStep>) => Promise<FirstPrinciplesStep>
      update: (id: string, data: Partial<FirstPrinciplesStep>) => Promise<FirstPrinciplesStep>
    }
    socratic: {
      list: (sessionId: string) => Promise<SocraticTurn[]>
      create: (data: Partial<SocraticTurn>) => Promise<SocraticTurn>
      update: (id: string, data: Partial<SocraticTurn>) => Promise<SocraticTurn>
    }
    aiInteractions: {
      list: (sessionId?: string) => Promise<AIInteraction[]>
      getStats: () => Promise<any>
    }
    flashcards: {
      listDue: (topicId?: string, examUrgency?: boolean) => Promise<Flashcard[]>
      listByTopic: (topicId: string) => Promise<Flashcard[]>
      create: (data: Partial<Flashcard>) => Promise<Flashcard>
      review: (id: string, rating: string) => Promise<Flashcard | null>
      generate: (data: { sessionContent: string; topicId?: string; topicName?: string; materialExcerpt?: string }) => Promise<Flashcard[]>
      getStats: (topicId?: string) => Promise<FlashcardStats>
    }
    achievements: {
      list: () => Promise<Achievement[]>
      check: () => Promise<Achievement[]>
    }
    courses: {
      list: () => Promise<Course[]>
      get: (id: string) => Promise<Course | null>
      listBySubject: (subjectId: string) => Promise<Course[]>
      create: (data: Partial<Course>) => Promise<Course>
      update: (id: string, data: Partial<Course>) => Promise<Course>
      delete: (id: string) => Promise<void>
      getExamCountdown: () => Promise<any[]>
    }
    studyGoals: {
      listByCourse: (courseId: string) => Promise<StudyGoal[]>
      create: (data: Partial<StudyGoal>) => Promise<StudyGoal>
      toggle: (id: string) => Promise<StudyGoal | null>
      delete: (id: string) => Promise<void>
    }
    analytics: {
      comprehensionHeatmap: () => Promise<any[]>
      learningStreak: () => Promise<{ streak: number; recentDates: string[] }>
      timeDistribution: () => Promise<{ byMode: any[]; recent: any[] }>
      feynmanScoreTrend: () => Promise<any[]>
      masteryOverview: () => Promise<any>
      weeklyReport: () => Promise<any>
    }
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    getAll: () => Promise<Record<string, string>>
    setCredentials: (provider: string, credentials: any) => Promise<void>
    getCredentials: (provider: string) => Promise<any | null>
    deleteCredentials: (provider: string) => Promise<void>
    listProviders: () => Promise<string[]>
  }
  app: {
    getVersion: () => Promise<string>
    getPlatform: () => Promise<string>
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

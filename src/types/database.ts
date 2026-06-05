export interface Subject {
  id: string
  name: string
  description: string
  color: string
  icon: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  subject_id: string
  parent_topic_id: string | null
  name: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TopicTreeNode extends Topic {
  children?: TopicTreeNode[]
}

export type SourceType = 'pdf' | 'docx' | 'md' | 'txt' | 'manual'

export interface Material {
  id: string
  topic_id: string | null
  title: string
  source_type: SourceType
  file_path: string | null
  file_name: string | null
  file_size_bytes: number | null
  content_text: string
  content_html: string | null
  word_count: number | null
  parsed_at: string | null
  created_at: string
  updated_at: string
}

export type SessionMode = 'feynman' | 'first_principles' | 'socratic'
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export interface StudySession {
  id: string
  title: string
  mode: SessionMode
  subject_id: string | null
  topic_id: string | null
  material_id: string | null
  status: SessionStatus
  started_at: string
  ended_at: string | null
  duration_seconds: number
  overall_notes: string
  ai_model_provider: string | null
  ai_model_name: string | null
  created_at: string
  updated_at: string
}

export interface FeynmanAttempt {
  id: string
  session_id: string
  concept: string
  student_explanation: string
  ai_feedback: string
  understanding_score: number | null
  gaps_identified: string | null
  jargon_issues: string | null
  attempt_number: number
  created_at: string
}

export interface FirstPrinciplesStep {
  id: string
  session_id: string
  step_order: number
  concept_name: string
  fundamental_truth: string | null
  ai_guidance: string | null
  student_response: string | null
  is_leaf: number
  created_at: string
}

export type QuestionType = 'clarification' | 'assumption' | 'evidence' | 'implication' | 'viewpoint' | 'consequence' | 'origin'

export interface SocraticTurn {
  id: string
  session_id: string
  turn_number: number
  ai_question: string
  student_answer: string | null
  question_type: QuestionType | null
  student_reflection: string | null
  created_at: string
}

export interface AIInteraction {
  id: string
  session_id: string | null
  model_provider: string
  model_name: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  latency_ms: number | null
  cost_estimate_usd: number
  truncated: number
  created_at: string
}

export interface SessionStats {
  totalSessions: number
  totalSeconds: number
  byMode: Array<{ mode: string; count: number }>
  recent: StudySession[]
}

// ── Spaced Repetition (Barrier 1) ─────────────────────────

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: string
  material_id: string | null
  feynman_attempt_id: string | null
  socratic_turn_id: string | null
  topic_id: string | null
  front: string
  back: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_review_at: string | null
  last_rating: ReviewRating | null
  created_at: string
}

export interface FlashcardStats {
  totalCards: number
  dueCards: number
  masteredCards: number
  reviewedToday: number
}

// ── Achievements (Barrier 3 微反馈系统) ────────────────────

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  unlocked_at: string | null
  progress: number
  created_at: string
}

// ── Courses (Barrier 5) ────────────────────────────────────

export interface Course {
  id: string
  subject_id: string
  name: string
  instructor: string
  semester: string
  schedule: string  // JSON array
  exam_date: string | null
  credits: number
  created_at: string
  updated_at: string
}

export interface StudyGoal {
  id: string
  course_id: string
  topic_id: string | null
  title: string
  target_date: string
  completed: number
  created_at: string
}

export interface SessionSummaryData {
  durationMinutes: number
  understandingScore: number | null
  gapsCount: number
  jargonIssues: number
  streakDays: number
  cardsGenerated: number
  fundamentalTruths?: number
}

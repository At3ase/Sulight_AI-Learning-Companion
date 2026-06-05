import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDatabase } from '../services/database/connection'

export function registerDatabaseHandlers(): void {
  const db = getDatabase

  // ── Subjects ─────────────────────────────────────────
  ipcMain.handle('db:subjects:list', () => {
    return db().prepare('SELECT * FROM subjects ORDER BY sort_order, name').all()
  })

  ipcMain.handle('db:subjects:get', (_e, id: string) => {
    return db().prepare('SELECT * FROM subjects WHERE id = ?').get(id)
  })

  ipcMain.handle('db:subjects:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO subjects (id, name, description, color, icon, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || '', data.color || '#6366f1', data.icon || 'book-open', data.sort_order || 0)
    return db().prepare('SELECT * FROM subjects WHERE id = ?').get(id)
  })

  ipcMain.handle('db:subjects:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['name', 'description', 'color', 'icon', 'sort_order'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (sets.length === 0) return null
    sets.push("updated_at = datetime('now')")
    values.push(id)
    db().prepare(`UPDATE subjects SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM subjects WHERE id = ?').get(id)
  })

  ipcMain.handle('db:subjects:delete', (_e, id: string) => {
    db().prepare('DELETE FROM subjects WHERE id = ?').run(id)
  })

  // ── Topics ───────────────────────────────────────────
  ipcMain.handle('db:topics:listBySubject', (_e, subjectId: string) => {
    return db().prepare(
      'SELECT * FROM topics WHERE subject_id = ? ORDER BY sort_order, name'
    ).all(subjectId)
  })

  ipcMain.handle('db:topics:get', (_e, id: string) => {
    return db().prepare('SELECT * FROM topics WHERE id = ?').get(id)
  })

  ipcMain.handle('db:topics:getTree', (_e, subjectId: string) => {
    return db().prepare(
      'SELECT * FROM topics WHERE subject_id = ? ORDER BY sort_order, name'
    ).all(subjectId)
  })

  ipcMain.handle('db:topics:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO topics (id, subject_id, parent_topic_id, name, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.subject_id, data.parent_topic_id || null, data.name, data.description || '', data.sort_order || 0)
    return db().prepare('SELECT * FROM topics WHERE id = ?').get(id)
  })

  ipcMain.handle('db:topics:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['name', 'description', 'parent_topic_id', 'sort_order'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (sets.length === 0) return null
    sets.push("updated_at = datetime('now')")
    values.push(id)
    db().prepare(`UPDATE topics SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM topics WHERE id = ?').get(id)
  })

  ipcMain.handle('db:topics:delete', (_e, id: string) => {
    db().prepare('DELETE FROM topics WHERE id = ?').run(id)
  })

  ipcMain.handle('db:topics:reorder', (_e, subjectId: string, orderedIds: string[]) => {
    const stmt = db().prepare('UPDATE topics SET sort_order = ? WHERE id = ? AND subject_id = ?')
    const tx = db().transaction((ids: string[]) => {
      ids.forEach((id, index) => stmt.run(index, id, subjectId))
    })
    tx(orderedIds)
  })

  // ── Materials ────────────────────────────────────────
  ipcMain.handle('db:materials:listByTopic', (_e, topicId: string) => {
    return db().prepare(
      'SELECT * FROM materials WHERE topic_id = ? ORDER BY created_at DESC'
    ).all(topicId)
  })

  ipcMain.handle('db:materials:get', (_e, id: string) => {
    return db().prepare('SELECT * FROM materials WHERE id = ?').get(id)
  })

  ipcMain.handle('db:materials:search', (_e, query: string) => {
    return db().prepare(
      'SELECT * FROM materials WHERE title LIKE ? OR content_text LIKE ? LIMIT 50'
    ).all(`%${query}%`, `%${query}%`)
  })

  ipcMain.handle('db:materials:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['title', 'topic_id'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (sets.length === 0) return null
    sets.push("updated_at = datetime('now')")
    values.push(id)
    db().prepare(`UPDATE materials SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM materials WHERE id = ?').get(id)
  })

  ipcMain.handle('db:materials:delete', (_e, id: string) => {
    db().prepare('DELETE FROM materials WHERE id = ?').run(id)
  })

  // ── Sessions ─────────────────────────────────────────
  ipcMain.handle('db:sessions:list', (_e, filters?: any) => {
    let query = 'SELECT * FROM study_sessions WHERE 1=1'
    const params: any[] = []
    if (filters?.mode) { query += ' AND mode = ?'; params.push(filters.mode) }
    if (filters?.subject_id) { query += ' AND subject_id = ?'; params.push(filters.subject_id) }
    if (filters?.status) { query += ' AND status = ?'; params.push(filters.status) }
    query += ' ORDER BY created_at DESC LIMIT 100'
    return db().prepare(query).all(...params)
  })

  ipcMain.handle('db:sessions:get', (_e, id: string) => {
    return db().prepare('SELECT * FROM study_sessions WHERE id = ?').get(id)
  })

  ipcMain.handle('db:sessions:getActive', () => {
    return db().prepare(
      "SELECT * FROM study_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1"
    ).get()
  })

  ipcMain.handle('db:sessions:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO study_sessions (id, title, mode, subject_id, topic_id, material_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.title, data.mode, data.subject_id || null, data.topic_id || null, data.material_id || null, 'active')
    return db().prepare('SELECT * FROM study_sessions WHERE id = ?').get(id)
  })

  ipcMain.handle('db:sessions:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['title', 'status', 'ended_at', 'duration_seconds', 'overall_notes', 'ai_model_provider', 'ai_model_name'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value ?? null)
      }
    }
    if (sets.length === 0) return null
    sets.push("updated_at = datetime('now')")
    values.push(id)
    db().prepare(`UPDATE study_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM study_sessions WHERE id = ?').get(id)
  })

  ipcMain.handle('db:sessions:getStats', () => {
    const total = db().prepare("SELECT COUNT(*) as count, COALESCE(SUM(duration_seconds), 0) as total_sec FROM study_sessions WHERE status = 'completed'").get() as any
    const byMode = db().prepare("SELECT mode, COUNT(*) as count FROM study_sessions GROUP BY mode").all() as any[]
    const recent = db().prepare("SELECT * FROM study_sessions ORDER BY created_at DESC LIMIT 5").all() as any[]
    return { totalSessions: total.count, totalSeconds: total.total_sec, byMode, recent }
  })

  // ── Feynman ──────────────────────────────────────────
  ipcMain.handle('db:feynman:list', (_e, sessionId: string) => {
    return db().prepare('SELECT * FROM feynman_attempts WHERE session_id = ? ORDER BY attempt_number').all(sessionId)
  })

  ipcMain.handle('db:feynman:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO feynman_attempts (id, session_id, concept, student_explanation, ai_feedback, understanding_score, gaps_identified, jargon_issues, attempt_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.session_id, data.concept, data.student_explanation, data.ai_feedback, data.understanding_score, data.gaps_identified || null, data.jargon_issues || null, data.attempt_number || 1)
    return db().prepare('SELECT * FROM feynman_attempts WHERE id = ?').get(id)
  })

  // ── First Principles ─────────────────────────────────
  ipcMain.handle('db:firstPrinciples:list', (_e, sessionId: string) => {
    return db().prepare('SELECT * FROM first_principles_steps WHERE session_id = ? ORDER BY step_order').all(sessionId)
  })

  ipcMain.handle('db:firstPrinciples:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO first_principles_steps (id, session_id, step_order, concept_name, fundamental_truth, ai_guidance, student_response, is_leaf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.session_id, data.step_order, data.concept_name, data.fundamental_truth || null, data.ai_guidance || null, data.student_response || null, data.is_leaf || 0)
    return db().prepare('SELECT * FROM first_principles_steps WHERE id = ?').get(id)
  })

  ipcMain.handle('db:firstPrinciples:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['concept_name', 'fundamental_truth', 'ai_guidance', 'student_response', 'is_leaf'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (sets.length === 0) return null
    values.push(id)
    db().prepare(`UPDATE first_principles_steps SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM first_principles_steps WHERE id = ?').get(id)
  })

  // ── Socratic ─────────────────────────────────────────
  ipcMain.handle('db:socratic:list', (_e, sessionId: string) => {
    return db().prepare('SELECT * FROM socratic_turns WHERE session_id = ? ORDER BY turn_number').all(sessionId)
  })

  ipcMain.handle('db:socratic:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO socratic_turns (id, session_id, turn_number, ai_question, student_answer, question_type, student_reflection)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.session_id, data.turn_number, data.ai_question, data.student_answer || null, data.question_type || null, data.student_reflection || null)
    return db().prepare('SELECT * FROM socratic_turns WHERE id = ?').get(id)
  })

  ipcMain.handle('db:socratic:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['student_answer', 'student_reflection'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (sets.length === 0) return null
    values.push(id)
    db().prepare(`UPDATE socratic_turns SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM socratic_turns WHERE id = ?').get(id)
  })

  // ── Flashcards (Barrier 1: Spaced Repetition) ────────
  ipcMain.handle('db:flashcards:listDue', (_e, topicId?: string, examUrgency?: boolean) => {
    let query = "SELECT * FROM flashcards WHERE next_review_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    const params: any[] = []
    if (topicId) { query += ' AND topic_id = ?'; params.push(topicId) }
    query += ' ORDER BY next_review_at ASC LIMIT 200'
    return db().prepare(query).all(...params)
  })

  ipcMain.handle('db:flashcards:listByTopic', (_e, topicId: string) => {
    return db().prepare(
      'SELECT * FROM flashcards WHERE topic_id = ? ORDER BY created_at DESC'
    ).all(topicId)
  })

  ipcMain.handle('db:flashcards:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO flashcards (id, material_id, feynman_attempt_id, socratic_turn_id, topic_id, front, back, next_review_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.material_id || null,
      data.feynman_attempt_id || null,
      data.socratic_turn_id || null,
      data.topic_id || null,
      data.front,
      data.back,
      new Date().toISOString()
    )
    return db().prepare('SELECT * FROM flashcards WHERE id = ?').get(id)
  })

  ipcMain.handle('db:flashcards:review', (_e, id: string, rating: string) => {
    // SM-2 scheduler is applied in the main process
    const { applySM2, todayUTC } = require('../services/review/scheduler')
    const card = db().prepare('SELECT * FROM flashcards WHERE id = ?').get(id) as any
    if (!card) return null

    const result = applySM2(card, rating)
    db().prepare(`
      UPDATE flashcards SET
        ease_factor = ?, interval_days = ?, repetitions = ?,
        next_review_at = ?, last_review_at = ?, last_rating = ?
      WHERE id = ?
    `).run(
      result.ease_factor, result.interval_days, result.repetitions,
      result.next_review_at, result.last_review_at, result.last_rating,
      id
    )
    return db().prepare('SELECT * FROM flashcards WHERE id = ?').get(id)
  })

  ipcMain.handle('db:flashcards:generate', async (_e, data: { sessionContent: string; topicId?: string; topicName?: string; materialExcerpt?: string }) => {
    const { getProvider } = require('../services/ai/providers')
    const { getCredentials } = require('../services/credential-store')
    const { buildGenerationPrompt, parseGeneratedCards } = require('../services/review/card-generator')

    // Use the active provider for card generation
    const activeProvider = db().prepare("SELECT value FROM app_settings WHERE key = 'active_provider'").get() as any
    const providerName = activeProvider?.value || 'claude'
    const credentials = getCredentials(providerName)
    if (!credentials) {
      throw new Error(`No credentials configured for provider: ${providerName}`)
    }

    const provider = getProvider(providerName)
    const prompt = buildGenerationPrompt({
      sessionContent: data.sessionContent,
      topicName: data.topicName,
      materialExcerpt: data.materialExcerpt,
    })

    const result = await provider.complete(
      [{ role: 'user', content: prompt }],
      {
        model: credentials.model || (providerName === 'claude' ? 'claude-sonnet-4-6' : providerName === 'openai' ? 'gpt-4o' : ''),
        apiKey: credentials.apiKey,
        baseUrl: credentials.baseUrl,
        maxTokens: 1000,
        temperature: 0.3,
      }
    )

    const pairs = parseGeneratedCards(result.content)
    const createdCards: any[] = []
    for (const pair of pairs) {
      const id = randomUUID()
      db().prepare(`
        INSERT INTO flashcards (id, topic_id, front, back, next_review_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.topicId || null, pair.front, pair.back, new Date().toISOString())
      createdCards.push(db().prepare('SELECT * FROM flashcards WHERE id = ?').get(id))
    }
    return createdCards
  })

  ipcMain.handle('db:flashcards:getStats', (_e, topicId?: string) => {
    const now = new Date().toISOString()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    let totalQuery = 'SELECT COUNT(*) as count FROM flashcards'
    let dueQuery = "SELECT COUNT(*) as count FROM flashcards WHERE next_review_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    let masteredQuery = 'SELECT COUNT(*) as count FROM flashcards WHERE repetitions >= 5 AND ease_factor >= 2.5'
    let todayQuery = "SELECT COUNT(*) as count FROM flashcards WHERE last_review_at >= strftime('%Y-%m-%dT00:00:00.000Z', 'now', 'start of day')"
    const params: any[] = []

    if (topicId) {
      const where = ' WHERE topic_id = ?'
      totalQuery += where; dueQuery += ' AND topic_id = ?'; masteredQuery += ' AND topic_id = ?'; todayQuery += ' AND topic_id = ?'
      params.push(topicId)
    }

    const total = (db().prepare(totalQuery).get(...params) as any)?.count || 0
    const due = (db().prepare(dueQuery).get(...params) as any)?.count || 0
    const mastered = (db().prepare(masteredQuery).get(...params) as any)?.count || 0
    const reviewedToday = (db().prepare(todayQuery).get(...params) as any)?.count || 0
    return { totalCards: total, dueCards: due, masteredCards: mastered, reviewedToday }
  })

  // ── Achievements (Barrier 3: 微反馈系统) ────────────────
  ipcMain.handle('db:achievements:list', () => {
    return db().prepare('SELECT * FROM achievements ORDER BY unlocked_at DESC NULLS LAST, created_at').all()
  })

  ipcMain.handle('db:achievements:check', async () => {
    // Check and update all achievement progress
    const achievements = db().prepare('SELECT * FROM achievements').all() as any[]
    const updates: any[] = []

    for (const a of achievements) {
      let progress = a.progress
      let unlocked = a.unlocked_at !== null

      if (!unlocked) {
        switch (a.key) {
          case 'first_feynman': {
            const count = (db().prepare('SELECT COUNT(*) as c FROM feynman_attempts').get() as any)?.c || 0
            progress = Math.min(count / 1, 1)
            unlocked = count >= 1
            break
          }
          case 'first_principles_master': {
            const count = (db().prepare("SELECT COUNT(*) as c FROM first_principles_steps WHERE is_leaf = 1").get() as any)?.c || 0
            progress = Math.min(count / 10, 1)
            unlocked = count >= 10
            break
          }
          case 'socratic_thinker': {
            const count = (db().prepare('SELECT COUNT(*) as c FROM socratic_turns').get() as any)?.c || 0
            progress = Math.min(count / 50, 1)
            unlocked = count >= 50
            break
          }
          case 'streak_7': {
            // Count consecutive days with completed sessions
            const sessions = db().prepare(
              "SELECT DISTINCT date(started_at) as d FROM study_sessions WHERE status = 'completed' ORDER BY d DESC LIMIT 30"
            ).all() as any[]
            let streak = 0
            const today = new Date()
            for (let i = 0; i < 30; i++) {
              const d = new Date(today)
              d.setDate(d.getDate() - i)
              const dateStr = d.toISOString().split('T')[0]
              if (sessions.some((s: any) => s.d === dateStr)) {
                streak++
              } else if (i > 0) {
                break
              }
            }
            progress = Math.min(streak / 7, 1)
            unlocked = streak >= 7
            break
          }
          case 'hundred_hours': {
            const total = (db().prepare("SELECT COALESCE(SUM(duration_seconds), 0) as t FROM study_sessions WHERE status = 'completed'").get() as any)?.t || 0
            progress = Math.min(total / 360000, 1)
            unlocked = total >= 360000
            break
          }
        }

        if (unlocked) {
          db().prepare("UPDATE achievements SET progress = 1.0, unlocked_at = datetime('now') WHERE id = ?").run(a.id)
          updates.push({ ...a, progress: 1.0, unlocked_at: new Date().toISOString() })
        } else if (progress !== a.progress) {
          db().prepare('UPDATE achievements SET progress = ? WHERE id = ?').run(progress, a.id)
          updates.push({ ...a, progress, unlocked_at: null })
        }
      }
    }

    return db().prepare('SELECT * FROM achievements ORDER BY unlocked_at DESC NULLS LAST, created_at').all()
  })

  // Seed default achievements if table is empty
  ipcMain.handle('db:achievements:seedDefaults', () => {
    const existing = (db().prepare('SELECT COUNT(*) as c FROM achievements').get() as any)?.c || 0
    if (existing > 0) return

    const defaults = [
      { key: 'first_feynman', title: '初出茅庐', description: '完成首次费曼学习会话', icon: '🥉' },
      { key: 'first_principles_master', title: '解构大师', description: '用第一性原理拆解10个基本真理', icon: '🥈' },
      { key: 'socratic_thinker', title: '思辨者', description: '完成50轮苏格拉底对话', icon: '🥇' },
      { key: 'streak_7', title: '一周之星', description: '连续学习7天', icon: '🔥' },
      { key: 'hundred_hours', title: '百日学者', description: '累计学习100小时', icon: '💎' },
    ]
    for (const d of defaults) {
      db().prepare(`
        INSERT INTO achievements (id, key, title, description, icon)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), d.key, d.title, d.description, d.icon)
    }
  })

  // ── AI Interactions ──────────────────────────────────
  ipcMain.handle('db:aiInteractions:list', (_e, sessionId?: string) => {
    if (sessionId) {
      return db().prepare('SELECT * FROM ai_interactions WHERE session_id = ? ORDER BY created_at DESC LIMIT 100').all(sessionId)
    }
    return db().prepare('SELECT * FROM ai_interactions ORDER BY created_at DESC LIMIT 100').all()
  })

  ipcMain.handle('db:aiInteractions:getStats', () => {
    const totals = db().prepare("SELECT COALESCE(SUM(total_tokens), 0) as total_tokens, COALESCE(SUM(cost_estimate_usd), 0) as total_cost, COUNT(*) as total_calls FROM ai_interactions").get() as any
    const byProvider = db().prepare("SELECT model_provider, COUNT(*) as count, COALESCE(SUM(total_tokens), 0) as tokens FROM ai_interactions GROUP BY model_provider").all() as any[]
    return { ...totals, byProvider }
  })

  // ── Courses (Barrier 5: 大学生场景深度优化) ─────────────
  ipcMain.handle('db:courses:list', () => {
    return db().prepare('SELECT * FROM courses ORDER BY semester DESC, name').all()
  })

  ipcMain.handle('db:courses:get', (_e, id: string) => {
    return db().prepare('SELECT * FROM courses WHERE id = ?').get(id)
  })

  ipcMain.handle('db:courses:listBySubject', (_e, subjectId: string) => {
    return db().prepare('SELECT * FROM courses WHERE subject_id = ? ORDER BY semester DESC, name').all(subjectId)
  })

  ipcMain.handle('db:courses:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO courses (id, subject_id, name, instructor, semester, schedule, exam_date, credits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.subject_id, data.name, data.instructor || '', data.semester || '', data.schedule || '[]', data.exam_date || null, data.credits || 0)
    return db().prepare('SELECT * FROM courses WHERE id = ?').get(id)
  })

  ipcMain.handle('db:courses:update', (_e, id: string, data: any) => {
    const sets: string[] = []
    const values: any[] = []
    for (const [key, value] of Object.entries(data)) {
      if (['subject_id', 'name', 'instructor', 'semester', 'schedule', 'exam_date', 'credits'].includes(key)) {
        sets.push(`${key} = ?`)
        values.push(value ?? null)
      }
    }
    if (sets.length === 0) return null
    sets.push("updated_at = datetime('now')")
    values.push(id)
    db().prepare(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    return db().prepare('SELECT * FROM courses WHERE id = ?').get(id)
  })

  ipcMain.handle('db:courses:delete', (_e, id: string) => {
    db().prepare('DELETE FROM courses WHERE id = ?').run(id)
  })

  ipcMain.handle('db:courses:getExamCountdown', () => {
    const now = new Date().toISOString()
    const courses = db().prepare(
      "SELECT *, CAST(julianday(exam_date) - julianday('now') AS INTEGER) as days_until_exam FROM courses WHERE exam_date IS NOT NULL AND exam_date >= date('now') ORDER BY exam_date ASC"
    ).all() as any[]
    return courses.map((c: any) => ({
      ...c,
      urgency: c.days_until_exam <= 3 ? 'critical' : c.days_until_exam <= 7 ? 'high' : c.days_until_exam <= 14 ? 'medium' : 'low',
    }))
  })

  // ── Study Goals ────────────────────────────────────────
  ipcMain.handle('db:studyGoals:listByCourse', (_e, courseId: string) => {
    return db().prepare('SELECT * FROM study_goals WHERE course_id = ? ORDER BY target_date, created_at').all(courseId)
  })

  ipcMain.handle('db:studyGoals:create', (_e, data: any) => {
    const id = randomUUID()
    db().prepare(`
      INSERT INTO study_goals (id, course_id, topic_id, title, target_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.course_id, data.topic_id || null, data.title, data.target_date)
    return db().prepare('SELECT * FROM study_goals WHERE id = ?').get(id)
  })

  ipcMain.handle('db:studyGoals:toggle', (_e, id: string) => {
    const goal = db().prepare('SELECT * FROM study_goals WHERE id = ?').get(id) as any
    if (!goal) return null
    const newCompleted = goal.completed ? 0 : 1
    db().prepare('UPDATE study_goals SET completed = ? WHERE id = ?').run(newCompleted, id)
    return db().prepare('SELECT * FROM study_goals WHERE id = ?').get(id)
  })

  ipcMain.handle('db:studyGoals:delete', (_e, id: string) => {
    db().prepare('DELETE FROM study_goals WHERE id = ?').run(id)
  })

  // ── Analytics Queries ──────────────────────────────────
  ipcMain.handle('db:analytics:comprehensionHeatmap', () => {
    // Return comprehension scores grouped by date for the last 90 days
    const rows = db().prepare(`
      SELECT date(created_at) as day, AVG(understanding_score) as avg_score, COUNT(*) as attempts
      FROM feynman_attempts
      WHERE understanding_score IS NOT NULL AND created_at >= date('now', '-90 days')
      GROUP BY date(created_at)
      ORDER BY day
    `).all() as any[]
    return rows
  })

  ipcMain.handle('db:analytics:learningStreak', () => {
    const sessions = db().prepare(
      "SELECT DISTINCT date(started_at) as d FROM study_sessions WHERE status = 'completed' ORDER BY d DESC LIMIT 30"
    ).all() as any[]
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (sessions.some((s: any) => s.d === dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return { streak, recentDates: sessions.map((s: any) => s.d) }
  })

  ipcMain.handle('db:analytics:timeDistribution', () => {
    const byMode = db().prepare(
      "SELECT mode, SUM(duration_seconds) as total_sec FROM study_sessions WHERE status = 'completed' GROUP BY mode"
    ).all() as any[]
    const recent = db().prepare(
      "SELECT date(started_at) as day, SUM(duration_seconds) as minutes FROM study_sessions WHERE status = 'completed' AND started_at >= date('now', '-30 days') GROUP BY date(started_at) ORDER BY day"
    ).all() as any[]
    return { byMode, recent }
  })

  ipcMain.handle('db:analytics:feynmanScoreTrend', () => {
    return db().prepare(`
      SELECT session_id, date(created_at) as day, understanding_score, attempt_number
      FROM feynman_attempts
      WHERE understanding_score IS NOT NULL
      ORDER BY created_at ASC
      LIMIT 200
    `).all() as any[]
  })

  ipcMain.handle('db:analytics:masteryOverview', () => {
    const totalCards = (db().prepare('SELECT COUNT(*) as c FROM flashcards').get() as any)?.c || 0
    const masteredCards = (db().prepare('SELECT COUNT(*) as c FROM flashcards WHERE repetitions >= 5 AND ease_factor >= 2.5').get() as any)?.c || 0
    const dueCards = (db().prepare("SELECT COUNT(*) as c FROM flashcards WHERE next_review_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").get() as any)?.c || 0
    const totalSessions = (db().prepare("SELECT COUNT(*) as c FROM study_sessions WHERE status = 'completed'").get() as any)?.c || 0
    const totalTime = (db().prepare("SELECT COALESCE(SUM(duration_seconds), 0) as t FROM study_sessions WHERE status = 'completed'").get() as any)?.t || 0
    return {
      totalCards, masteredCards, dueCards,
      totalSessions, totalTime,
      masteryRate: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
    }
  })

  // ── Subject Progress ─────────────────────────────────
  ipcMain.handle('db:analytics:subjectProgress', () => {
    const subjects = db().prepare('SELECT * FROM subjects ORDER BY sort_order, name').all() as any[]

    return subjects.map((s: any) => {
      // Topic stats: total topics and topics with any study session
      const totalTopics = (db().prepare(
        'SELECT COUNT(*) as c FROM topics WHERE subject_id = ?'
      ).get(s.id) as any)?.c || 0
      const studiedTopics = (db().prepare(
        `SELECT COUNT(DISTINCT t.id) as c FROM topics t
         INNER JOIN study_sessions ss ON ss.topic_id = t.id
         WHERE t.subject_id = ? AND ss.status = 'completed'`
      ).get(s.id) as any)?.c || 0

      // Study goals stats
      const totalGoals = (db().prepare(
        `SELECT COUNT(*) as c FROM study_goals sg
         INNER JOIN courses c ON c.id = sg.course_id
         WHERE c.subject_id = ?`
      ).get(s.id) as any)?.c || 0
      const completedGoals = (db().prepare(
        `SELECT COUNT(*) as c FROM study_goals sg
         INNER JOIN courses c ON c.id = sg.course_id
         WHERE c.subject_id = ? AND sg.completed = 1`
      ).get(s.id) as any)?.c || 0

      // Total study minutes for this subject
      const totalMinutes = Math.round(((db().prepare(
        `SELECT COALESCE(SUM(ss.duration_seconds), 0) as t FROM study_sessions ss
         INNER JOIN topics t ON t.id = ss.topic_id
         WHERE t.subject_id = ? AND ss.status = 'completed'`
      ).get(s.id) as any)?.t || 0) / 60)

      // Card stats
      const totalCards = (db().prepare(
        `SELECT COUNT(*) as c FROM flashcards f
         INNER JOIN topics t ON t.id = f.topic_id
         WHERE t.subject_id = ?`
      ).get(s.id) as any)?.c || 0
      const masteredCards = (db().prepare(
        `SELECT COUNT(*) as c FROM flashcards f
         INNER JOIN topics t ON t.id = f.topic_id
         WHERE t.subject_id = ? AND f.repetitions >= 5 AND f.ease_factor >= 2.5`
      ).get(s.id) as any)?.c || 0

      // Upcoming exam
      const upcomingExam = db().prepare(
        `SELECT name, exam_date,
         CAST(julianday(exam_date) - julianday('now') AS INTEGER) as days_until_exam
         FROM courses WHERE subject_id = ? AND exam_date IS NOT NULL AND exam_date >= date('now')
         ORDER BY exam_date ASC LIMIT 1`
      ).get(s.id) as any

      return {
        subjectId: s.id,
        subjectName: s.name,
        subjectColor: s.color,
        totalTopics,
        studiedTopics,
        topicProgress: totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0,
        totalGoals,
        completedGoals,
        goalProgress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        totalMinutes,
        totalCards,
        masteredCards,
        cardProgress: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
        upcomingExam: upcomingExam ? {
          name: upcomingExam.name,
          examDate: upcomingExam.exam_date,
          daysUntil: upcomingExam.days_until_exam,
        } : null,
      }
    })
  })

  // ── Weekly Report ─────────────────────────────────────
  ipcMain.handle('db:analytics:weeklyReport', () => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const weekStartStr = weekStart.toISOString()

    const sessionCount = (db().prepare(
      "SELECT COUNT(*) as c FROM study_sessions WHERE status = 'completed' AND ended_at >= ?"
    ).get(weekStartStr) as any)?.c || 0

    const totalMinutes = (db().prepare(
      "SELECT COALESCE(SUM(duration_seconds), 0) as t FROM study_sessions WHERE status = 'completed' AND ended_at >= ?"
    ).get(weekStartStr) as any)?.t || 0

    const newCards = (db().prepare(
      'SELECT COUNT(*) as c FROM flashcards WHERE created_at >= ?'
    ).get(weekStartStr) as any)?.c || 0

    const reviewedCards = (db().prepare(
      'SELECT COUNT(*) as c FROM flashcards WHERE last_review_at >= ?'
    ).get(weekStartStr) as any)?.c || 0

    return {
      sessionCount,
      totalMinutes: Math.round(totalMinutes / 60),
      newCards,
      reviewedCards,
      weekStart: weekStartStr,
    }
  })

  // ── Chat Messages (conversation history persistence) ─────
  ipcMain.handle('db:chatMessages:listBySession', (_e, sessionId: string) => {
    return db().prepare(
      'SELECT id, session_id, role, content, message_order, metadata, created_at FROM chat_messages WHERE session_id = ? ORDER BY message_order'
    ).all(sessionId)
  })

  ipcMain.handle('db:chatMessages:create', (_e, data: { sessionId: string; role: string; content: string; metadata?: string }) => {
    const id = randomUUID()
    const order = ((db().prepare(
      'SELECT COALESCE(MAX(message_order), -1) as maxOrder FROM chat_messages WHERE session_id = ?'
    ).get(data.sessionId) as any)?.maxOrder || -1) + 1

    db().prepare(`
      INSERT INTO chat_messages (id, session_id, role, content, message_order, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.sessionId, data.role, data.content, order, data.metadata || null)

    return db().prepare('SELECT * FROM chat_messages WHERE id = ?').get(id)
  })

  ipcMain.handle('db:chatMessages:deleteBySession', (_e, sessionId: string) => {
    db().prepare('DELETE FROM chat_messages WHERE session_id = ?').run(sessionId)
  })
}

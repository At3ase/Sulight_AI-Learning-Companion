import { ipcMain, dialog, BrowserWindow } from 'electron'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { parseFile, saveMaterial, deleteMaterial } from '../services/file-parser'
import { getDatabase } from '../services/database/connection'

export function registerFileHandlers(): void {
  // ── Import File ───────────────────────────────────────
  ipcMain.handle('file:import', async (event, topicId?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { canceled: true }

    const dialogResult = await dialog.showOpenDialog(win, {
      title: '导入学习资料',
      filters: [
        { name: 'Documents', extensions: ['pdf', 'docx', 'md', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = dialogResult.filePaths[0]
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`)
    }

    try {
      const parsed = await parseFile(filePath)
      // Persist to database — this was the missing piece!
      const saved = saveMaterial(parsed, topicId || undefined)
      return { canceled: false, result: saved }
    } catch (err: any) {
      throw new Error(`文件导入失败: ${err?.message ?? String(err)}`)
    }
  })

  // ── Parse File ────────────────────────────────────────
  ipcMain.handle('file:parse', async (_e, filePath: string) => {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    return await parseFile(filePath)
  })

  // ── Read Material ─────────────────────────────────────
  ipcMain.handle('file:readMaterial', async (_e, materialId: string) => {
    const db = getDatabase()
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(materialId)
    if (!material) {
      throw new Error(`Material not found: ${materialId}`)
    }
    return material
  })

  // ── Delete File/Material ──────────────────────────────
  ipcMain.handle('file:deleteFile', async (_e, materialId: string) => {
    deleteMaterial(materialId)
  })

  // ── Get Data Path ─────────────────────────────────────
  ipcMain.handle('file:getDataPath', async () => {
    return join(app.getPath('userData'), 'data')
  })

  // ── Export (Barrier 4: 数据可移植性) ───────────────────
  ipcMain.handle('file:export:markdown', async (event, data: { sessions?: any[]; flashcards?: any[]; topics?: any[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const saveResult = await dialog.showSaveDialog(win, {
      title: '导出为 Markdown',
      defaultPath: `学习笔记_${new Date().toISOString().slice(0, 10)}.md`,
      filters: [{ name: 'Markdown Files', extensions: ['md'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) return { canceled: true }

    const lines: string[] = []
    lines.push('# 学习笔记导出')
    lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`)
    lines.push('')

    // Export topics/knowledge structure
    if (data.topics && data.topics.length > 0) {
      lines.push('## 知识结构')
      lines.push('')
      const bySubject = new Map<string, any[]>()
      for (const t of data.topics) {
        const sid = t.subject_id || '未分类'
        if (!bySubject.has(sid)) bySubject.set(sid, [])
        bySubject.get(sid)!.push(t)
      }
      for (const [subject, topics] of bySubject) {
        lines.push(`### ${subject}`)
        for (const t of topics) {
          lines.push(`- ${t.name}`)
          if (t.description) lines.push(`  ${t.description}`)
        }
        lines.push('')
      }
    }

    // Export study sessions
    if (data.sessions && data.sessions.length > 0) {
      lines.push('## 学习会话记录')
      lines.push('')
      for (const s of data.sessions) {
        const modeLabel = s.mode === 'feynman' ? '费曼技巧' : s.mode === 'first_principles' ? '第一性原理' : '苏格拉底式对话'
        const durationMin = Math.round((s.duration_seconds || 0) / 60)
        lines.push(`### ${s.title} — ${modeLabel}`)
        lines.push(`- 日期：${s.started_at?.slice(0, 10) || '未知'}`)
        lines.push(`- 时长：${durationMin} 分钟`)
        if (s.overall_notes) lines.push(`- 笔记：${s.overall_notes}`)
        lines.push('')
      }
    }

    // Export flashcards
    if (data.flashcards && data.flashcards.length > 0) {
      lines.push('## 复习卡片')
      lines.push('')
      for (const card of data.flashcards) {
        lines.push(`**Q:** ${card.front}`)
        lines.push(`**A:** ${card.back}`)
        if (card.last_rating) lines.push(`- 上次评分：${card.last_rating}`)
        lines.push('')
      }
    }

    const { writeFileSync } = require('fs')
    writeFileSync(saveResult.filePath, lines.join('\n'), 'utf-8')
    return { canceled: false, filePath: saveResult.filePath }
  })

  ipcMain.handle('file:export:anki', async (event, data: { flashcards: any[] }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const saveResult = await dialog.showSaveDialog(win, {
      title: '导出为 Anki CSV',
      defaultPath: `anki_cards_${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) return { canceled: true }

    const lines: string[] = ['front,back,tags']
    for (const card of data.flashcards) {
      const front = card.front.replace(/"/g, '""')
      const back = card.back.replace(/"/g, '""')
      const tags = card.topic_id ? `learning-assistant::${card.topic_id}` : 'learning-assistant'
      lines.push(`"${front}","${back}","${tags}"`)
    }

    const { writeFileSync } = require('fs')
    writeFileSync(saveResult.filePath, lines.join('\n'), 'utf-8')
    return { canceled: false, filePath: saveResult.filePath }
  })

  ipcMain.handle('file:export:sessionLog', async (event, sessionId: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const db = getDatabase()
    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(sessionId) as any
    if (!session) throw new Error('Session not found')

    const saveResult = await dialog.showSaveDialog(win, {
      title: '导出会话记录',
      defaultPath: `${session.title}_${new Date().toISOString().slice(0, 10)}.md`,
      filters: [{ name: 'Markdown Files', extensions: ['md'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) return { canceled: true }

    const lines: string[] = []
    lines.push(`# ${session.title}`)
    lines.push(`> 模式：${session.mode} | 时长：${Math.round((session.duration_seconds || 0) / 60)} 分钟`)
    lines.push('')

    // Collect turns based on mode
    if (session.mode === 'feynman') {
      const attempts = db.prepare('SELECT * FROM feynman_attempts WHERE session_id = ? ORDER BY attempt_number').all(sessionId) as any[]
      for (const a of attempts) {
        lines.push(`## 概念：${a.concept}`)
        lines.push(`**我的解释：** ${a.student_explanation}`)
        lines.push(`**AI 反馈：** ${a.ai_feedback}`)
        if (a.gaps_identified) lines.push(`**知识盲区：** ${a.gaps_identified}`)
        if (a.understanding_score) lines.push(`**理解评分：** ${a.understanding_score}/100`)
        lines.push('')
      }
    } else if (session.mode === 'first_principles') {
      const steps = db.prepare('SELECT * FROM first_principles_steps WHERE session_id = ? ORDER BY step_order').all(sessionId) as any[]
      for (const s of steps) {
        lines.push(`## 步骤 ${s.step_order}：${s.concept_name}`)
        if (s.student_response) lines.push(`**我的分析：** ${s.student_response}`)
        if (s.ai_guidance) lines.push(`**AI 引导：** ${s.ai_guidance}`)
        if (s.fundamental_truth) lines.push(`**基本真理：** ${s.fundamental_truth}`)
        if (s.is_leaf) lines.push('🔸 这是基本真理（不可再分）')
        lines.push('')
      }
    } else if (session.mode === 'socratic') {
      const turns = db.prepare('SELECT * FROM socratic_turns WHERE session_id = ? ORDER BY turn_number').all(sessionId) as any[]
      for (const t of turns) {
        lines.push(`## 第 ${t.turn_number} 轮 · ${t.question_type || '提问'}`)
        lines.push(`**AI 提问：** ${t.ai_question}`)
        if (t.student_answer) lines.push(`**我的回答：** ${t.student_answer}`)
        if (t.student_reflection) lines.push(`**反思：** ${t.student_reflection}`)
        lines.push('')
      }
    }

    const { writeFileSync } = require('fs')
    writeFileSync(saveResult.filePath, lines.join('\n'), 'utf-8')
    return { canceled: false, filePath: saveResult.filePath }
  })

  ipcMain.handle('file:export:allData', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const saveResult = await dialog.showSaveDialog(win, {
      title: '导出全部学习数据',
      defaultPath: `learning_data_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) return { canceled: true }

    const db = getDatabase()
    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      subjects: db.prepare('SELECT * FROM subjects').all(),
      topics: db.prepare('SELECT * FROM topics').all(),
      materials: db.prepare('SELECT id, title, source_type, file_name, word_count, created_at FROM materials').all(),
      sessions: db.prepare("SELECT * FROM study_sessions WHERE status = 'completed'").all(),
      feynmanAttempts: db.prepare('SELECT * FROM feynman_attempts').all(),
      firstPrinciplesSteps: db.prepare('SELECT * FROM first_principles_steps').all(),
      socraticTurns: db.prepare('SELECT * FROM socratic_turns').all(),
      flashcards: db.prepare('SELECT * FROM flashcards').all(),
      courses: db.prepare('SELECT * FROM courses').all(),
      studyGoals: db.prepare('SELECT * FROM study_goals').all(),
    }

    const { writeFileSync } = require('fs')
    writeFileSync(saveResult.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { canceled: false, filePath: saveResult.filePath }
  })
}

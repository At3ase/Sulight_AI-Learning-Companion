import { readFileSync } from 'fs'
import { extname, basename } from 'path'
import { randomUUID } from 'crypto'
import { getDatabase } from '../database/connection'

export interface ParseResult {
  title: string
  sourceType: 'pdf' | 'docx' | 'md' | 'txt' | 'manual'
  fileName: string | null
  fileSizeBytes: number | null
  contentText: string
  contentHtml: string | null
  wordCount: number
}

export async function parseFile(filePath: string): Promise<ParseResult> {
  const ext = extname(filePath).toLowerCase()
  const fileName = basename(filePath)
  const stats = readFileSync(filePath)
  const fileSizeBytes = stats.length

  let contentText = ''
  let contentHtml: string | null = null
  let sourceType: ParseResult['sourceType'] = 'txt'

  switch (ext) {
    case '.pdf':
      sourceType = 'pdf'
      contentText = await parsePDF(filePath)
      break
    case '.docx':
      sourceType = 'docx'
      const docxResult = await parseDOCX(filePath)
      contentText = docxResult.text
      contentHtml = docxResult.html
      break
    case '.md':
      sourceType = 'md'
      contentText = readFileSync(filePath, 'utf-8')
      break
    case '.txt':
      sourceType = 'txt'
      contentText = readFileSync(filePath, 'utf-8')
      break
    default:
      // Try reading as text
      sourceType = 'txt'
      contentText = readFileSync(filePath, 'utf-8')
  }

  const title = fileName.replace(ext, '')

  return {
    title,
    sourceType,
    fileName,
    fileSizeBytes,
    contentText,
    contentHtml,
    wordCount: contentText.split(/\s+/).filter(Boolean).length,
  }
}

async function parsePDF(filePath: string): Promise<string> {
  try {
    // Dynamic import in case pdf-parse has native deps issues
    const pdfParse = require('pdf-parse')
    const buffer = readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (err: any) {
    throw new Error(`Failed to parse PDF: ${err?.message ?? String(err)}`)
  }
}

async function parseDOCX(filePath: string): Promise<{ text: string; html: string }> {
  try {
    const mammoth = require('mammoth')
    const buffer = readFileSync(filePath)
    const result = await mammoth.extractRawText({ buffer })
    // Also get HTML version
    const htmlResult = await mammoth.convertToHtml({ buffer })
    return {
      text: result.value || '',
      html: htmlResult.value || null,
    }
  } catch (err: any) {
    throw new Error(`Failed to parse DOCX: ${err?.message ?? String(err)}`)
  }
}

export function saveMaterial(parseResult: ParseResult, topicId?: string): any {
  const db = getDatabase()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO materials (id, topic_id, title, source_type, file_path, file_name, file_size_bytes, content_text, content_html, word_count, parsed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id,
    topicId || null,
    parseResult.title,
    parseResult.sourceType,
    null, // file_path — we don't keep the original path
    parseResult.fileName,
    parseResult.fileSizeBytes,
    parseResult.contentText,
    parseResult.contentHtml,
    parseResult.wordCount
  )

  return db.prepare('SELECT * FROM materials WHERE id = ?').get(id)
}

export function deleteMaterial(materialId: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM materials WHERE id = ?').run(materialId)
}

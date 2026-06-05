import { useState, useEffect } from 'react'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import {
  Library, Plus, FileText, Upload, Search, Trash2, BookOpen,
  FolderOpen, ChevronRight, Folder, File, Loader2, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

export function KnowledgeBaseView() {
  const {
    subjects, topics, materials,
    selectedSubjectId, selectedTopicId, selectedSubject,
    loadSubjects, createSubject, deleteSubject,
    selectSubject, loadTopics, createTopic, deleteTopic,
    selectTopic, loadMaterials, searchMaterials
  } = useKnowledgeStore()

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectDesc, setNewSubjectDesc] = useState('')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => { loadSubjects() }, [])

  useEffect(() => {
    if (selectedSubjectId) loadTopics(selectedSubjectId)
  }, [selectedSubjectId])

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return
    const subj = await createSubject({ name: newSubjectName.trim(), description: newSubjectDesc.trim() })
    if (subj) {
      setNewSubjectName('')
      setNewSubjectDesc('')
      setShowAddSubject(false)
      toast.success(`科目「${subj.name}」已创建`)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('确定删除此科目及其所有关联数据？')) return
    await deleteSubject(id)
    toast.success('已删除')
  }

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !selectedSubjectId) return
    const topic = await createTopic({ name: newTopicName.trim(), subject_id: selectedSubjectId })
    if (topic) {
      setNewTopicName('')
      setShowAddTopic(false)
      toast.success(`主题「${topic.name}」已创建`)
    }
  }

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('确定删除此主题？')) return
    await deleteTopic(id)
    toast.success('已删除')
  }

  const handleImport = async () => {
    if (!window.electronAPI) {
      toast.error('应用未完全初始化，请重启后重试')
      return
    }
    setIsImporting(true)
    try {
      const response = await window.electronAPI.files.importFile(
        selectedTopicId || undefined
      )
      if (!response || response.canceled) {
        setIsImporting(false)
        return
      }
      const material = response.result
      if (material) {
        if (selectedTopicId) {
          await loadMaterials(selectedTopicId)
        }
        toast.success(`已导入「${material.title}」`)
      } else {
        toast.error('导入失败：未能保存资料')
      }
    } catch (err: any) {
      toast.error(`导入失败：${err?.message || '未知错误'}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      await searchMaterials(searchQuery)
      const results = useKnowledgeStore.getState().materials
      setSearchResults(results)
    } catch {
      toast.error('搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSubject = (id: string) => {
    selectSubject(id)
    selectTopic(null)
  }

  const handleSelectTopic = (id: string) => selectTopic(id)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary-500" />
            <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              知识管理
            </span>
          </div>
          <h1 className="text-h1 mb-1" style={{ color: 'var(--text-primary)' }}>知识库</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            按科目和主题组织学习资料，支持导入 PDF、DOCX、MD、TXT 文件。
          </p>
        </div>
        <button
          onClick={handleImport}
          disabled={isImporting || !selectedTopicId}
          title={!selectedTopicId ? '请先在右侧面板中选择一个主题' : '导入 PDF、DOCX、MD 或 TXT 文件'}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          导入资料
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索资料内容..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-field"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="card p-5">
          <h3 className="font-medium mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
            搜索结果（{searchResults.length}）
          </h3>
          <div className="space-y-2">
            {searchResults.map((m: any) => (
              <div
                key={m.id}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-inset)' }}
              >
                <FileText size={18} style={{ color: 'var(--text-tertiary)' }} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                    {m.content_text?.slice(0, 200)}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-inset)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {m.source_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content: 3-column */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subjects column */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BookOpen size={16} className="text-primary-500" /> 科目
            </h3>
            <button
              onClick={() => setShowAddSubject(!showAddSubject)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Plus size={16} />
            </button>
          </div>

          {showAddSubject && (
            <div className="mb-3 p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
              <input
                type="text"
                placeholder="科目名称"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={newSubjectDesc}
                onChange={e => setNewSubjectDesc(e.target.value)}
                className="input-field text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleCreateSubject} className="btn-primary text-xs py-1.5">创建</button>
                <button onClick={() => setShowAddSubject(false)} className="btn-ghost text-xs py-1.5">取消</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {subjects.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                还没有科目，点击 + 创建第一个
              </p>
            ) : (
              subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSubject(s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-all duration-fast"
                  style={{
                    backgroundColor: selectedSubjectId === s.id ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                    color: selectedSubjectId === s.id ? '#C2410C' : 'var(--text-secondary)',
                  }}
                >
                  <span>{s.icon}</span>
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  <Trash2
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-tertiary)' }}
                    onClick={e => { e.stopPropagation(); handleDeleteSubject(s.id) }}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Topics column */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FolderOpen size={16} className="text-primary-500" /> 主题
            </h3>
            {selectedSubjectId && (
              <button
                onClick={() => setShowAddTopic(!showAddTopic)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {showAddTopic && selectedSubjectId && (
            <div className="mb-3 p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
              <input
                type="text"
                placeholder="主题名称"
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                className="input-field text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleCreateTopic} className="btn-primary text-xs py-1.5">创建</button>
                <button onClick={() => setShowAddTopic(false)} className="btn-ghost text-xs py-1.5">取消</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {!selectedSubjectId ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>← 先选择一个科目</p>
            ) : topics.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>暂无主题，点击 + 创建</p>
            ) : (
              topics.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopic(t.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-all duration-fast"
                  style={{
                    backgroundColor: selectedTopicId === t.id ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                    color: selectedTopicId === t.id ? '#C2410C' : 'var(--text-secondary)',
                  }}
                >
                  <ChevronRight size={14} />
                  <span className="flex-1 text-left truncate">{t.name}</span>
                  <Trash2
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-tertiary)' }}
                    onClick={e => { e.stopPropagation(); handleDeleteTopic(t.id) }}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Materials column */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <File size={16} className="text-primary-500" /> 资料
            </h3>
            <button
              onClick={handleImport}
              disabled={isImporting || !selectedTopicId}
              title={!selectedTopicId ? '请先选择一个主题' : '导入资料到此主题'}
              className="p-1.5 rounded-md transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </button>
          </div>

          <div className="space-y-2">
            {!selectedTopicId ? (
              <p className="text-xs py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                ← 先选择科目，再点击主题来查看资料
              </p>
            ) : materials.length === 0 ? (
              <div className="text-center py-8">
                <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--border-strong)' }} />
                <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  此主题下还没有资料
                </p>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs btn-primary disabled:opacity-50"
                >
                  <Upload size={12} />
                  导入 PDF / DOCX / MD / TXT
                </button>
              </div>
            ) : (
              materials.map(m => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-inset)' }}
                >
                  <div className="flex items-start gap-2">
                    <FileText size={16} style={{ color: 'var(--text-tertiary)' }} className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>{m.source_type}</span>
                        {m.word_count && (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.word_count} 字</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {m.content_text && (
                    <p className="mt-2 text-xs line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {m.content_text.slice(0, 300)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

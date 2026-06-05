import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, TrendingUp, Award, Calendar, Clock,
  FileDown, Download, FileText, Sparkles
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
} from 'recharts'
import toast from 'react-hot-toast'
import type { Achievement, FlashcardStats, SessionStats } from '@/types/database'

const COLORS = ['#F97316', '#F59E0B', '#10B981', '#EF4444', '#14B8A6']

export function ProgressView() {
  const navigate = useNavigate()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [flashStats, setFlashStats] = useState<FlashcardStats | null>(null)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scoreTrend, setScoreTrend] = useState<any[]>([])
  const [timeDist, setTimeDist] = useState<any[]>([])
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [masteryOverview, setMasteryOverview] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    if (!window.electronAPI) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      await window.electronAPI.db.achievements.list()

      const [achs, flash, sessions, trend, time, weekly, mastery, strk] = await Promise.all([
        window.electronAPI.db.achievements.check().catch(() => []),
        window.electronAPI.db.flashcards.getStats().catch(() => null),
        window.electronAPI.db.sessions.getStats().catch(() => null),
        window.electronAPI.db.analytics.feynmanScoreTrend().catch(() => []),
        window.electronAPI.db.analytics.timeDistribution().catch(() => ({ byMode: [], recent: [] })),
        window.electronAPI.db.analytics.weeklyReport().catch(() => null),
        window.electronAPI.db.analytics.masteryOverview().catch(() => null),
        window.electronAPI.db.analytics.learningStreak().catch(() => ({ streak: 0, recentDates: [] })),
      ])
      setAchievements(achs)
      setFlashStats(flash)
      setSessionStats(sessions)
      setScoreTrend(trend)
      setTimeDist(time.recent || [])
      setWeeklyReport(weekly)
      setMasteryOverview(mastery)
      setStreak(strk)
    } catch { /* fallback */ }
    setIsLoading(false)
  }

  const totalHours = sessionStats ? Math.round(sessionStats.totalSeconds / 3600 * 10) / 10 : 0
  const modeLabels: Record<string, string> = { feynman: '费曼技巧', first_principles: '第一性原理', socratic: '苏格拉底' }

  const pieData = sessionStats?.byMode?.map((m: any) => ({
    name: modeLabels[m.mode] || m.mode,
    value: m.count,
  })) || []

  const handleExportMarkdown = async () => {
    if (!window.electronAPI) return
    setExporting(true)
    try {
      const sessions = sessionStats?.recent || []
      const result = await window.electronAPI.files.export.markdown({ sessions })
      if (result?.canceled === false) {
        toast.success('笔记已导出为 Markdown')
      }
    } catch (err: any) {
      toast.error(`导出失败：${err?.message || '未知错误'}`)
    } finally {
      setExporting(false)
    }
  }

  const handleExportAllData = async () => {
    if (!window.electronAPI) return
    setExporting(true)
    try {
      const result = await window.electronAPI.files.export.allData()
      if (result?.canceled === false) {
        toast.success('全部学习数据已导出')
      }
    } catch (err: any) {
      toast.error(`导出失败：${err?.message || '未知错误'}`)
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-tertiary)' }}>加载学习数据...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary-500" />
            <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              数据洞察
            </span>
          </div>
          <h1 className="text-h1 mb-1" style={{ color: 'var(--text-primary)' }}>学习进度</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            追踪你的学习旅程，看见每一次进步。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportMarkdown}
            disabled={exporting}
            className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText size={14} /> 导出笔记
          </button>
          <button
            onClick={handleExportAllData}
            disabled={exporting}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download size={14} /> 全部导出
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { value: `${totalHours}h`, label: '累计学习', color: '#F97316' },
          { value: sessionStats?.totalSessions || 0, label: '完成会话', color: '#10B981' },
          { value: flashStats?.totalCards || 0, label: '复习卡片', color: '#F59E0B' },
          { value: flashStats?.masteredCards || 0, label: '已掌握', color: '#14B8A6' },
          { value: `🔥 ${streak?.streak || 0}`, label: '连续天数', color: '#EF4444' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 text-center card-hover">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mastery Overview */}
      {masteryOverview && masteryOverview.totalCards > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Award size={16} className="text-primary-500" /> 掌握概览
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-inset)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${masteryOverview.masteryRate}%`,
                    background: 'linear-gradient(90deg, #F97316 0%, #10B981 100%)',
                  }}
                />
              </div>
              <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                掌握率 {masteryOverview.masteryRate}% · {masteryOverview.masteredCards}/{masteryOverview.totalCards} 张卡片
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report */}
      {weeklyReport && weeklyReport.sessionCount > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={16} className="text-primary-500" /> 本周报告
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            {[
              { value: weeklyReport.sessionCount, label: '学习会话', color: '#F97316' },
              { value: `${weeklyReport.totalMinutes}分钟`, label: '学习时长', color: '#10B981' },
              { value: weeklyReport.newCards, label: '新卡片', color: '#F59E0B' },
              { value: weeklyReport.reviewedCards, label: '已复习', color: '#14B8A6' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score trend chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={16} className="text-primary-500" /> 理解力趋势
          </h3>
          {scoreTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v?.slice(5) || ''}
                  stroke="var(--border-strong)"
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--border-strong)" />
                <ReTooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  labelFormatter={(v) => `日期：${v}`}
                />
                <Area
                  type="monotone"
                  dataKey="understanding_score"
                  stroke="#F97316"
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                  name="理解分数"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              完成费曼学习会话后将显示理解力趋势
            </p>
          )}
        </div>

        {/* Learning mode distribution pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 size={16} className="text-primary-500" /> 学习方式分布
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value, name) => [`${value} 次`, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              开始学习后将显示分布统计
            </p>
          )}
        </div>
      </div>

      {/* Daily study time bar chart */}
      {timeDist.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock size={16} className="text-primary-500" /> 每日学习时长（近30天）
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9 }}
                tickFormatter={(v) => v?.slice(5) || ''}
                stroke="var(--border-strong)"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--border-strong)" />
              <ReTooltip
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                formatter={(value) => [`${Math.round(Number(value) / 60)} 分钟`, '学习时长']}
                labelFormatter={(v) => `日期：${v}`}
              />
              <Bar dataKey="minutes" fill="#F97316" radius={[4, 4, 0, 0]} name="分钟" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Today's review */}
      {flashStats && flashStats.dueCards > 0 && (
        <div
          className="card p-4 flex items-center justify-between"
          style={{
            borderLeft: '3px solid #F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.04)',
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {flashStats.dueCards} 张卡片等待复习
            </span>
          </div>
          <button
            onClick={() => navigate('/review')}
            className="px-3 py-1.5 text-xs rounded-md text-white transition-all duration-fast"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
            }}
          >
            去复习
          </button>
        </div>
      )}

      {/* Export section */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileDown size={16} className="text-primary-500" /> 数据导出
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={handleExportMarkdown}
            disabled={exporting}
            className="btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileText size={14} /> Markdown
          </button>
          <button
            onClick={async () => {
              if (!window.electronAPI || !flashStats?.totalCards) return
              const flashcards: any[] = []
              const result = await window.electronAPI.files.export.anki({ flashcards })
              if (result?.canceled === false) toast.success('CSV 可用于 Anki 导入')
            }}
            disabled={exporting || !flashStats?.totalCards}
            className="btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileDown size={14} /> Anki CSV
          </button>
          <button
            onClick={handleExportAllData}
            disabled={exporting}
            className="btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={14} /> JSON 备份
          </button>
          <button
            onClick={handleExportMarkdown}
            disabled={exporting}
            className="btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileDown size={14} /> 全部导出
          </button>
        </div>
      </div>

      {/* Achievements grid */}
      <div>
        <h2 className="text-h3 mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Award size={20} className="text-primary-500" /> 成就徽章
        </h2>
        {achievements.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>开始学习以解锁成就...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {achievements.map(a => (
              <div
                key={a.id}
                className={`card p-4 text-center transition-all duration-300 ${
                  a.unlocked_at ? 'card-hover' : ''
                }`}
                style={
                  a.unlocked_at
                    ? {
                        borderLeft: '3px solid #10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.04)',
                      }
                    : { opacity: 0.6 }
                }
              >
                <div className="text-3xl mb-2">{a.icon}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{a.description}</div>
                {!a.unlocked_at && a.progress > 0 && (
                  <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-inset)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${a.progress * 100}%`,
                        background: 'linear-gradient(90deg, #F97316 0%, #10B981 100%)',
                      }}
                    />
                  </div>
                )}
                {a.unlocked_at && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✅ 已解锁</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

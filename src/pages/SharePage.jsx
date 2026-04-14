import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import StatusSphere, { SPHERE_STATES } from '../components/StatusSphere/index.jsx'

export default function SharePage() {
  const { shareId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!shareId) return
    const loadShare = async () => {
      try {
        const res = await fetch(`/api/conflict/status?share_id=${shareId}`)
        const data = await res.json()
        if (data.analysis) {
          setAnalysis(data.analysis)
        } else {
          setError('分享已过期或不存在')
        }
      } catch {
        setError('加载失败，请重试')
      } finally {
        setLoading(false)
      }
    }
    loadShare()
  }, [shareId])

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🪞</div>
          <p className="text-sm text-[#6B6B80] font-mono">加载分析报告中...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-sm text-[#6B6B80]">{error || '未找到分析报告'}</p>
          <a href="/" className="btn-teal mt-6 inline-block">开始自己的分析 →</a>
        </div>
      </div>
    )
  }

  const { scholar } = analysis

  return (
    <div className="relative z-10 min-h-screen flex flex-col pb-8">
      {/* 顶部 */}
      <header className="px-5 pt-8 pb-4 text-center">
        <div className="text-3xl mb-3">🪞</div>
        <h1 className="font-display text-xl font-bold text-[#E8E8F0]">Mirror · 匿名冲突报告</h1>
        <p className="text-xs text-[#6B6B80] font-mono mt-1">
          匿名分享 · 已脱敏
        </p>
      </header>

      {/* 状态球 */}
      <div className="flex justify-center mb-6">
        <StatusSphere
          state={SPHERE_STATES.ANXIOUS}
          angerScore={analysis.angerScore}
          size={120}
        />
      </div>

      <div className="px-5 space-y-4">
        {/* 基础信息 */}
        <div className="glass-card p-4 text-center">
          <div className="text-xs font-mono text-[#6B6B80] mb-1">冲突概述（已脱敏）</div>
          <p className="text-sm text-[#E8E8F0]">{analysis.conflictSummary}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="tag-chip tag-crimson">愤怒指数 {analysis.angerScore}/10</span>
            <span className="tag-chip">已匿名化</span>
          </div>
        </div>

        {/* 学者解构 */}
        <div className="glass-card p-5">
          <div className="text-xs font-mono text-[#6B6B80] mb-3">🧠 学者解构</div>
          <div className="space-y-3">
            {scholar.logicGaps.map((g, i) => (
              <div key={i} className="border-l-2 border-[rgba(232,64,64,0.3)] pl-3">
                <div className="text-sm text-[#E8E8F0]">{g.type}</div>
                <div className="text-xs text-[#6B6B80] mt-0.5">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 本我偏差 */}
        <div className="glass-card p-5">
          <div className="text-xs font-mono text-[#6B6B80] mb-2">🪞 本我偏差</div>
          <p className="text-sm text-[#6B6B80] italic leading-relaxed">「{scholar.selfBias}」</p>
        </div>

        {/* 期望落差 */}
        <div className="glass-card p-5">
          <div className="text-xs font-mono text-[#6B6B80] mb-2">⚡ 期望落差</div>
          <p className="text-sm text-[#6B6B80] leading-relaxed">{scholar.expectationGap}</p>
        </div>

        {/* 真相洁癖度 */}
        <div className="glass-card p-5">
          <div className="text-xs font-mono text-[#6B6B80] mb-3">🔬 真相洁癖度</div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-display font-bold text-[#E84040]">{scholar.truthCleanliness}</span>
            <div className="flex-1 progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${scholar.truthCleanliness}%` }}
              />
            </div>
          </div>
        </div>

        {/* 底部 CTA */}
        <div className="text-center pt-4">
          <p className="text-xs text-[#3A3A50] font-mono mb-3">
            在冲突中照见真相，在觉知中化解矛盾
          </p>
          <a
            href="/"
            className="btn-teal inline-flex items-center gap-2 text-sm"
          >
            🪞 使用 Mirror 分析你的冲突
          </a>
        </div>
      </div>
    </div>
  )
}

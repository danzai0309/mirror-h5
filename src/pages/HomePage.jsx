import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusSphere, { SPHERE_STATES } from '../components/StatusSphere/index.jsx'

const API_BASE = ''

const RECENT_RECORDS = [
  {
    id: 'task-1',
    opponent: '妈妈',
    date: '今天 14:23',
    status: 'completed',
    angerScore: 7,
    summary: '关于春节回家的安排',
  },
  {
    id: 'task-2',
    opponent: '直属领导',
    date: '昨天 19:45',
    status: 'completed',
    angerScore: 4,
    summary: '项目进度的质疑',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [uploadMode, setUploadMode] = useState(null) // 'audio' | 'text'
  const [textDesc, setTextDesc] = useState('')
  const [angerScore, setAngerScore] = useState(5)
  const [isUploading, setIsUploading] = useState(false)
  const [recentRecords] = useState(RECENT_RECORDS)

  // 从冲突文本中智能提取对方名称
  const extractOpponentName = (text) => {
    // 匹配模式：和[名字]、跟[名字]、和[某]的[关系]
    const patterns = [
      /(?:和|跟|同|与|和我的|跟我的|和我的|被)(.{1,8}?)(?:的|说|吵|闹|发生|发生冲突|的矛盾|吵架)/,
      /(?:我男|我女|我老婆|我老公|我男友|我女友|我上司|我老板|我同事|我妈|我爸|我朋友)(.{0,4}?)(?:说|骂|吵|凶)/,
      /([^\s]{2,4})(?:说|骂|凶|吼|吼我|说了)/,
    ]
    for (const p of patterns) {
      const m = text.match(p)
      if (m && m[1] && !['我', '他', '她', '他们', '什么', '这个', '那个', '某人'].includes(m[1].trim())) {
        return m[1].trim().slice(0, 6)
      }
    }
    // 备选：找第一个 2-4 字的中文名字
    const nameMatch = text.match(/[和跟与同][^，。,.]{1,8}/)
    if (nameMatch) {
      const cleaned = nameMatch[0].slice(1).trim()
      return cleaned.slice(0, 6)
    }
    return '对方'
  }

  const handleStartConflict = async () => {
    // 语音模式：示例冲突描述
    const exampleText = '我在公司会议上提出一个新想法，老板直接否定了，还说"这种想法不现实"。我觉得很受挫，也很愤怒。'
    setIsUploading(true)
    try {
      const res = await fetch(`${API_BASE}/api/conflict/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: exampleText, anger_score: angerScore }),
      })
      const data = await res.json()
      if (data.task_id) {
        // 跳转到报告页，携带分析结果（避免再查询一次 API）
        navigate(`/conflict/${data.task_id}`, {
          state: {
            analysis: data.analysis,
            opponentName: '老板',
            angerScore: data.angerScore,
          },
        })
      } else {
        alert(data.error || '分析失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textDesc.trim()) return
    setIsUploading(true)
    try {
      const res = await fetch(`${API_BASE}/api/conflict/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textDesc, anger_score: angerScore }),
      })
      const data = await res.json()
      const opponent = extractOpponentName(textDesc)
      if (data.task_id) {
        navigate(`/conflict/${data.task_id}`, {
          state: {
            analysis: data.analysis,
            opponentName: opponent,
            angerScore: data.angerScore,
          },
        })
      } else {
        alert(data.error || '分析失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-5 pt-12 pb-8">

      {/* 顶部 Logo 区 */}
      <header className="flex items-center justify-between mb-10 animate-in" style={{ animationDelay: '0ms' }}>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-glow-crimson">
            Mirror
          </h1>
          <p className="text-xs text-[#6B6B80] mt-0.5 font-mono">镜像觉知 · v1.0</p>
        </div>
        <div className="w-9 h-9 rounded-full glass-card flex items-center justify-center">
          <span className="text-base">🪞</span>
        </div>
      </header>

      {/* 情绪球演示 */}
      <section
        className="flex flex-col items-center mb-10 animate-in"
        style={{ animationDelay: '100ms' }}
      >
        <StatusSphere
          state={SPHERE_STATES.ANXIOUS}
          angerScore={angerScore}
          size={160}
        />
        <p className="text-xs text-[#6B6B80] mt-4 font-mono text-center">
          冲突中的你 · {angerScore}/10 焦虑指数
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAngerScore(Math.max(1, angerScore - 1))}
            className="w-8 h-8 rounded-full glass-card text-sm flex items-center justify-center no-dbl-tap"
          >
            −
          </button>
          <div className="progress-bar-track w-24 self-center">
            <div
              className="progress-bar-fill"
              style={{ width: `${(angerScore / 10) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setAngerScore(Math.min(10, angerScore + 1))}
            className="w-8 h-8 rounded-full glass-card text-sm flex items-center justify-center no-dbl-tap"
          >
            +
          </button>
        </div>
      </section>

      {/* 冲突入口 */}
      <section className="mb-8 animate-in" style={{ animationDelay: '200ms' }}>
        <p className="text-sm text-[#6B6B80] mb-4 font-mono">// 记录一次冲突</p>

        {/* 上传方式切换 */}
        {!uploadMode ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setUploadMode('audio')}
              className="glass-card-active p-5 flex items-center gap-4 text-left no-dbl-tap"
            >
              <div className="w-12 h-12 rounded-2xl bg-[rgba(232,64,64,0.15)] border border-[rgba(232,64,64,0.2)] flex items-center justify-center shrink-0">
                <span className="text-xl">🎙️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-[#E8E8F0]">上传语音 / 录音</div>
                <div className="text-xs text-[#6B6B80] mt-0.5">让 AI 转写并分析对话</div>
              </div>
              <div className="ml-auto text-[#6B6B80] text-lg">→</div>
            </button>

            <button
              onClick={() => setUploadMode('text')}
              className="glass-card p-5 flex items-center gap-4 text-left no-dbl-tap"
            >
              <div className="w-12 h-12 rounded-2xl bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.2)] flex items-center justify-center shrink-0">
                <span className="text-xl">✍️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-[#E8E8F0]">文字描述冲突</div>
                <div className="text-xs text-[#6B6B80] mt-0.5">手动输入冲突经过</div>
              </div>
              <div className="ml-auto text-[#6B6B80] text-lg">→</div>
            </button>
          </div>
        ) : (
          <div className="glass-card-active p-5 animate-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#6B6B80]">
                {uploadMode === 'audio' ? '// 语音上传' : '// 文字描述'}
              </span>
              <button
                onClick={() => { setUploadMode(null); setTextDesc('') }}
                className="text-xs text-[#6B6B80] hover:text-[#E8E8F0] transition-colors"
              >
                ← 返回
              </button>
            </div>

            {uploadMode === 'audio' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[rgba(232,64,64,0.4)] flex items-center justify-center bg-[rgba(232,64,64,0.05)]">
                  <span className="text-3xl">🎙️</span>
                </div>
                <p className="text-xs text-[#6B6B80] text-center">
                  点击按钮开始录音<br />或上传已有音频文件
                </p>
                <button
                  onClick={handleStartConflict}
                  disabled={isUploading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isUploading ? '处理中...' : '开始分析'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <textarea
                  value={textDesc}
                  onChange={e => setTextDesc(e.target.value)}
                  placeholder="描述这次冲突：发生了什么？对方说了什么？你的感受是什么？"
                  rows={5}
                  className="input-glass text-sm"
                />
                <div>
                  <label className="text-xs text-[#6B6B80] font-mono mb-2 block">
                    愤怒指数：{angerScore}/10
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                      <button
                        key={v}
                        onClick={() => setAngerScore(v)}
                        className={`flex-1 h-8 rounded-lg text-xs font-mono transition-all duration-200 ${
                          v <= angerScore
                            ? 'bg-[rgba(232,64,64,0.2)] text-[#E84040] border border-[rgba(232,64,64,0.3)]'
                            : 'bg-[rgba(255,255,255,0.03)] text-[#6B6B80] border border-[rgba(255,255,255,0.06)]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleTextSubmit}
                  disabled={isUploading || !textDesc.trim()}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isUploading ? '分析中...' : '生成报告'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 分割线 */}
      <hr className="section-divider" />

      {/* 最近记录 */}
      {recentRecords.length > 0 && (
        <section className="animate-in" style={{ animationDelay: '300ms' }}>
          <p className="text-xs font-mono text-[#6B6B80] mb-3">// 最近记录</p>
          <div className="flex flex-col gap-2">
            {recentRecords.map(record => (
              <button
                key={record.id}
                onClick={() => navigate(`/conflict/${record.id}`)}
                className="glass-card p-4 flex items-center gap-3 text-left no-dbl-tap"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  record.angerScore >= 7
                    ? 'bg-[#E84040]'
                    : record.angerScore >= 4
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#14B8A6]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#E8E8F0] truncate">{record.summary}</div>
                  <div className="text-xs text-[#6B6B80] mt-0.5">
                    {record.opponent} · {record.date}
                  </div>
                </div>
                <span className="text-xs font-mono text-[#6B6B80]">{record.angerScore}/10</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 底部安全区 */}
      <div className="mt-auto pt-6 safe-bottom">
        <div className="text-center">
          <p className="text-xs text-[#3A3A50] font-mono">
            在冲突中照见真相，在觉知中化解矛盾
          </p>
        </div>
      </div>
    </div>
  )
}

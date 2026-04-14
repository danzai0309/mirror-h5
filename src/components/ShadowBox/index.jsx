import { useState, useRef } from 'react'

export default function ShadowBox({ seed, onClose }) {
  const [reply, setReply] = useState('')
  const [result, setResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [history, setHistory] = useState([])
  const overlayRef = useRef(null)

  const handleSubmit = async () => {
    if (!reply.trim() || isAnalyzing) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/conflict/shadowbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_quote: seed, user_reply: reply }),
      })
      const data = await res.json()
      if (data.score !== undefined) {
        setResult({
          score:         data.score,
          suggestion:    data.suggestion   || '',
          revisedReply:  data.revised_reply || reply,
          strength:      data.strength     || '',
          weakness:      data.weakness     || '',
        })
        setHistory(h => [...h, { reply, score: data.score, suggestion: data.suggestion, revisedReply: data.revised_reply }])
      } else {
        alert(data.error || '对练失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#14B8A6'
    if (score >= 50) return '#F59E0B'
    return '#E84040'
  }

  const circumference = 2 * Math.PI * 42
  const dashOffset = result
    ? circumference * (1 - result.score / 100)
    : circumference

  return (
    <>
      {/* 背景遮罩 */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={(e) => e.target === overlayRef.current && onClose()}
      >
        <div
          className="w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl bg-[#111119] border border-[rgba(255,255,255,0.08)] p-6 pb-8 max-h-[90vh] overflow-y-auto"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔️</span>
              <span className="text-sm font-medium text-[#E8E8F0]">影子对练</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-sm no-dbl-tap"
            >
              ✕
            </button>
          </div>

          {/* 对方原话 */}
          <div className="mb-5">
            <div className="text-xs font-mono text-[#E84040] mb-2">// 对方卡住你的原话</div>
            <div className="glass-card-active p-4 border-l-2 border-[rgba(232,64,64,0.4)]">
              <p className="text-sm text-[#E8E8F0] leading-relaxed italic">
                「{seed}」
              </p>
            </div>
          </div>

          {/* 你的回复 */}
          <div className="mb-4">
            <div className="text-xs font-mono text-[#6B6B80] mb-2">// 你的回复</div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="在这里写下你想说的话..."
              rows={4}
              className="input-glass text-sm"
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!reply.trim() || isAnalyzing}
            className="btn-primary w-full disabled:opacity-50 mb-6"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span>
                AI 分析中...
              </span>
            ) : (
              '分析并评分'
            )}
          </button>

          {/* 结果区 */}
          {result && (
            <div className="space-y-4 animate-in">
              <div className="border-t border-[rgba(255,255,255,0.06)] pt-5">
                <div className="text-xs font-mono text-[#6B6B80] mb-4">// 评分结果</div>

                {/* 环形分数 */}
                <div className="flex items-center gap-6 mb-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                      {/* 背景环 */}
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="6"
                      />
                      {/* 分数环 */}
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke={getScoreColor(result.score)}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono" style={{ color: getScoreColor(result.score) }}>
                        {result.score}
                      </span>
                      <span className="text-[10px] text-[#6B6B80] font-mono">/ 100</span>
                    </div>
                  </div>

                  {/* 评分标签 */}
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-[#6B6B80]">
                      {result.score >= 80 ? '✨ 优秀：逻辑清晰，边界明确' :
                       result.score >= 50 ? '⚡ 良好：基本到位，可微调' :
                       '💡 需改进：建议重写结构'}
                    </div>
                    {/* 进度条 */}
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${result.score}%`,
                          background: `linear-gradient(90deg, #E84040, ${getScoreColor(result.score)})`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI 建议 */}
                <div className="mb-4">
                  <div className="text-xs font-mono text-[#F59E0B] mb-2">// 改进建议</div>
                  <div className="glass-card p-4">
                    <p className="text-sm text-[#6B6B80] leading-relaxed">{result.suggestion}</p>
                  </div>
                </div>

                {/* 优化版本 */}
                {result.revisedReply && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-mono text-[#14B8A6]">// 优化后的回复</div>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.revisedReply)}
                        className="text-xs text-[#6B6B80] hover:text-[#14B8A6] font-mono"
                      >
                        复制 ✂
                      </button>
                    </div>
                    <div className="glass-card-active p-4 border border-[rgba(20,184,166,0.2)]">
                      <p className="text-sm text-[#E8E8F0] leading-relaxed">{result.revisedReply}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 历史记录 */}
          {history.length > 0 && (
            <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-5">
              <div className="text-xs font-mono text-[#6B6B80] mb-3">// 历史练习</div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="glass-card p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-[#6B6B80]">第{i + 1}次</span>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: getScoreColor(h.score) }}
                      >
                        {h.score}分
                      </span>
                    </div>
                    <p className="text-xs text-[#E8E8F0] line-clamp-2">{h.reply}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

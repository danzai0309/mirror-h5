import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import StatusSphere, { SPHERE_STATES } from '../components/StatusSphere/index.jsx'
import ShadowBox from '../components/ShadowBox/index.jsx'

const API_BASE = ''

// 标签页
const TABS = [
  { id: 'scholar', label: '学者解构', icon: '🧠' },
  { id: 'armory', label: '逻辑军械库', icon: '⚔️' },
  { id: 'judge', label: '中立裁判', icon: '⚖️' },
  { id: 'wise', label: '智者抽离', icon: '🌊' },
]

export default function ReportPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('scholar')
  const [sphereState, setSphereState] = useState(SPHERE_STATES.ANXIOUS)
  const [collapseProgress, setCollapseProgress] = useState(0)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [showShadowBox, setShowShadowBox] = useState(false)
  const [copiedScript, setCopiedScript] = useState(null)
  const [reportStatus, setReportStatus] = useState('loading')
  const [analysisResult, setAnalysisResult] = useState(null)
  const collapseTimerRef = useRef(null)
  const location = useLocation()
  const [opponentName, setOpponentName] = useState('对方')

  // 优先从导航状态读取分析结果（上传后直接传入）
  useEffect(() => {
    if (location.state?.analysis) {
      setAnalysisResult(location.state.analysis)
      setReportStatus('completed')
      setSphereState(SPHERE_STATES.ANXIOUS)
      if (location.state.opponentName) setOpponentName(location.state.opponentName)
      return
    }
    // 否则从 API 轮询加载（最多等 60 秒）
    let attempts = 0
    const maxAttempts = 60
    const loadAnalysis = async () => {
      try {
        const res = await fetch(`/api/conflict/status?task_id=${taskId}`)
        const data = await res.json()
        if (data.analysis) {
          setAnalysisResult(data.analysis)
          setReportStatus('completed')
          setSphereState(SPHERE_STATES.ANXIOUS)
          if (data.analysis.opponentName) setOpponentName(data.analysis.opponentName)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(loadAnalysis, 2000)
        } else {
          setReportStatus('error')
        }
      } catch {
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(loadAnalysis, 2000)
        } else {
          setReportStatus('error')
        }
      }
    }
    loadAnalysis()
  }, [taskId, location.state])

  // 切换到「智者抽离」时播放坍缩动画
  useEffect(() => {
    if (activeTab === 'wise' && analysisResult) {
      setIsCollapsing(true)
      setSphereState(SPHERE_STATES.COLLAPSING)
      collapseTimerRef.current = setTimeout(() => {
        setSphereState(SPHERE_STATES.TRANSPARENT)
        setIsCollapsing(false)
      }, 3500)
    }
    return () => clearTimeout(collapseTimerRef.current)
  }, [activeTab, analysisResult])

  const handleCopyScript = (script, idx) => {
    navigator.clipboard.writeText(script).then(() => {
      setCopiedScript(idx)
      setTimeout(() => setCopiedScript(null), 2000)
    })
  }

  const getScoreColor = (score) => {
    if (score >= 70) return '#14B8A6'
    if (score >= 40) return '#F59E0B'
    return '#E84040'
  }

  if (reportStatus === 'loading') {
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5">
        <StatusSphere state={SPHERE_STATES.ANXIOUS} angerScore={5} size={120} />
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-[#6B6B80] font-mono">// 正在解析冲突...</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#E84040] animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { scholar, logicArmory, neutralJudge, wiseMan } = analysisResult

  return (
    <div className="relative z-10 min-h-screen flex flex-col pb-6">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3"
        style={{ background: 'linear-gradient(to bottom, #09090F 60%, transparent)' }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-sm no-dbl-tap"
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-xs font-mono text-[#6B6B80]">冲突报告</div>
            <div className="text-xs text-[#3A3A50] font-mono mt-0.5">{taskId?.slice(0, 8)}...</div>
          </div>
          <button
            onClick={() => setShowShadowBox(true)}
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-sm no-dbl-tap"
          >
            ⚔️
          </button>
        </div>

        {/* 状态球 + 基础信息 */}
        <div className="flex items-start gap-4 mb-5">
          <StatusSphere
            state={sphereState}
            angerScore={analysisResult.angerScore}
            size={100}
          />
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="tag-chip tag-crimson">{opponentName}</span>
              <span className="text-xs font-mono text-[#6B6B80]">
                {analysisResult.angerScore}/10
              </span>
            </div>
            <p className="text-sm text-[#E8E8F0] leading-snug line-clamp-2">
              {analysisResult.conflictSummary}
            </p>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''} flex flex-col items-center gap-0.5 py-2`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 px-5 mt-4 space-y-4 overflow-y-auto pb-24">

        {/* ── 学者解构 ── */}
        {activeTab === 'scholar' && (
          <div className="space-y-4 animate-in">
            <TabSection title="逻辑漏洞" icon="🔍">
              <div className="space-y-3">
                {scholar.logicGaps.map((gap, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#E8E8F0]">{gap.type}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 3 }, (_, j) => (
                          <div
                            key={j}
                            className={`w-2 h-2 rounded-full ${
                              j < gap.severity ? 'bg-[#E84040]' : 'bg-[rgba(255,255,255,0.1)]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#6B6B80] leading-relaxed">{gap.desc}</p>
                  </div>
                ))}
              </div>
            </TabSection>

            <TabSection title="本我偏差" icon="🪞">
              <div className="glass-card-active p-4">
                <p className="text-sm text-[#E8E8F0] leading-relaxed italic">
                  「{scholar.selfBias}」
                </p>
              </div>
            </TabSection>

            <TabSection title="期望落差" icon="⚡">
              <div className="glass-card p-4">
                <p className="text-sm text-[#6B6B80] leading-relaxed">{scholar.expectationGap}</p>
              </div>
            </TabSection>

            <TabSection title="真相洁癖度" icon="🔬">
              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display font-bold text-[#E84040]">
                    {scholar.truthCleanliness}
                  </span>
                  <span className="text-xs text-[#6B6B80] font-mono">/ 100</span>
                  <div className="flex-1 progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${scholar.truthCleanliness}%`,
                        background: `linear-gradient(90deg, #E84040, ${getScoreColor(scholar.truthCleanliness)})`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#6B6B80] mt-2">
                  你对「被理解」的执念程度——分值越高，说明你在冲突中越追求「绝对公平」
                </p>
              </div>
            </TabSection>

            <TabSection title="行为模式" icon="🔁">
              <div className="glass-card-active p-4">
                <span className="tag-chip tag-crimson">{scholar.behaviorPattern}</span>
              </div>
            </TabSection>
          </div>
        )}

        {/* ── 逻辑军械库 ── */}
        {activeTab === 'armory' && (
          <div className="space-y-4 animate-in">
            <TabSection title="场景回溯" icon="⏪">
              <div className="glass-card p-4">
                <p className="text-sm text-[#6B6B80] leading-relaxed">{logicArmory.situationTrace}</p>
              </div>
            </TabSection>

            <TabSection title="三种话术" icon="📝">
              <div className="space-y-3">
                {logicArmory.threeScripts.map((s, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="tag-chip tag-amber">{s.style}</span>
                      <button
                        onClick={() => handleCopyScript(s.script, i)}
                        className="text-xs text-[#6B6B80] hover:text-[#14B8A6] transition-colors font-mono"
                      >
                        {copiedScript === i ? '✓ 已复制' : '复制'}
                      </button>
                    </div>
                    <p className="text-sm text-[#E8E8F0] leading-relaxed">{s.script}</p>
                  </div>
                ))}
              </div>
            </TabSection>

            <TabSection title="清晰度对比" icon="⚡">
              <div className="glass-card p-4 space-y-4">
                <div>
                  <div className="text-xs font-mono text-[#E84040] mb-1.5">// 原始表达（情绪先行）</div>
                  <div className="text-sm text-[#E8E8F0] leading-relaxed border-l-2 border-[rgba(232,64,64,0.4)] pl-3">
                    {logicArmory.clarityCompare.before}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="text-lg text-[#6B6B80]">↓</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#14B8A6] mb-1.5">// 优化表达（结构清晰）</div>
                  <div className="text-sm text-[#E8E8F0] leading-relaxed border-l-2 border-[rgba(20,184,166,0.4)] pl-3">
                    {logicArmory.clarityCompare.after}
                  </div>
                </div>
                <div className="text-xs text-center text-[#6B6B80] font-mono bg-[rgba(255,255,255,0.03)] rounded-lg py-2">
                  {logicArmory.clarityCompare.gap}
                </div>
              </div>
            </TabSection>

            <button
              onClick={() => setShowShadowBox(true)}
              className="btn-teal w-full flex items-center justify-center gap-2"
            >
              <span>⚔️</span>
              <span>开始影子对练</span>
            </button>
          </div>
        )}

        {/* ── 中立裁判 ── */}
        {activeTab === 'judge' && (
          <div className="space-y-4 animate-in">
            <TabSection title="逻辑镜像" icon="🪞">
              <div className="glass-card-active p-4">
                <p className="text-sm text-[#E8E8F0] leading-relaxed">
                  {neutralJudge.logicMirror}
                </p>
              </div>
            </TabSection>

            <TabSection title="性格深挖" icon="🧠">
              <div className="glass-card p-4">
                <p className="text-sm text-[#6B6B80] leading-relaxed">
                  {neutralJudge.personalityInsight}
                </p>
              </div>
            </TabSection>

            <TabSection title="逻辑定损" icon="📊">
              <div className="glass-card p-4 space-y-3">
                {neutralJudge.logicDamage.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-[#E8E8F0]">{d.item}</span>
                    <span className="text-sm font-mono text-[#E84040]">{d.damage}</span>
                  </div>
                ))}
              </div>
            </TabSection>

            <TabSection title="终极提问" icon="❓">
              <div className="glass-card-active p-5 border-l-4 border-[rgba(20,184,166,0.5)]">
                <p className="text-sm text-[#E8E8F0] leading-relaxed italic">
                  "{neutralJudge.ultimateQuestion}"
                </p>
              </div>
            </TabSection>
          </div>
        )}

        {/* ── 智者抽离 ── */}
        {activeTab === 'wise' && (
          <div className="space-y-4 animate-in">
            {sphereState === SPHERE_STATES.TRANSPARENT && (
              <div className="text-center mb-4">
                <span className="text-3xl">🌊</span>
                <p className="text-xs text-[#14B8A6] font-mono mt-1">已觉知</p>
              </div>
            )}
            <div className="glass-card-active p-5">
              {wiseMan.detachText.split('\n\n').map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed mb-4 last:mb-0 ${
                  para.startsWith('这不是') ? 'text-[#E8E8F0] font-medium' : 'text-[#6B6B80]'
                }`}>
                  {para}
                </p>
              ))}
            </div>

            <div className="glass-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#6B6B80] font-mono">觉知状态</div>
                <div className="text-sm text-[#14B8A6] mt-0.5">
                  {sphereState === SPHERE_STATES.TRANSPARENT ? '已坍缩 · 完全觉知' : '坍缩中...'}
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${
                sphereState === SPHERE_STATES.TRANSPARENT
                  ? 'bg-[#14B8A6] animate-pulse'
                  : 'bg-[#F59E0B] animate-pulse'
              }`} />
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 safe-bottom z-20"
        style={{ background: 'linear-gradient(to top, #09090F 70%, transparent)' }}>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // 导出报告逻辑
              alert('报告导出功能（需接入 html2canvas + jsPDF）')
            }}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 text-xs"
          >
            <span>📄</span> 导出报告
          </button>
          <button
            onClick={() => {
              // 匿名分享逻辑
              alert('匿名分享功能（需接入分享 API）')
            }}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 text-xs"
          >
            <span>🔗</span> 匿名分享
          </button>
        </div>
      </div>

      {/* 影子对练弹窗 */}
      {showShadowBox && (
        <ShadowBox
          seed={analysisResult.shadowboxSeed}
          onClose={() => setShowShadowBox(false)}
        />
      )}
    </div>
  )
}

// 通用标签页内容区组件
function TabSection({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-mono text-[#6B6B80]">{title}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * POST /api/conflict/upload
 *
 * 完整链路：
 * 1. 接收冲突文本 + 用户标识（wechat_openid）
 * 2. 调用 OpenAI 学者解构
 * 3. 写入 Supabase（users 表 + conflicts 表）
 * 4. 返回 task_id + 分析结果
 */
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Supabase 客户端（服务端只读 anon key，RLS 策略在 DB 层控制）──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ─── 从文本中提取对方名称 ───────────────────────────────────────
function extractOpponentName(text) {
  const patterns = [
    /(?:和|跟|同|与|被)(.{1,8}?)(?:的|说|吵|闹|发生|矛盾|吵架|冲突)/,
    /(?:我男|我女|我老婆|我老公|我男友|我女友|我上司|我老板|我同事|我爸|我妈|我姐|我哥|我弟|我妹|我朋友)(.{0,4}?)(?:说|骂|吵|凶|吼|凶我|骂我)/,
    /(?:跟)([^，。,.]{1,6})(?:吵|闹|说|发生)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const name = m[1].trim()
      const blocked = ['我', '他', '她', '他们', '我男', '我女', '某人', '对方', '这个', '那个', '人']
      if (!blocked.includes(name) && name.length >= 1) return name.slice(0, 6)
    }
  }
  // 备选：找 [X] 或 X: 格式
  const bracketMatch = text.match(/\[([^\]]{2,6})\]/)
  if (bracketMatch) return bracketMatch[1]
  // 备选：引号中的对话方
  const quoteMatch = text.match(/[和跟与同被][^，。,.]{0,4}([^，。,.]{2,6})说/)
  if (quoteMatch) return quoteMatch[1].trim().slice(0, 6)
  return '对方'
}

// ─── 学者解构 Prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `你是 Mirror 的「学者」人格。分析用户提交的冲突对话，输出结构化报告。</parameter>


【用户本我底色】
{user_archetype}

【冲突对话文本】
{conflict_text}

【用户自评愤怒程度】
{anger_score}/10

请严格按以下 JSON 格式输出，禁止添加额外解释：
{
 "logical_fallacies": [{"quote": "对方原话","explanation": "逻辑漏洞解释"}],
 "power_tendency": "控制型|逃避型|讨好型|平等型",
 "energy_erosion": "高|中|低",
 "bias_audit": "你的本我底色中的[某特质]被触犯，导致了[某情绪]。因为...",
 "truth_sensitivity_index": 0-100,
 "behavior_patterns": {
   "对方模式": "中性术语，如[应激性情感防御]",
   "用户模式": "中性术语，如[真相暴力]",
   "disclaimer": "此行为模式仅基于本次冲突，不代表对方全部。关系是流动的。"
 },
 "expectation_gap": {
   "expectation_value": 0-10,
   "actual_value": 0-10,
   "gap_index": 0-100,
   "advice": "智者校准建议"
 },
 "logical_damage": {
   "break_point": "原话引用",
   "conclusion": "定损描述",
   "responsibility_ratio": {"user": 0-100, "opponent": 0-100}
 },
 "shadowbox_seed": "从对话中提取的一句对方让你卡住的原话"
}

约束：禁止人格标签；本我偏差审计须引用 user_archetype 关键词（如庚金、食伤、INFP）。`

// ─── 主逻辑 ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, anger_score, user_archetype, wechat_openid } = req.body || {}
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: '冲突描述至少需要5个字符' })
  }

  const anger     = parseInt(anger_score, 10) || 5
  const archetype = user_archetype || '{ "bazi": "未知", "mbti": "未知", "visions": "暂未测评" }'
  const openid    = wechat_openid || 'anonymous_' + Date.now()
  const taskId    = crypto.randomUUID()
  const opponentName = extractOpponentName(text)

  // 1. 创建冲突记录（pending 状态）
  let conflictId
  try {
    // 确保用户存在（upsert）
    await supabase.from('users').upsert(
      { wechat_openid: openid, archetype: JSON.parse(archetype) },
      { onConflict: 'wechat_openid' }
    )
    // 写入冲突记录
    const { data: conflict, error: ciErr } = await supabase
      .from('conflicts')
      .insert({
        id:          taskId,
        wechat_openid,
        transcript:  text.slice(0, 500),
        anger_score: anger,
        status:      'processing',
        archetype:   JSON.parse(archetype),
      })
      .select('id')
      .single()

    if (ciErr) throw ciErr
    conflictId = conflict.id
  } catch (err) {
    console.error('[upload] Supabase write error:', err.message)
    // 不阻断，继续 AI 分析（降级到纯内存模式）
  }

  // 2. 调用 OpenAI 学者解构
  let raw
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT
          .replace('{user_archetype}', archetype)
          .replace('{conflict_text}', text)
          .replace('{anger_score}', String(anger)) },
        { role: 'user',   content: '请分析这段冲突：' + text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    })
    raw = JSON.parse(completion.choices[0].message.content)
  } catch (err) {
    console.error('[upload] OpenAI error:', err.message)
    return res.status(502).json({ error: 'AI 分析服务暂时不可用，请稍后重试' })
  }

  // 3. 标准化 + 构建完整 analysis（包含前端兼容字段）
  const rawFal = raw.logical_fallacies || []
  const bp     = raw.behavior_patterns  || {}
  const lg     = raw.logical_damage    || {}
  const eg     = raw.expectation_gap   || {}

  const analysis = {
    // ── Prompt 原生字段 ────────────────────────────
    logical_fallacies:       rawFal,
    power_tendency:          raw.power_tendency       || '未知',
    energy_erosion:          raw.energy_erosion      || '中',
    bias_audit:              raw.bias_audit          || '',
    truth_sensitivity_index:  raw.truth_sensitivity_index ?? 50,
    behavior_patterns:       bp,
    expectation_gap:         eg,
    logical_damage:          lg,
    shadowbox_seed:           raw.shadowbox_seed     || '',
    angerScore:               anger,

    // ── 前端兼容字段（ReportPage 使用）────────────
    scholar: {
      logicGaps: rawFal.map(f => ({ type: f.quote || '待识别', desc: f.explanation || '', severity: 2 })),
      selfBias:        raw.bias_audit || '',
      expectationGap:  eg.advice     || '',
      truthCleanliness: raw.truth_sensitivity_index ?? 50,
      behaviorPattern: `${bp['用户模式'] || ''} × ${bp['对方模式'] || ''}`.replace('×  ×', '×'),
    },
    logicArmory: {
      situationTrace: lg.break_point ? `冲突爆发点：「${lg.break_point}」` : '冲突细节待进一步还原。',
      threeScripts: [
        { style: '温柔坚定',   script: (raw.bias_audit || '') + '\n\n建议先确认感受，再表达立场。' },
        { style: '逻辑清晰',   script: lg.conclusion ? `核心问题：${lg.conclusion}` : '用事实替代情绪。' },
        { style: '共情反转',   script: eg.advice ? '「我理解你的期待，同时我也想让你知道我的想法。」' : '复述感受 + 表达需求。' },
      ],
      clarityCompare: { before: lg.break_point || text.slice(0, 30), after: eg.advice || '（建议优化后的表达）', gap: '情绪先行 → 事实 + 感受 + 需求' },
    },
    neutralJudge: {
      logicMirror:        lg.conclusion  || '试着从对方角度理解：他这样说，背后可能的诉求是什么？',
      personalityInsight: bp['对方模式'] || '对方行为模式暗示了一种内在需求或恐惧。',
      logicDamage: (lg.responsibility_ratio) ? [
        { item: '情绪稳定性', damage: lg.responsibility_ratio.user   + '%' },
        { item: '关系信任基础', damage: Math.round(lg.responsibility_ratio.opponent * 0.5) + '%' },
      ] : [{ item: '关系稳定性', damage: '待评估' }],
      ultimateQuestion: eg.advice ? '如果你说出真实想法，最坏的结果是什么？这个结果真的无法承受吗？' : '在关系中，你最害怕失去的是什么？',
    },
    wiseMan: {
      detachText: `${raw.bias_audit || '每一次冲突都是照见自己的机会。'} ${eg.advice || ''} 你可以选择继续争辩对错，也可以选择停下来，深呼吸，然后问自己：「我真正想要的是什么？」`,
      collapseState: 'pending',
    },

    conflictSummary: text.trim().slice(0, 30) + (text.length > 30 ? '…' : ''),
    opponentName: opponentName,
    transcript: text.slice(0, 100),
  }

  // 4. 写入 Supabase（更新冲突记录，标记为 completed）
  if (conflictId) {
    try {
      await supabase
        .from('conflicts')
        .update({
          status:           'completed',
          analysis_result:  analysis,
          shadowbox_seed:   raw.shadowbox_seed || '',
          updated_at:       new Date().toISOString(),
        })
        .eq('id', conflictId)
    } catch (err) {
      console.error('[upload] Supabase update error:', err.message)
    }
  }

  console.log(`[upload] task=${taskId} anger=${anger} tendency=${analysis.power_tendency} supabase=${!!conflictId}`)

  // 5. 返回
  res.status(200).json({
    task_id:    taskId,
    status:     'completed',
    analysis,
    angerScore: anger,
    conflictSummary: analysis.conflictSummary,
    opponentName: opponentName,
  })
}
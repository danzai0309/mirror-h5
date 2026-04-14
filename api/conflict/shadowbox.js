/**
 * POST /api/conflict/shadowbox
 * 影子对练：用户给出回复 → AI 评分 + 优化建议 → 存入 Supabase
 */
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const SYSTEM_PROMPT = `你是 Mirror 的「影子陪练师」。

对方在冲突中说过一句让你卡住的话：
「{original_quote}」

用户打算这样回复：
「{user_reply}」

请从以下维度评分（0-100），并给出优化建议和优化后的回复：
{
 "score": 0-100,
 "dimension_scores": {
   "clarity":   "清晰度 0-25",
   "firmness":  "坚定度 0-25",
   "empathy":   "共情度 0-25",
   "strategic": "策略性 0-25"
 },
 "strength":    "用户回复中做得好的1-2点",
 "weakness":    "用户回复中需要改进的1-2点",
 "suggestion":  "具体的改进建议",
 "revised_reply": "优化后的完整回复（保持原意，更有效）"
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { original_quote, user_reply, conflict_id, wechat_openid } = req.body || {}
  if (!original_quote || !user_reply) {
    return res.status(400).json({ error: 'original_quote 和 user_reply 是必填项' })
  }

  let aiResult
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT
          .replace('{original_quote}', original_quote)
          .replace('{user_reply}', user_reply) },
        { role: 'user',   content: '请评价我的回复并给出建议。' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    aiResult = JSON.parse(completion.choices[0].message.content)
  } catch (err) {
    console.error('[shadowbox] OpenAI error:', err.message)
    return res.status(502).json({ error: '影子对练服务暂时不可用' })
  }

  // 存入 Supabase
  if (conflict_id) {
    try {
      await supabase.from('shadowbox_sessions').insert({
        conflict_id,
        wechat_openid: wechat_openid || 'anonymous',
        original_quote: original_quote,
        user_reply:      user_reply,
        score:           aiResult.score,
        suggestion:      aiResult.suggestion,
        revised_reply:   aiResult.revised_reply,
      })
    } catch (err) {
      console.warn('[shadowbox] Supabase insert error:', err.message)
      // 不阻断，AI 已返回结果
    }
  }

  console.log(`[shadowbox] conflict=${conflict_id || '?'} score=${aiResult.score}`)

  res.status(200).json({
    conflict_id,
    score:           aiResult.score,
    dimension_scores: aiResult.dimension_scores,
    strength:         aiResult.strength     || '',
    weakness:         aiResult.weakness     || '',
    suggestion:       aiResult.suggestion   || '',
    revised_reply:    aiResult.revised_reply || user_reply,
  })
}
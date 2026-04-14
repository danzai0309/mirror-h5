/**
 * GET /api/conflict/status?task_id=xxx
 * GET /api/conflict/status?share_id=xxx
 *
 * 从 Supabase 查询冲突分析结果（serverless 环境无状态，永久查询 DB）
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task_id, share_id } = req.query || {}
  if (!task_id && !share_id) {
    return res.status(400).json({ error: 'task_id 或 share_id 是必填项' })
  }

  try {
    let result

    if (share_id) {
      // 分享链接查询（从冲突记录中找 share_id）
      const { data, error } = await supabase
        .from('conflicts')
        .select('id, status, analysis_result, transcript, anger_score, created_at')
        .eq('share_id', share_id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return res.status(404).json({ error: '分享已过期或不存在' })
      }
      result = {
        status:     data.status,
        share_id,
        task_id:    data.id,
        analysis:   data.analysis_result || {},
        transcript: data.transcript,
        angerScore: data.anger_score,
        createdAt:  data.created_at,
      }
    } else {
      // 直接任务ID查询
      const { data, error } = await supabase
        .from('conflicts')
        .select('id, status, analysis_result, transcript, anger_score, created_at')
        .eq('id', task_id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return res.status(404).json({ error: '未找到对应的分析报告' })
      }
      result = {
        status:     data.status,
        task_id:    data.id,
        analysis:   data.analysis_result || {},
        transcript: data.transcript,
        angerScore: data.anger_score,
        createdAt:  data.created_at,
      }
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(result)
  } catch (err) {
    console.error('[status] error:', err.message)
    res.status(500).json({ error: '查询失败，请稍后重试' })
  }
}
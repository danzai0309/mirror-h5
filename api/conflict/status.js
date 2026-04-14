/**
 * GET /api/conflict/status?task_id=xxx
 * GET /api/conflict/status?share_id=xxx
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task_id, share_id } = req.query || {}

  if (!task_id && !share_id) {
    return res.status(400).json({ error: 'task_id 或 share_id 是必填项' })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    // service_role key 绕过 RLS，确保匿名用户也能读取报告
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
    )

    let data, error

    if (share_id) {
      ({ data, error } = await sb
        .from('conflicts')
        .select('id, status, analysis_result, transcript, anger_score, created_at')
        .eq('share_id', share_id)
        .maybeSingle())
    } else {
      ({ data, error } = await sb
        .from('conflicts')
        .select('id, status, analysis_result, transcript, anger_score, created_at')
        .eq('id', task_id)
        .maybeSingle())
    }

    if (error) {
      console.error('[status] DB error:', error.message)
      return res.status(500).json({ error: '数据库查询失败', detail: error.message })
    }
    if (!data) {
      return res.status(404).json({ error: '未找到对应的分析报告' })
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      status:     data.status,
      task_id:    data.id,
      share_id:   data.share_id || null,
      analysis:   data.analysis_result || {},
      transcript: data.transcript || '',
      angerScore: data.anger_score,
      createdAt:  data.created_at,
    })
  } catch (err) {
    console.error('[status] error:', err.message)
    res.status(500).json({ error: '服务器内部错误', detail: err.message })
  }
}

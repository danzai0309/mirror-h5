/**
 * POST /api/conflict/share
 *
 * 将分析结果存入 Supabase 并生成匿名分享链接
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task_id, analysis } = req.body || {}
  if (!task_id) {
    return res.status(400).json({ error: 'task_id 是必填项' })
  }

  const shareId = 'm' + task_id.replace(/-/g, '').slice(0, 12)
  const shareUrl = `https://mirror-h5.vercel.app/share/${shareId}`

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
    )

    const { error: updateErr } = await sb
      .from('conflicts')
      .update({ share_id: shareId })
      .eq('id', task_id)

    if (updateErr) {
      console.warn('[share] could not update share_id:', updateErr.message)
    }

    console.log(`[share] shareId=${shareId} task_id=${task_id}`)
    res.status(200).json({ share_url: shareUrl, share_id: shareId })
  } catch (err) {
    console.error('[share] error:', err.message)
    res.status(500).json({ error: '分享生成失败' })
  }
}

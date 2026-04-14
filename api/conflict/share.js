/**
 * POST /api/conflict/share
 *
 * 将分析结果存入 Supabase 并生成匿名分享链接
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task_id, analysis } = req.body || {}
  if (!task_id) {
    return res.status(400).json({ error: 'task_id 是必填项' })
  }

  // 生成分享ID（短码）
  const shareId = 'm' + task_id.replace(/-/g, '').slice(0, 12)
  const shareUrl = `https://mirror-h5.vercel.app/share/${shareId}`

  try {
    // 将 share_id 写回冲突记录（方便 status API 通过 share_id 查询）
    const { error: updateErr } = await supabase
      .from('conflicts')
      .update({ share_id: shareId })
      .eq('id', task_id)

    if (updateErr) {
      console.warn('[share] could not update share_id in conflicts:', updateErr.message)
    }

    console.log(`[share] shareId=${shareId} task_id=${task_id}`)

    res.status(200).json({
      share_url: shareUrl,
      share_id:  shareId,
    })
  } catch (err) {
    console.error('[share] error:', err.message)
    res.status(500).json({ error: '分享生成失败' })
  }
}
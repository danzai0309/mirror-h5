/**
 * POST /api/conflict/echo
 * 回向监测：用户发送负面反馈时，返回即时护盾文案
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id, opponent_name, feedback_type } = req.body

    if (!user_id || !opponent_name || !feedback_type) {
      return res.status(400).json({ error: 'user_id, opponent_name, feedback_type are required' })
    }

    // 正式环境：从数据库读取关系数据 + 调用 GPT 生成护盾文案
    // const { data: relationship } = await supabase
    //   .from('relationship_impact')
    //   .select('*')
    //   .eq('user_id', user_id)
    //   .eq('opponent_name', opponent_name)
    //   .single()
    // const { data: recentConflicts } = await supabase
    //   .from('conflicts')
    //   .select('*')
    //   .eq('user_id', user_id)
    //   .order('created_at', { ascending: false })
    //   .limit(3)
    // 调用 GPT 生成护盾...

    const shields = {
      negative: [
        `告诉他：这不是在分析你，是在分析我们之间的沟通频率——我们每次聊到这个话题都会陷入同一个循环，这才是我想打破的。`,
        `与其说是「你有问题」，不如说「我们的互动模式有问题」。这不是针对你，而是我们都需要跳出这个僵局。`,
        `我知道这些话听起来像在评判你，但其实我只是在描述一种反复出现的感受——我愿意改变我的部分，也期待你能看见我的努力。`,
      ],
      positive: [
        `你的回应让我感受到我们的关系在进步，谢谢你愿意一起改变。`,
      ],
    }

    const pool = shields[feedback_type] || shields.negative
    const shieldMessage = pool[Math.floor(Math.random() * pool.length)]

    console.log('[echo] user:', user_id, 'opponent:', opponent_name, 'type:', feedback_type)

    res.status(200).json({ shield_message: shieldMessage })
  } catch (error) {
    console.error('[echo] error:', error)
    res.status(500).json({ error: 'Failed to generate shield message' })
  }
}

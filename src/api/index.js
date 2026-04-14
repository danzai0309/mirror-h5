const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * 上传冲突（语音或文字）
 * @param {{ audio?: File, text?: string, angerScore: number }} payload
 * @returns {{ taskId: string, status: string }}
 */
export async function uploadConflict(payload) {
  const formData = new FormData()
  if (payload.audio) formData.append('audio', payload.audio)
  if (payload.text) formData.append('text', payload.text)
  formData.append('anger_score', String(payload.angerScore))

  const res = await fetch(`${BASE_URL}/conflict/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * 查询冲突分析状态
 * @param {string} taskId
 * @returns {{ status: 'pending'|'processing'|'completed'|'failed', result?: object }}
 */
export async function getConflictStatus(taskId) {
  const res = await fetch(`${BASE_URL}/conflict/status?task_id=${taskId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * 影子对练
 * @param {{ originalQuote: string, userReply: string }} payload
 * @returns {{ score: number, suggestion: string, revisedReply: string }}
 */
export async function shadowbox(payload) {
  const res = await fetch(`${BASE_URL}/conflict/shadowbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * 生成匿名分享
 * @param {{ taskId: string, mode?: 'anonymous' }} payload
 * @returns {{ shareUrl: string }}
 */
export async function shareConflict(payload) {
  const res = await fetch(`${BASE_URL}/conflict/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * 回向监测
 * @param {{ userId: string, opponentName: string, feedbackType: 'positive'|'negative' }} payload
 * @returns {{ shieldMessage: string }}
 */
export async function echoCheck(payload) {
  const res = await fetch(`${BASE_URL}/conflict/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

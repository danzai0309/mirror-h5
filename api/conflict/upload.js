import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body || {}

  console.log('[upload] START', new Date().toISOString())
  console.log('[upload] text:', text ? text.slice(0, 30) : 'EMPTY')

  // 测试 OpenAI
  let aiResult = null
  let aiError = null
  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'test' })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'say hello in 3 words' }],
      max_tokens: 20,
    })
    aiResult = completion.choices[0]?.message?.content
    console.log('[upload] OpenAI OK:', aiResult)
  } catch (err) {
    aiError = err.message
    console.error('[upload] OpenAI FAIL:', aiError)
  }

  // 测试 Supabase
  let supabaseResult = null
  let supabaseError = null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_KEY || 'placeholder'
    )
    const { data, error } = await sb.from('users').select('count').limit(1)
    supabaseResult = { data, error: error?.message }
    console.log('[upload] Supabase OK:', JSON.stringify(supabaseResult))
  } catch (err) {
    supabaseError = err.message
    console.error('[upload] Supabase FAIL:', supabaseError)
  }

  const taskId = crypto.randomUUID()
  res.status(200).json({
    task_id: taskId,
    status: 'completed',
    text_preview: text ? text.slice(0, 50) : 'NO_TEXT',
    ai: { result: aiResult, error: aiError },
    supabase: supabaseResult,
    env: {
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_supabase_key: !!process.env.SUPABASE_KEY,
      node_version: process.version,
    },
  })
}

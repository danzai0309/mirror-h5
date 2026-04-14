-- 补充字段（如果尚未运行完整 SQL，先执行这一段）
ALTER TABLE public.conflicts ADD COLUMN IF NOT EXISTS wechat_openid TEXT;
ALTER TABLE public.conflicts ADD COLUMN IF NOT EXISTS share_id TEXT;
ALTER TABLE public.conflicts ADD COLUMN IF NOT EXISTS archetype JSONB;

-- 补充索引
CREATE INDEX IF NOT EXISTS idx_conflicts_share_id ON public.conflicts(share_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_wechat_openid ON public.conflicts(wechat_openid);

-- 公开插入策略（如果之前没运行）
DROP POLICY IF EXISTS "public_conflicts_insert" ON public.conflicts;
CREATE POLICY "public_conflicts_insert" ON public.conflicts FOR INSERT WITH CHECK (true);
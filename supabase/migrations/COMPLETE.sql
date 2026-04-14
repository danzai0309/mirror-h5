-- ============================================================
-- Mirror MVP · Supabase 完整建表脚本（v2 含所有字段）
-- Supabase Dashboard → SQL Editor → New query → 粘贴执行
-- ============================================================

-- 1. 用户表
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname      TEXT,
  archetype     JSONB,  -- { bazi, mbti, visions }
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 冲突事件表（核心）
DROP TABLE IF EXISTS public.conflicts CASCADE;
CREATE TABLE public.conflicts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.users(id) ON DELETE CASCADE,
  wechat_openid    TEXT,                              -- 微信标识（冗余字段，方便直接查询）
  share_id         TEXT,                              -- 分享短码（m+12位）
  transcript       TEXT,                              -- 冲突原文
  anger_score      INT CHECK (anger_score BETWEEN 1 AND 10),
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','completed','failed')),
  analysis_result  JSONB,                             -- 学者解构完整输出
  shadowbox_seed   TEXT,                             -- 影子对练种子："让你卡住的那句话"
  archetype        JSONB,                             -- 用户本我底色快照
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 3. 影子对练会话表
DROP TABLE IF EXISTS public.shadowbox_sessions CASCADE;
CREATE TABLE public.shadowbox_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  conflict_id     UUID REFERENCES public.conflicts(id) ON DELETE CASCADE,
  wechat_openid   TEXT,
  original_quote  TEXT NOT NULL,                     -- "对方让你卡住的原话"
  user_reply      TEXT NOT NULL,                     -- 用户打算怎么回
  score           INT CHECK (score BETWEEN 0 AND 100),
  suggestion      TEXT,                               -- 优化建议
  revised_reply   TEXT,                               -- 优化后的回复
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. 关系影响追踪表
DROP TABLE IF EXISTS public.relationship_impact CASCADE;
CREATE TABLE public.relationship_impact (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  wechat_openid             TEXT,
  opponent_name            TEXT NOT NULL,
  behavior_patterns_history JSONB DEFAULT '[]',
  expectation_gap_history   JSONB DEFAULT '[]',
  last_conflict_at         TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opponent_name)
);

-- 5. 索引
CREATE INDEX idx_conflicts_user_id     ON public.conflicts(user_id);
CREATE INDEX idx_conflicts_status       ON public.conflicts(status);
CREATE INDEX idx_conflicts_share_id     ON public.conflicts(share_id);
CREATE INDEX idx_conflicts_wechat_openid ON public.conflicts(wechat_openid);
CREATE INDEX idx_shadowbox_user_id     ON public.shadowbox_sessions(user_id);
CREATE INDEX idx_shadowbox_conflict_id ON public.shadowbox_sessions(conflict_id);
CREATE INDEX idx_relationship_user_id  ON public.relationship_impact(user_id);

-- 6. 启用行级安全（演示阶段全部公开）
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowbox_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_impact ENABLE ROW LEVEL SECURITY;

-- 7. 公开访问策略（生产环境请替换为 auth.uid() 策略）
DROP POLICY IF EXISTS "public_users_insert" ON public.users;
DROP POLICY IF EXISTS "public_users_select" ON public.users;
CREATE POLICY "public_users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "public_users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "public_users_upsert"  ON public.users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "public_conflicts_insert" ON public.conflicts;
DROP POLICY IF EXISTS "public_conflicts_select" ON public.conflicts;
DROP POLICY IF EXISTS "public_conflicts_update" ON public.conflicts;
CREATE POLICY "public_conflicts_insert" ON public.conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_conflicts_select" ON public.conflicts FOR SELECT USING (true);
CREATE POLICY "public_conflicts_update" ON public.conflicts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "public_shadowbox_insert" ON public.shadowbox_sessions;
DROP POLICY IF EXISTS "public_shadowbox_select" ON public.shadowbox_sessions;
CREATE POLICY "public_shadowbox_insert" ON public.shadowbox_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_shadowbox_select" ON public.shadowbox_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_relationship_upsert" ON public.relationship_impact;
DROP POLICY IF EXISTS "public_relationship_select" ON public.relationship_impact;
CREATE POLICY "public_relationship_upsert"  ON public.relationship_impact FOR INSERT WITH CHECK (true);
CREATE POLICY "public_relationship_update" ON public.relationship_impact FOR UPDATE USING (true);
CREATE POLICY "public_relationship_select" ON public.relationship_impact FOR SELECT USING (true);

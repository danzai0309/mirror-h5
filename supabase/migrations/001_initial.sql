-- ============================================================
-- Mirror MVP · Supabase 初始迁移
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- ============================================================

-- 1. 用户表（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname      TEXT,
  archetype     JSONB, -- { bazi, mbti, visions }
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 冲突事件表
CREATE TABLE IF NOT EXISTS public.conflicts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  audio_url        TEXT, -- Supabase Storage 路径
  transcript       TEXT,
  anger_score      INT CHECK (anger_score BETWEEN 1 AND 10),
  status           TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
  analysis_result  JSONB, -- 学者解构完整输出
  shadowbox_seed   TEXT, -- 从对话中提取的"卡住你的原话"
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 3. 影子对练会话表
CREATE TABLE IF NOT EXISTS public.shadowbox_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conflict_id     UUID NOT NULL REFERENCES public.conflicts(id) ON DELETE CASCADE,
  original_quote  TEXT NOT NULL,
  user_reply      TEXT NOT NULL,
  score           INT CHECK (score BETWEEN 0 AND 100),
  suggestion      TEXT,
  revised_reply   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. 关系影响追踪表（动态行为模式）
CREATE TABLE IF NOT EXISTS public.relationship_impact (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opponent_name            TEXT NOT NULL,
  behavior_patterns_history JSONB DEFAULT '[]',
  expectation_gap_history  JSONB DEFAULT '[]',
  last_conflict_at         TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opponent_name)
);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_conflicts_user_id     ON public.conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status      ON public.conflicts(status);
CREATE INDEX IF NOT EXISTS idx_shadowbox_user_id     ON public.shadowbox_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_user_id  ON public.relationship_impact(user_id);

-- 6. 启用行级安全（RLS）
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadowbox_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_impact ENABLE ROW LEVEL SECURITY;

-- 7. RLS 策略：用户只能读写自己的数据
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "conflicts_select_own" ON public.conflicts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conflicts_insert_own" ON public.conflicts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shadowbox_select_own" ON public.shadowbox_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shadowbox_insert_own" ON public.shadowbox_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "relationship_select_own" ON public.relationship_impact
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "relationship_upsert_own" ON public.relationship_impact
  FOR ALL USING (auth.uid() = user_id);

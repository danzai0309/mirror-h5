import { useEffect, useRef, useState } from 'react'

// 状态枚举
export const SPHERE_STATES = {
  IDLE: 'IDLE',
  ANXIOUS: 'ANXIOUS',
  TRANSITION: 'TRANSITION',
  COLLAPSING: 'COLLAPSING',
  TRANSPARENT: 'TRANSPARENT',
}

/**
 * 状态球 Canvas 动画组件
 * @param {string} state - SPHERE_STATES 之一
 * @param {number} angerScore - 愤怒指数 1-10
 * @param {number} progress - 动画进度 0-1
 * @param {number} size - 画布尺寸 (px)
 */
export default function StatusSphere({ state, angerScore = 5, progress = 0, size = 200 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const timeRef = useRef(0)
  const [displayState, setDisplayState] = useState(state)
  const [transitionProgress, setTransitionProgress] = useState(progress)

  // 监听状态切换
  useEffect(() => {
    if (state !== displayState) {
      setDisplayState(state)
      setTransitionProgress(0)
    }
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const w = size
      const h = size
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2

      timeRef.current += 0.016
      const t = timeRef.current

      if (displayState === SPHERE_STATES.ANXIOUS) {
        // 红色焦虑态：球体抖动 + 脉冲
        const jitter = Math.sin(t * 12) * 3 + Math.sin(t * 7.3) * 2
        const pulse = 1 + Math.sin(t * 4) * 0.04
        const baseR = (w * 0.32) * pulse
        const r = Math.max(8, baseR + jitter)

        // 外层光晕
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.2)
        glow.addColorStop(0, `rgba(232, 64, 64, ${0.25 + Math.sin(t * 4) * 0.1})`)
        glow.addColorStop(1, 'rgba(232, 64, 64, 0)')
        ctx.beginPath()
        ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // 主球体（径向渐变）
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
        grad.addColorStop(0, '#FF8080')
        grad.addColorStop(0.4, '#E84040')
        grad.addColorStop(1, '#7A1A1A')
        ctx.beginPath()
        ctx.arc(cx + jitter, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // 镜面高光
        ctx.beginPath()
        ctx.arc(cx - r * 0.28 + jitter, cy - r * 0.28, r * 0.22, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.22)'
        ctx.fill()

        // 焦虑裂缝纹理（模拟碎裂感）
        const crackCount = Math.floor(angerScore / 3)
        ctx.save()
        ctx.globalAlpha = 0.18
        ctx.strokeStyle = '#FF6060'
        ctx.lineWidth = 1
        for (let i = 0; i < crackCount; i++) {
          const angle = (i / crackCount) * Math.PI * 2 + t * 0.3
          const len = r * 0.5
          ctx.beginPath()
          ctx.moveTo(cx + jitter, cy)
          ctx.lineTo(cx + jitter + Math.cos(angle) * len, cy + Math.sin(angle) * len)
          ctx.stroke()
        }
        ctx.restore()

      } else if (displayState === SPHERE_STATES.TRANSITION) {
        // 过渡态：红→青，颜色平滑渐变
        const blend = (Math.sin(t * 2) + 1) / 2
        const blendedR = w * 0.32 * (1 + Math.sin(t * 3) * 0.03)

        const glow = ctx.createRadialGradient(cx, cy, blendedR * 0.5, cx, cy, blendedR * 2)
        glow.addColorStop(0, `rgba(${20 + 212 * blend}, ${184 - 30 * blend}, ${166 + 44 * blend}, 0.35)`)
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(cx, cy, blendedR * 2, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        const grad = ctx.createRadialGradient(cx - blendedR * 0.3, cy - blendedR * 0.3, 0, cx, cy, blendedR)
        grad.addColorStop(0, `rgb(${Math.round(255 - 235 * blend)}, ${Math.round(128 - 56 * blend)}, ${Math.round(128 + 38 * blend)})`)
        grad.addColorStop(1, `rgb(${Math.round(122 + 30 * blend)}, ${Math.round(26 - 20 * blend)}, ${Math.round(26 + 40 * blend)})`)
        ctx.beginPath()
        ctx.arc(cx, cy, blendedR, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // 旋转光环
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = `rgba(${Math.round(34 + 200 * blend)}, ${Math.round(211 + 0 * blend)}, ${Math.round(238 - 72 * blend)}, 0.6)`
        ctx.lineWidth = 1.5
        ctx.setLineDash([8, 8])
        ctx.lineDashOffset = -t * 20
        ctx.beginPath()
        ctx.arc(cx, cy, blendedR * 1.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

      } else if (displayState === SPHERE_STATES.COLLAPSING) {
        // 坍缩态：缩小+消散
        const collapsedProg = Math.min(transitionProgress, 1)
        const scale = Math.max(0.05, 1 - collapsedProg * 0.85)
        const opacity = Math.max(0, 1 - collapsedProg * 1.2)
        const r = w * 0.32 * scale

        // 青色光晕（变淡）
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.5)
        glow.addColorStop(0, `rgba(20, 184, 166, ${0.3 * opacity})`)
        glow.addColorStop(1, 'rgba(20, 184, 166, 0)')
        ctx.beginPath()
        ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // 渐变为空心圆
        const grad = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r)
        grad.addColorStop(0, `rgba(20, 184, 166, 0)`)
        grad.addColorStop(0.7, `rgba(34, 211, 238, ${0.3 * opacity})`)
        grad.addColorStop(1, `rgba(20, 184, 166, ${0.6 * opacity})`)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

      } else if (displayState === SPHERE_STATES.TRANSPARENT) {
        // 透明态：空心圆，淡蓝描边
        const r = w * 0.32
        const breathe = 1 + Math.sin(t * 1.5) * 0.02

        // 外层微光
        const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6)
        glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)')
        glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
        ctx.beginPath()
        ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // 空心圆描边
        ctx.beginPath()
        ctx.arc(cx, cy, r * breathe, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 内环
        ctx.beginPath()
        ctx.arc(cx, cy, r * 0.5 * breathe, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)'
        ctx.lineWidth = 1
        ctx.stroke()

      } else {
        // IDLE：深色静默球体
        const r = w * 0.32
        const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8)
        glow.addColorStop(0, 'rgba(107, 107, 128, 0.2)')
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
        grad.addColorStop(0, '#4A4A60')
        grad.addColorStop(1, '#1A1A28')
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [displayState, angerScore, size, transitionProgress])

  // 更新坍缩进度
  useEffect(() => {
    if (displayState === SPHERE_STATES.COLLAPSING) {
      const interval = setInterval(() => {
        setTransitionProgress(p => {
          if (p >= 1) {
            clearInterval(interval)
            return 1
          }
          return Math.min(1, p + 0.02)
        })
      }, 30)
      return () => clearInterval(interval)
    }
  }, [displayState])

  return (
    <div className="sphere-container" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  )
}

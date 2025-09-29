'use client'

import { useEffect, useRef } from 'react'

type Props = {
  highlight?: { x: number; y: number }
  className?: string
}

export default function NeuralFlowCanvas({ highlight = { x: 0.7, y: 0.4 }, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d', { alpha: true })!
    const DPR = Math.min(2, window.devicePixelRatio || 1)

    let w = 0, h = 0
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      w = Math.max(1, Math.floor((rect?.width || window.innerWidth)))
      h = Math.max(1, Math.floor((rect?.height || window.innerHeight)))
      canvas.width = Math.floor(w * DPR)
      canvas.height = Math.floor(h * DPR)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const BASE = '#0A122A'
    const FOG = 'rgba(22,28,43,0.30)'
    const HLC = 'rgba(41,227,255,0.60)'

    const NUM = Math.max(120, Math.floor((w * h) / 16000))
    const cx = w * 0.5, cy = h * 0.5

    type P = { x:number; y:number; vx:number; vy:number; life:number; max:number }
    const particles: P[] = Array.from({ length: NUM }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0, vy: 0,
      life: 0,
      max: 400 + Math.random() * 400,
    }))

    const drawGrain = () => {
      const grainAlpha = 0.06
      ctx.globalAlpha = grainAlpha
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * w, y = Math.random() * h
        ctx.fillStyle = 'white'
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.globalAlpha = 1
    }

    // highlight line disabled per design

    let t = 0
    const loop = () => {
      ctx.fillStyle = BASE
      ctx.fillRect(0, 0, w, h)
      const grd = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.1, cx, cy, Math.max(w, h) * 0.9)
      grd.addColorStop(0, 'rgba(255,255,255,0.02)')
      grd.addColorStop(1, FOG)
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      for (let p of particles) {
        const dx = cx - p.x, dy = cy - p.y
        const dist = Math.hypot(dx, dy) + 0.0001
        const attract = 0.012
        const swirl = 0.006
        const nx = -dy / dist, ny = dx / dist

        p.vx += dx * attract / dist + nx * swirl
        p.vy += dy * attract / dist + ny * swirl

        p.vx *= 0.985
        p.vy *= 0.985

        p.x += p.vx
        p.y += p.vy

        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.0, 0, Math.PI * 2)
        ctx.fill()

        p.life++
        if (p.life > p.max || p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) {
          p.x = Math.random() * w
          p.y = Math.random() * h
          p.vx = p.vy = 0
          p.life = 0
          p.max = 400 + Math.random() * 400
        }
      }
      ctx.restore()

      // highlight line disabled per design

      drawGrain()

      t++
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [highlight.x, highlight.y])

  return <canvas ref={ref} className={className} />
}



'use client'
import { useEffect } from 'react'

export default function StageScaler() {
  useEffect(() => {
    const frame = document.getElementById('frame')
    if (!frame) return

    const fit = () => {
      const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900)
      frame.style.transform = `scale(${s})`
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return null
}
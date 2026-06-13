'use client'
import { useEffect } from 'react'

export default function StageScaler() {
  useEffect(() => {
    const frame = document.getElementById('frame')
    if (frame) frame.style.transform = 'none'
  }, [])
  return null
}
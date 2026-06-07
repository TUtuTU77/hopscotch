'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

function Sparkle({ size = 16, color = 'var(--accent)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2c.5 4.2 1.8 5.5 6 6-4.2.5-5.5 1.8-6 6-.5-4.2-1.8-5.5-6-6 4.2-.5 5.5-1.8 6-6z" opacity="0.95"/>
      <path d="M18.5 13.5c.25 2 .9 2.6 3 3-2.1.4-2.75 1-3 3-.25-2-.9-2.6-3-3 2.1-.4 2.75-1 3-3z" opacity="0.7"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="screen" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="glass" style={{
        width: 400,
        padding: '38px 36px',
        textAlign: 'center',
        animation: 'screenIn .6s cubic-bezier(.2,.8,.25,1)',
      }}>

        <div style={{ fontFamily: 'var(--display)', fontSize: 34, fontWeight: 400, letterSpacing: '0.01em' }}>
          Hopscotch
        </div>

        <div style={{
          fontFamily: 'var(--script)',
          fontSize: 21,
          marginTop: 8,
          color: 'rgba(199,107,64,0.82)',
          lineHeight: 1.1,
        }}>
          Travel Until You Are New
        </div>

        <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0 4px' }}>
          <Sparkle size={24} color="rgba(212,119,74,0.75)" />
        </div>

        <div style={{ height: 16 }} />

        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12,
              color: 'rgba(180,60,60,0.9)',
              background: 'rgba(255,220,220,0.15)',
              border: '0.5px solid rgba(180,60,60,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            className="cta"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 6, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
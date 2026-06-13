'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { I } from './Icons'

export default function Navbar() {
  const router      = useRouter()
  const pathname    = usePathname()
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isGlobe   = pathname === '/'
  const isJournal = pathname.startsWith('/journal')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  /* ── 手机布局 ── */
  if (mobile) {
    return (
      <div className="navbar" style={{ justifyContent:'space-between', padding:'0 14px', gap:0 }}>
        <div className="nav-logo" style={{ fontSize:16 }} onClick={() => router.push('/')}>
          Hopscotch
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button onClick={() => router.push('/')}
            style={{ background:'transparent', border:'none', cursor:'pointer',
              padding:'6px 8px', borderRadius:8, display:'flex', alignItems:'center', gap:4,
              color: isGlobe ? 'var(--text)' : 'var(--muted)',
              borderBottom: isGlobe ? '1.5px solid var(--hover-glow)' : '1.5px solid transparent',
              fontFamily:'var(--sans)', fontSize:13 }}>
            Globe
          </button>
          <button onClick={() => router.push('/journal')}
            style={{ background:'transparent', border:'none', cursor:'pointer',
              padding:'6px 8px', borderRadius:8, display:'flex', alignItems:'center', gap:4,
              color: isJournal ? 'var(--text)' : 'var(--muted)',
              borderBottom: isJournal ? '1.5px solid var(--hover-glow)' : '1.5px solid transparent',
              fontFamily:'var(--sans)', fontSize:13 }}>
            Journal
          </button>
          <button className="pill-new" onClick={() => router.push('/new')}
            style={{ padding:'6px 12px', fontSize:12 }}>
            <I.plus size={13} sw={2} /> New
          </button>
          <button onClick={handleLogout}
            style={{ background:'transparent', border:'none', cursor:'pointer',
              width:32, height:32, borderRadius:'50%', display:'flex',
              alignItems:'center', justifyContent:'center', color:'var(--muted)' }}
            title="Sign out">
            <I.logout size={15} stroke="var(--muted)" />
          </button>
        </div>
      </div>
    )
  }

  /* ── 桌面布局 ── */
  return (
    <div className="navbar">
      <div className="nav-logo" onClick={() => router.push('/')}>Hopscotch</div>
      <span style={{
        fontFamily:'var(--script)', fontSize:17, color:'rgba(199,107,64,0.82)',
        marginLeft:18, whiteSpace:'nowrap', transform:'translateY(2px)', display:'inline-block',
      }}>
        Travel Until You Are New
      </span>
      <div style={{ flex:1 }} />
      <div style={{ display:'flex', gap:22, alignItems:'center', marginRight:8 }}>
        <span className={'nav-link' + (isGlobe   ? ' active' : '')} onClick={() => router.push('/')}>Globe</span>
        <span className={'nav-link' + (isJournal ? ' active' : '')} onClick={() => router.push('/journal')}>Journal</span>
      </div>
      <button className="pill-new" onClick={() => router.push('/new')}>
        <I.plus size={14} sw={2} /> New
      </button>
      <button onClick={handleLogout} className="gbtn" title="Sign out"
        style={{ marginLeft:8, padding:0, borderRadius:'50%', width:36, height:36, justifyContent:'center' }}>
        <I.logout size={16} />
      </button>
    </div>
  )
}
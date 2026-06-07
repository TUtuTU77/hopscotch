'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { I } from './Icons'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()

  const isGlobe   = pathname === '/'
  const isJournal = pathname.startsWith('/journal')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="navbar">
      <div className="nav-logo" onClick={() => router.push('/')}>Hopscotch</div>
      <span style={{
        fontFamily: 'var(--script)', fontSize: 17, color: 'rgba(199,107,64,0.82)',
        marginLeft: 18, whiteSpace: 'nowrap', transform: 'translateY(2px)', display: 'inline-block',
      }}>
        Travel Until You Are New
      </span>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 22, alignItems: 'center', marginRight: 8 }}>
        <span className={'nav-link' + (isGlobe ? ' active' : '')} onClick={() => router.push('/')}>
          Globe
        </span>
        <span className={'nav-link' + (isJournal ? ' active' : '')} onClick={() => router.push('/journal')}>
          Journal
        </span>
      </div>
      <button className="pill-new" onClick={() => router.push('/new')}>
        <I.plus size={14} sw={2} /> New
      </button>
      <button onClick={handleLogout} className="gbtn" title="Sign out"
        style={{ marginLeft: 8, padding: 0, borderRadius: '50%', width: 36, height: 36, justifyContent: 'center' }}>
        <I.logout size={16} />
      </button>
    </div>
  )
}
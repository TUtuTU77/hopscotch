'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import { I } from './Icons'

const ALL_TAGS = [
  'Nature', 'Food & Dining', 'Landmarks', 'Culture & Arts', 'Shopping',
  'Beach & Sea', 'Hiking', 'Nightlife', 'Journey', 'Stay', 'Festival', 'Slow Travel',
]

const TAG_CLASS = {
  'Nature':        'tag-nature',
  'Food & Dining': 'tag-food',
  'Landmarks':     'tag-landmark',
  'Culture & Arts':'tag-culture',
  'Hiking':        'tag-hiking',
  'Beach & Sea':   'tag-beach',
  'Shopping':      'tag-shopping',
  'Nightlife':     'tag-night',
  'Journey':       'tag-journey',
  'Stay':          'tag-stay',
  'Festival':      'tag-festival',
  'Slow Travel':   'tag-slow',
}

function formatDate(start, end) {
  if (!start) return ''
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = new Date(start)
  if (!end) return `${M[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`
  const e = new Date(end)
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth())
    return `${M[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  if (s.getFullYear() === e.getFullYear())
    return `${M[s.getMonth()]} ${s.getDate()} – ${M[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`
  return `${M[s.getMonth()]} ${s.getFullYear()}`
}

function getPhotos(record) {
  const sorted = (record.photos || [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => p.url)
  if (record.cover_photo_url && !sorted.includes(record.cover_photo_url))
    sorted.unshift(record.cover_photo_url)
  return sorted.length ? sorted : []
}

/* ── Random Memory card ── */
function RandomMemory({ records, onNavigate }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * Math.max(records.length, 1)))
  if (!records.length) return null

  const rec   = records[idx % records.length]
  const desc  = rec.description?.slice(0, 130)
  const photo = rec.cover_photo_url

  const shuffle = (e) => {
    e.stopPropagation()
    let next = idx
    while (next === idx && records.length > 1) next = Math.floor(Math.random() * records.length)
    setIdx(next)
  }

  return (
    <div className="glass glass-hover"
      onClick={() => onNavigate(rec.id)}
      style={{ display:'flex', alignItems:'center', gap:16, padding:14, cursor:'pointer', marginTop:18 }}>

      <div style={{ width:90, height:66, flexShrink:0, borderRadius:10, overflow:'hidden',
        background:'rgba(138,180,204,0.42)' }}>
        {photo && <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <I.star size={13} stroke="rgba(212,119,74,0.8)" fill="rgba(212,119,74,0.8)" />
          <span className="caps">Random memory</span>
        </div>
        <div className="serif" style={{ fontSize:16, fontWeight:500, marginBottom:2 }}>
          {rec.city}, {rec.country} · {formatDate(rec.start_date, rec.end_date)}
        </div>
        {desc && (
          <div className="muted" style={{ fontSize:12, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
            {desc}
          </div>
        )}
      </div>

      <button className="gbtn" onClick={shuffle}
        style={{ borderRadius:'50%', width:38, height:38, padding:0, justifyContent:'center', flexShrink:0 }}
        title="Shuffle">
        <I.refresh size={16} stroke="var(--text)" />
      </button>
    </div>
  )
}

/* ── Record card with photo carousel ── */
function RecordCard({ record, onClick }) {
  const photos              = useMemo(() => getPhotos(record), [record])
  const total               = photos.length
  const [idx, setIdx]       = useState(0)
  const [hovered, setHovered] = useState(false)

  // 3 秒自动轮播，hover 时暂停
  useEffect(() => {
    if (total <= 1 || hovered) return
    const id = setInterval(() => setIdx(i => (i + 1) % total), 3000)
    return () => clearInterval(id)
  }, [total, hovered])

  const go = (dir, e) => {
    e.stopPropagation()
    setIdx(i => (i + dir + total) % total)
  }

  return (
    <div className="glass glass-hover" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor:'pointer', overflow:'hidden' }}>

      <div style={{ height:148, position:'relative', overflow:'hidden',
        background:'rgba(138,180,204,0.42)', display:'flex', alignItems:'center', justifyContent:'center' }}>

        {photos[idx]
          ? <img src={photos[idx]} alt=""
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'opacity .3s ease' }} />
          : <I.cam size={26} stroke="rgba(55,35,18,0.35)" />
        }

        {/* 箭头：hover 时显示 */}
        {total > 1 && hovered && (
          <>
            <button onClick={e => go(-1, e)} style={{
              position:'absolute', left:8, top:'50%', transform:'translateY(-50%)',
              width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
              background:'rgba(255,246,240,0.75)', display:'flex', alignItems:'center',
              justifyContent:'center', zIndex:3 }}>
              <I.chevL size={14} stroke="var(--text)" />
            </button>
            <button onClick={e => go(1, e)} style={{
              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
              width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
              background:'rgba(255,246,240,0.75)', display:'flex', alignItems:'center',
              justifyContent:'center', zIndex:3 }}>
              <I.chevR size={14} stroke="var(--text)" />
            </button>
          </>
        )}

        {/* 分页点 */}
        {total > 1 && (
          <div style={{ position:'absolute', bottom:8, left:0, right:0, pointerEvents:'none',
            display:'flex', justifyContent:'center', gap:4, zIndex:3 }}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} style={{
                width: i === idx ? 14 : 5, height:5, borderRadius:4,
                background: i === idx ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                transition:'width .2s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:'11px 13px 14px' }}>
        <div className="serif" style={{ fontSize:15, fontWeight:500 }}>
          {record.city}, {record.country}
        </div>
        <div className="muted" style={{ fontSize:11, marginTop:3 }}>
          {formatDate(record.start_date, record.end_date)}
        </div>
        <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
          {(record.tags || []).slice(0, 3).map(t => (
            <span key={t} className={`tag ${TAG_CLASS[t] || 'tag-nature'}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main Journal client ── */
export default function JournalClient({ records }) {
  const router = useRouter()
  const [filter, setFilter]  = useState('All')
  const [search, setSearch]  = useState('')

  const filtered = useMemo(() => {
    let res = records
    if (filter !== 'All') res = res.filter(r => r.tags?.includes(filter))
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.country?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      )
    }
    return res
  }, [records, filter, search])

  const navigate = (id) => router.push(`/journal/${id}`)

  return (
    <div className="screen">
      <Navbar />
      <div style={{ position:'absolute', inset:'64px 0 0 0', overflowY:'auto', padding:'26px 32px 40px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="serif" style={{ fontSize:32, fontWeight:500 }}>Journal</div>
          <div className="glass" style={{ display:'flex', alignItems:'center', gap:9,
            padding:'9px 16px', borderRadius:24, width:280 }}>
            <I.search size={16} stroke="var(--muted)" />
            <input
              placeholder="Search memories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border:'none', background:'transparent', outline:'none',
                fontSize:13, color:'var(--text)', width:'100%', fontFamily:'var(--sans)' }}
            />
          </div>
        </div>

        {/* Random Memory */}
        {records.length > 0 && <RandomMemory records={records} onNavigate={navigate} />}

        {/* Filter chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:18 }}>
          <button
            className={'chip' + (filter === 'All' ? ' active' : '')}
            onClick={() => setFilter('All')}>
            All {records.length}
          </button>
          {ALL_TAGS.map(t => {
            const count = records.filter(r => r.tags?.includes(t)).length
            if (!count) return null
            return (
              <button key={t}
                className={'chip' + (filter === t ? ' active' : '')}
                onClick={() => setFilter(t)}>
                {t}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', marginTop:60 }}>
            <div className="serif" style={{ fontSize:20, fontWeight:500 }}>No records found</div>
            <div className="muted" style={{ fontSize:14, marginTop:8 }}>Try a different filter or search term.</div>
          </div>
        ) : (
          <div className="journal-grid">
  {filtered.map(rec => (
    <RecordCard key={rec.id} record={rec} onClick={() => navigate(rec.id)} />
  ))}
</div>
        )}

      </div>
    </div>
  )
}
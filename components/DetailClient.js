'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Navbar from './Navbar'
import { I } from './Icons'

const TAG_CLASS = {
  'Nature':'tag-nature','Food & Dining':'tag-food','Landmarks':'tag-landmark',
  'Culture & Arts':'tag-culture','Hiking':'tag-hiking','Beach & Sea':'tag-beach',
  'Shopping':'tag-shopping','Nightlife':'tag-night','Journey':'tag-journey',
  'Stay':'tag-stay','Festival':'tag-festival','Slow Travel':'tag-slow',
}

function formatDate(start, end) {
  if (!start) return '—'
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = new Date(start)
  if (!end) return `${M[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`
  const e = new Date(end)
  if (s.getFullYear() === e.getFullYear())
    return `${M[s.getMonth()]} ${s.getDate()} – ${M[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`
  return `${M[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${M[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`
}

function buildPhotos(record) {
  const sorted = (record.photos || []).slice().sort((a, b) => a.display_order - b.display_order)
  const urls   = sorted.map(p => p.url)
  if (record.cover_photo_url && !urls.includes(record.cover_photo_url))
    sorted.unshift({ id: 'cover', url: record.cover_photo_url })
  return sorted.length ? sorted : []
}

export default function DetailClient({ record }) {
  const router = useRouter()
  const photos = useMemo(() => buildPhotos(record), [record])
  const [photoIdx,        setPhotoIdx]        = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)

  const prev = () => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)
  const next = () => setPhotoIdx(i => (i + 1) % photos.length)

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('records').delete().eq('id', record.id)
    router.push('/journal')
    router.refresh()
  }

  return (
    <div className="screen">
      <Navbar />
      <div style={{ position:'absolute', inset:'64px 0 0 0', overflowY:'auto', padding:'24px 32px 44px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

          {/* Back */}
          <button className="gbtn" onClick={() => router.push('/journal')}
            style={{ alignSelf:'flex-start', border:'none', background:'transparent',
              padding:'2px 0', boxShadow:'none' }}>
            <I.chevL size={15} stroke="var(--muted)" />
            <span className="muted" style={{ fontSize:12 }}>Back to Journal</span>
          </button>

          {/* Hero info */}
          <div className="glass" style={{ padding:20, display:'flex', justifyContent:'space-between', gap:20 }}>
            <div style={{ flex:'0 0 58%' }}>
              <div className="serif" style={{ fontSize:28, fontWeight:500 }}>
                {record.city}, {record.country}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 22px', marginTop:12 }}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <I.cal size={15} stroke="var(--muted)" />
                  <span className="muted" style={{ fontSize:13 }}>
                    {formatDate(record.start_date, record.end_date)}
                  </span>
                </span>
                {record.weather && (
                  <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <I.cloud size={15} stroke="var(--muted)" />
                    <span className="muted" style={{ fontSize:13 }}>{record.weather}</span>
                  </span>
                )}
                {record.companions && (
                  <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <I.person size={15} stroke="var(--muted)" />
                    <span className="muted" style={{ fontSize:13 }}>{record.companions}</span>
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12 }}>
              <div style={{ display:'flex', gap:8 }}>
                <button className="gbtn"
                  onClick={() => router.push(`/journal/${record.id}/edit`)}>
                  <I.pencil size={14} stroke="var(--text)" /> Edit
                </button>
                <button className="gbtn"
                  onClick={() => setShowDeleteModal(true)}
                  style={{ borderColor:'rgba(180,60,60,0.5)', color:'#9a4242' }}>
                  <I.trash size={14} stroke="#9a4242" /> Delete
                </button>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {(record.tags || []).map(t => (
                  <span key={t} className={`tag ${TAG_CLASS[t] || 'tag-nature'}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Photo carousel */}
          {photos.length > 0 && (
            <div className="glass" style={{ padding:16 }}>
              <div style={{ position:'relative', height:420, borderRadius:12, overflow:'hidden',
                background:'rgba(138,180,204,0.42)' }}>
                <img src={photos[photoIdx]?.url} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />

                {photos.length > 1 && (
                  <>
                    <button className="gbtn" onClick={prev}
                      style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                        width:36, height:36, borderRadius:'50%', padding:0, justifyContent:'center' }}>
                      <I.chevL size={17} stroke="var(--text)" />
                    </button>
                    <button className="gbtn" onClick={next}
                      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                        width:36, height:36, borderRadius:'50%', padding:0, justifyContent:'center' }}>
                      <I.chevR size={17} stroke="var(--text)" />
                    </button>

                    {/* Dots */}
                    <div style={{ position:'absolute', bottom:12, left:0, right:0,
                      display:'flex', justifyContent:'center', gap:5, pointerEvents:'none' }}>
                      {photos.map((_, i) => (
                        <span key={i} style={{
                          width: i === photoIdx ? 14 : 5, height:5, borderRadius:4,
                          background: i === photoIdx ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                          transition:'width .2s ease',
                        }} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div style={{ display:'flex', gap:10, marginTop:14, overflowX:'auto', paddingBottom:4 }}>
                  {photos.map((p, i) => (
                    <div key={p.id} onClick={() => setPhotoIdx(i)}
                      style={{ width:70, height:50, flexShrink:0, borderRadius:6, overflow:'hidden', cursor:'pointer',
                        border: i === photoIdx ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                        transition:'border-color .2s ease' }}>
                      <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {record.description && (
            <div className="glass" style={{ padding:20 }}>
              <div className="serif" style={{ fontSize:16, fontWeight:500, marginBottom:8 }}>
                About this place
              </div>
              <p style={{ fontSize:14, lineHeight:1.8, color:'var(--text)', whiteSpace:'pre-wrap' }}>
                {record.description}
              </p>
            </div>
          )}

          {/* Tags row */}
          {(record.tags || []).length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className="caps">Tags</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {record.tags.map(t => (
                  <span key={t} className={`tag ${TAG_CLASS[t] || 'tag-nature'}`}>{t}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100,
          display:'grid', placeItems:'center',
          background:'rgba(40,28,20,0.45)', backdropFilter:'blur(4px)' }}>
          <div className="glass" style={{ width:380, padding:28, textAlign:'center' }}>
            <div className="serif" style={{ fontSize:20, fontWeight:500, marginBottom:8 }}>
              Delete this record?
            </div>
            <div className="muted" style={{ fontSize:13, lineHeight:1.6, marginBottom:24 }}>
              This cannot be undone. The record and all its photos will be permanently removed.
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button className="gbtn"
                style={{ flex:1, justifyContent:'center' }}
                onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="cta"
                style={{ flex:1, background:'rgba(160,50,50,0.85)', boxShadow:'none' }}
                onClick={handleDelete}
                disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
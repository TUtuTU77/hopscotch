'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Navbar from './Navbar'
import { I } from './Icons'

const ALL_TAGS = [
  'Nature', 'Food & Dining', 'Landmarks', 'Culture & Arts', 'Shopping',
  'Beach & Sea', 'Hiking', 'Nightlife', 'Journey', 'Stay', 'Festival', 'Slow Travel',
]

async function geocode(city, country) {
  try {
    const q   = encodeURIComponent(`${city}, ${country}`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Hopscotch/1.0 personal travel journal' } }
    )
    const data = await res.json()
    if (!data.length) return { lat: null, lng: null }
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { return { lat: null, lng: null } }
}

function IconField({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
        display:'flex', color:'var(--muted)' }}>{icon}</span>
      <input className="field" style={{ paddingLeft: 36 }} {...props} />
    </div>
  )
}

export default function EditClient({ record }) {
  const router          = useRouter()
  const existingPhotos  = record.photos || []

  const [title,        setTitle]        = useState(record.title        || '')
  const [city,         setCity]         = useState(record.city         || '')
  const [country,      setCountry]      = useState(record.country      || '')
  const [startDate,    setStartDate]    = useState(record.start_date   || '')
  const [endDate,      setEndDate]      = useState(record.end_date     || '')
  const [description,  setDescription]  = useState(record.description  || '')
  const [companions,   setCompanions]   = useState(record.companions   || '')
  const [weather,      setWeather]      = useState(record.weather      || '')
  const [tags,         setTags]         = useState(() => {
    const init = {}
    ;(record.tags || []).forEach(t => { init[t] = true })
    return init
  })
  const [newFiles,     setNewFiles]     = useState([])
  const [newPreviews,  setNewPreviews]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [existCover,   setExistCover]   = useState(record.cover_photo_url || '')
  const [newCoverIdx,  setNewCoverIdx]  = useState(null)
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([])

  const toggleTag    = (t) => setTags(s => ({ ...s, [t]: !s[t] }))
  const markDelete = (photoId, photoUrl) => {
    setDeletedPhotoIds(prev => [...prev, photoId])
    if (existCover === photoUrl) {
      const remaining = existingPhotos.filter(
        p => !deletedPhotoIds.includes(p.id) && p.id !== photoId
      )
      setExistCover(remaining[0]?.url || '')
    }
  }
  const handleFiles  = (incoming) => {
    const arr = Array.from(incoming)
    setNewFiles(p => [...p, ...arr])
    setNewPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !city || !country) { setError('Title, city, and country are required.'); return }
    setLoading(true); setError('')

    try {
      const supabase = createClient()

      // 1. Upload new photos
      const uploaded = []
      for (let i = 0; i < newFiles.length; i++) {
        const result = await uploadToCloudinary(newFiles[i])
        uploaded.push({ ...result, order: existingPhotos.length + i })
      }

      // 2. Re-geocode only if location changed
      let lat = record.lat, lng = record.lng
      if (city !== record.city || country !== record.country) {
        const coords = await geocode(city, country)
        lat = coords.lat; lng = coords.lng
      }

      // 3. Build update payload
      const payload = {
        title, city, country, lat, lng,
        start_date:  startDate   || null,
        end_date:    endDate     || null,
        description: description || null,
        companions:  companions  || null,
        weather:     weather     || null,
        tags:        Object.keys(tags).filter(t => tags[t]),
      }
      // 确定最终封面
let finalCover = existCover || record.cover_photo_url || null
if (newCoverIdx !== null && uploaded[newCoverIdx]) {
  finalCover = uploaded[newCoverIdx].url
} else if (!finalCover && uploaded.length > 0) {
  finalCover = uploaded[0].url
}
payload.cover_photo_url = finalCover

      // 删除标记的照片
if (deletedPhotoIds.length > 0) {
  await supabase.from('photos').delete().in('id', deletedPhotoIds)
}
      const { error: updateErr } = await supabase
        .from('records').update(payload).eq('id', record.id)
      if (updateErr) throw updateErr

      // 4. Insert new photos rows
      if (uploaded.length > 0) {
        await supabase.from('photos').insert(
          uploaded.map(p => ({
            record_id: record.id, url: p.url,
            cloudinary_id: p.cloudinary_id, display_order: p.order,
          }))
        )
      }

      router.push(`/journal/${record.id}`)
      router.refresh()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <Navbar />
      <div style={{ position:'absolute', inset:'64px 0 0 0', overflowY:'auto',
        padding:'28px 32px 48px', display:'grid', justifyItems:'center' }}>
        <div className="glass" style={{ width:'100%', maxWidth:680, padding:26 }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div className="serif" style={{ fontSize:28, fontWeight:500 }}>Edit record</div>
            <button className="gbtn" onClick={() => router.back()}
              style={{ border:'none', background:'transparent', boxShadow:'none' }}>
              <I.chevL size={15} stroke="var(--muted)" />
              <span className="muted" style={{ fontSize:12 }}>Cancel</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div>
              <label className="field-label">Title</label>
              <input className="field" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="A name for this place or moment" />
            </div>

            <div>
              <label className="field-label">Location</label>
              <div style={{ display:'flex', gap:12 }}>
                <IconField icon={<I.pin size={16} />} placeholder="City"
                  value={city} onChange={e => setCity(e.target.value)} />
                <input className="field" placeholder="Country"
                  value={country} onChange={e => setCountry(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="field-label">Dates</label>
              <div style={{ display:'flex', gap:12 }}>
                <input className="field" type="date" style={{ flex:1, colorScheme:'light' }}
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input className="field" type="date" style={{ flex:1, colorScheme:'light' }}
                  value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Existing photos (read-only preview) */}
            {existingPhotos
  .filter(p => !deletedPhotoIds.includes(p.id))
  .map(p => {
    const isCover = newCoverIdx === null && existCover === p.url
    return (
      <div key={p.id} onClick={() => { setExistCover(p.url); setNewCoverIdx(null) }}
        style={{ width:80, height:60, borderRadius:8, overflow:'hidden',
          position:'relative', cursor:'pointer',
          border: isCover ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
          transition:'border-color .2s ease' }}>
        <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        {isCover && (
          <span style={{ position:'absolute', bottom:2, left:2, fontSize:9,
            background:'var(--accent)', color:'#fff', borderRadius:3, padding:'1px 4px' }}>
            cover
          </span>
        )}
        <button type="button"
          onClick={e => { e.stopPropagation(); markDelete(p.id, p.url) }}
          style={{ position:'absolute', top:2, right:2, width:16, height:16,
            background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'50%',
            color:'#fff', fontSize:10, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          ✕
        </button>
      </div>
    )
  })
}

            {/* Add more photos */}
            <div>
              <label className="field-label">Add more photos</label>
              {newPreviews.length > 0 ? (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {newPreviews.map((src, i) => {
  const isCover = newCoverIdx === i
  return (
    <div key={i} onClick={() => { setNewCoverIdx(i); setExistCover('') }}
      style={{ width:80, height:60, borderRadius:8, overflow:'hidden',
        position:'relative', cursor:'pointer',
        border: isCover ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
        transition:'border-color .2s ease' }}>
      <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      {isCover && (
        <span style={{ position:'absolute', bottom:2, left:2, fontSize:9,
          background:'var(--accent)', color:'#fff', borderRadius:3, padding:'1px 4px' }}>
          cover
        </span>
      )}
    </div>
  )
})}
                  <label style={{ width:80, height:60, borderRadius:8, cursor:'pointer',
                    border:'1px dashed var(--glass-border)', background:'var(--glass-fill)',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>
                    <I.plus size={20} />
                    <input type="file" multiple accept="image/*" style={{ display:'none' }}
                      onChange={e => handleFiles(e.target.files)} />
                  </label>
                </div>
              ) : (
                <label style={{ height:80, borderRadius:12, display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8, cursor:'pointer',
                  border:'1.5px dashed rgba(255,255,255,0.45)', background:'rgba(255,246,240,0.12)' }}>
                  <I.cam size={20} stroke="var(--muted)" />
                  <span className="muted" style={{ fontSize:13 }}>Tap to add more photos</span>
                  <input type="file" multiple accept="image/*" style={{ display:'none' }}
                    onChange={e => handleFiles(e.target.files)} />
                </label>
              )}
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea className="field" style={{ height:120, resize:'none', lineHeight:1.6 }}
                placeholder="Write about this place..."
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Companions</label>
              <IconField icon={<I.person size={16} />} placeholder="Who were you with? (optional)"
                value={companions} onChange={e => setCompanions(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Weather</label>
              <IconField icon={<I.cloudsun size={16} />} placeholder="How was the weather? (optional)"
                value={weather} onChange={e => setWeather(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Tags</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {ALL_TAGS.map(t => {
                  const on = !!tags[t]
                  return (
                    <button key={t} type="button" onClick={() => toggleTag(t)} className="chip" style={{
                      background:  on ? 'rgba(255,246,240,0.42)' : 'rgba(255,246,240,0.15)',
                      borderColor: on ? 'rgba(200,104,64,0.6)'   : 'rgba(255,255,255,0.40)',
                      fontWeight:  on ? 500 : 400,
                    }}>{t}</button>
                  )
                })}
              </div>
            </div>

            {error && (
              <div style={{ fontSize:12, color:'rgba(180,60,60,0.9)',
                background:'rgba(255,220,220,0.15)', border:'0.5px solid rgba(180,60,60,0.3)',
                borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                {error}
              </div>
            )}

            <button className="cta" type="submit" disabled={loading}
              style={{ width:'100%', borderRadius:12, fontSize:15, marginTop:6,
                opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
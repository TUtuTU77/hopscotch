'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Navbar from '@/components/Navbar'
import { I } from '@/components/Icons'

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
  } catch {
    return { lat: null, lng: null }
  }
}

function IconField({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--muted)' }}>
        {icon}
      </span>
      <input className="field" style={{ paddingLeft: 36 }} {...props} />
    </div>
  )
}

export default function NewRecordPage() {
  const router = useRouter()

  const [title,       setTitle]       = useState('')
  const [city,        setCity]        = useState('')
  const [country,     setCountry]     = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [files,       setFiles]       = useState([])
  const [previews,    setPreviews]    = useState([])
  const [description, setDescription] = useState('')
  const [companions,  setCompanions]  = useState('')
  const [weather,     setWeather]     = useState('')
  const [tags,        setTags]        = useState({})
  const [drag,        setDrag]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [coverIdx,    setCoverIdx]    = useState(0)

  const toggleTag = (t) => setTags(s => ({ ...s, [t]: !s[t] }))

  const handleFiles = (incoming) => {
    const arr  = Array.from(incoming)
    const next = [...files, ...arr]
    setFiles(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  const removeFile = (i) => {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
    if (i < coverIdx)      setCoverIdx(c => c - 1)
    else if (i === coverIdx) setCoverIdx(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !city || !country) { setError('Title, city, and country are required.'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Upload photos to Cloudinary
      const uploaded = []
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i])
        uploaded.push({ ...result, order: i })
      }

      // 2. Geocode city → lat/lng
      const { lat, lng } = await geocode(city, country)

      // 3. Insert record
      const { data: record, error: recErr } = await supabase
        .from('records')
        .insert({
          user_id:         user.id,
          title,
          city,
          country,
          lat,
          lng,
          start_date:      startDate  || null,
          end_date:        endDate    || null,
          cover_photo_url: uploaded[coverIdx]?.url || uploaded[0]?.url || null,
          description:     description || null,
          companions:      companions  || null,
          weather:         weather     || null,
          tags:            Object.keys(tags).filter(t => tags[t]),
        })
        .select()
        .single()

      if (recErr) throw recErr

      // 4. Insert photos
      if (uploaded.length > 0) {
        await supabase.from('photos').insert(
          uploaded.map(p => ({
            record_id:     record.id,
            url:           p.url,
            cloudinary_id: p.cloudinary_id,
            display_order: p.order,
          }))
        )
      }

      router.push(`/journal/${record.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <Navbar />
      <div style={{
        position: 'absolute', inset: '64px 0 0 0',
        overflowY: 'auto', padding: '28px 32px 48px',
        display: 'grid', justifyItems: 'center',
      }}>
        <div className="glass" style={{ width: '100%', maxWidth: 680, padding: 26 }}>
          <div className="serif" style={{ fontSize: 28, fontWeight: 500, marginBottom: 18 }}>
            New record
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Title */}
            <div>
              <label className="field-label">Title</label>
              <input className="field" placeholder="A name for this place or moment"
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Location */}
            <div>
              <label className="field-label">Location</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <IconField icon={<I.pin size={16} />} placeholder="City" style={{ flex: 1 }}
                  value={city} onChange={e => setCity(e.target.value)} />
                <input className="field" placeholder="Country" style={{ flex: 1 }}
                  value={country} onChange={e => setCountry(e.target.value)} />
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Coordinates added automatically</div>
            </div>

            {/* Dates */}
            <div>
              <label className="field-label">Dates</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input className="field" type="date" style={{ flex: 1, colorScheme: 'light' }}
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input className="field" type="date" style={{ flex: 1, colorScheme: 'light' }}
                  value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="field-label">Photos</label>
              {previews.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {previews.map((src, i) => (
  <div key={i}
    onClick={() => setCoverIdx(i)}
    style={{ width:80, height:60, borderRadius:8, overflow:'hidden',
      position:'relative', cursor:'pointer',
      border: i === coverIdx ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
      transition:'border-color .2s ease' }}>
    <img src={src} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
    {i === coverIdx && (
      <span style={{ position:'absolute', bottom:2, left:2, fontSize:9,
        background:'var(--accent)', color:'#fff', borderRadius:3, padding:'1px 4px' }}>
        cover
      </span>
    )}
    <button type="button" onClick={e => { e.stopPropagation(); removeFile(i) }}
      style={{ position:'absolute', top:2, right:2, width:16, height:16,
        background:'rgba(0,0,0,0.45)', border:'none', borderRadius:'50%',
        color:'#fff', fontSize:10, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
      ✕
    </button>
  </div>
))}
                  <label style={{
                    width: 80, height: 60, borderRadius: 8, cursor: 'pointer',
                    border: '1px dashed var(--glass-border)', background: 'var(--glass-fill)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
                  }}>
                    <I.plus size={20} />
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)} />
                  </label>
                </div>
              ) : (
                <label
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
                  style={{
                    height: 120, borderRadius: 12, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
                    border: `1.5px dashed ${drag ? 'var(--hover-glow)' : 'rgba(255,255,255,0.45)'}`,
                    background: drag ? 'rgba(255,246,240,0.32)' : 'rgba(255,246,240,0.12)',
                    transition: 'border-color .2s ease, background .2s ease',
                  }}>
                  <I.cam size={24} stroke="var(--muted)" />
                  <div className="muted" style={{ fontSize: 13 }}>Upload photos — drag here or tap to browse</div>
                  <div className="muted" style={{ fontSize: 11 }}>First photo is your cover</div>
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleFiles(e.target.files)} />
                </label>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="field-label">Description</label>
              <textarea className="field" style={{ height: 120, resize: 'none', lineHeight: 1.6 }}
                placeholder="Write about this place, what you saw, tasted, felt..."
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Companions */}
            <div>
              <label className="field-label">Companions</label>
              <IconField icon={<I.person size={16} />} placeholder="Who were you with? (optional)"
                value={companions} onChange={e => setCompanions(e.target.value)} />
            </div>

            {/* Weather */}
            <div>
              <label className="field-label">Weather</label>
              <IconField icon={<I.cloudsun size={16} />} placeholder="How was the weather? (optional)"
                value={weather} onChange={e => setWeather(e.target.value)} />
            </div>

            {/* Tags */}
            <div>
              <label className="field-label">Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
              <div style={{
                fontSize: 12, color: 'rgba(180,60,60,0.9)', borderRadius: 8,
                background: 'rgba(255,220,220,0.15)', border: '0.5px solid rgba(180,60,60,0.3)',
                padding: '8px 12px', textAlign: 'center',
              }}>{error}</div>
            )}

            <button className="cta" type="submit" disabled={loading}
              style={{ width: '100%', borderRadius: 12, fontSize: 15, marginTop: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Save record'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
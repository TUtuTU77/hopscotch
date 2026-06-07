import { createClient } from '@/lib/supabase-server'
import GlobeClient from '@/components/GlobeClient'

const CONTINENT_MAP = {
  'United States':'NA','Canada':'NA','Mexico':'NA','Cuba':'NA','Jamaica':'NA',
  'Brazil':'SA','Argentina':'SA','Colombia':'SA','Peru':'SA','Chile':'SA',
  'Venezuela':'SA','Ecuador':'SA','Bolivia':'SA','Paraguay':'SA','Uruguay':'SA',
  'United Kingdom':'EU','France':'EU','Germany':'EU','Italy':'EU','Spain':'EU',
  'Portugal':'EU','Netherlands':'EU','Belgium':'EU','Switzerland':'EU','Austria':'EU',
  'Sweden':'EU','Norway':'EU','Denmark':'EU','Finland':'EU','Poland':'EU',
  'Czech Republic':'EU','Hungary':'EU','Romania':'EU','Greece':'EU','Croatia':'EU',
  'Russia':'EU','Ukraine':'EU','Turkey':'EU','Ireland':'EU','Scotland':'EU',
  'China':'AS','Japan':'AS','South Korea':'AS','India':'AS','Thailand':'AS',
  'Vietnam':'AS','Singapore':'AS','Malaysia':'AS','Indonesia':'AS','Philippines':'AS',
  'Taiwan':'AS','Hong Kong':'AS','Cambodia':'AS','Myanmar':'AS','Laos':'AS',
  'Nepal':'AS','Sri Lanka':'AS','Maldives':'AS','UAE':'AS','Saudi Arabia':'AS',
  'Qatar':'AS','Jordan':'AS','Israel':'AS','Mongolia':'AS','Kazakhstan':'AS',
  'Egypt':'AF','Morocco':'AF','South Africa':'AF','Kenya':'AF','Tanzania':'AF',
  'Ethiopia':'AF','Ghana':'AF','Nigeria':'AF','Tunisia':'AF','Algeria':'AF',
  'Australia':'OC','New Zealand':'OC','Fiji':'OC','Papua New Guinea':'OC',
}

const TAG_TINTS = {
  'Nature':'rgba(152,178,132,0.5)','Food & Dining':'rgba(198,172,140,0.5)',
  'Landmarks':'rgba(138,180,204,0.5)','Culture & Arts':'rgba(160,140,200,0.5)',
  'Beach & Sea':'rgba(120,180,200,0.5)','Hiking':'rgba(130,160,120,0.5)',
  'Shopping':'rgba(200,160,160,0.5)','Slow Travel':'rgba(180,200,160,0.5)',
}

function getTint(tags) {
  if (!tags?.length) return 'rgba(138,180,204,0.5)'
  return TAG_TINTS[tags[0]] || 'rgba(138,180,204,0.5)'
}

function formatDate(start_date, end_date) {
  if (!start_date) return '—'
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = new Date(start_date)
  const e = end_date ? new Date(end_date) : null
  if (!e || start_date === end_date) return `${M[s.getMonth()]} ${s.getFullYear()}`
  if (s.getFullYear() === e.getFullYear())
    return `${M[s.getMonth()]}–${M[e.getMonth()]} ${s.getFullYear()}`
  return `${M[s.getMonth()]} ${s.getFullYear()}`
}

function computeStats(records, photoCount) {
  const countries  = new Set(records.map(r => r.country).filter(Boolean))
  const cities     = new Set(records.map(r => r.city).filter(Boolean))
  const continents = new Set(records.map(r => CONTINENT_MAP[r.country]).filter(Boolean))

  let travelDays = 0
  records.forEach(r => {
    if (r.start_date && r.end_date) {
      const d = Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1
      if (d > 0) travelDays += d
    }
  })

  const yearCounts = {}
  records.forEach(r => {
    if (r.start_date) {
      const y = new Date(r.start_date).getFullYear()
      yearCounts[y] = (yearCounts[y] || 0) + 1
    }
  })
  const topYear = Object.keys(yearCounts).sort((a,b) => yearCounts[b]-yearCounts[a])[0] || '—'

  let daysSince = '—'
  const ends = records.filter(r => r.end_date).map(r => new Date(r.end_date).getTime())
  if (ends.length) daysSince = Math.floor((Date.now() - Math.max(...ends)) / 86400000)

  return [
    ['Countries',       String(countries.size)],
    ['Cities',          String(cities.size)],
    ['Records',         String(records.length)],
    ['Travel days',     String(travelDays || records.length)],
    ['Continents',      `${continents.size}/7`],
    ['Photos',          String(photoCount)],
    ['Top year',        String(topYear), true],
    ['Days since trip', String(daysSince)],
  ]
}

export default async function GlobePage() {
  const supabase = await createClient()

  const [{ data: records }, { count: photoCount }] = await Promise.all([
    supabase
      .from('records')
      .select('id,title,city,country,lat,lng,start_date,end_date,cover_photo_url,tags')
      .not('lat', 'is', null),
    supabase.from('photos').select('*', { count: 'exact', head: true }),
  ])

  const cities = (records || []).map(r => ({
    id:              r.id,
    name:            `${r.city}, ${r.country}`,
    date:            formatDate(r.start_date, r.end_date),
    lat:             r.lat,
    lng:             r.lng,
    tint:            getTint(r.tags),
    cover_photo_url: r.cover_photo_url,
  }))

  const stats = computeStats(records || [], photoCount || 0)
  return <GlobeClient cities={cities} stats={stats} />
}
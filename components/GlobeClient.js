'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'

/* ── Continent outlines [lng, lat] ── */
const LAND = [
  { tone:'land', pts:[[-165,60],[-160,71],[-130,71],[-95,70],[-82,73],[-74,68],[-82,60],[-95,62],[-80,52],[-64,60],[-55,52],[-66,47],[-70,42],[-75,36],[-81,30],[-82,24],[-91,29],[-97,25],[-105,21],[-110,24],[-115,29],[-122,37],[-124,46],[-130,54],[-145,59],[-165,60]] },
  { tone:'land', pts:[[-78,8],[-60,11],[-50,2],[-35,-6],[-38,-13],[-48,-25],[-55,-34],[-65,-41],[-70,-52],[-74,-50],[-72,-42],[-71,-30],[-72,-18],[-78,-7],[-81,-4],[-80,3],[-78,8]] },
  { tone:'land', pts:[[-16,14],[-12,25],[-2,31],[10,34],[11,37],[22,32],[32,31],[35,27],[43,12],[51,12],[42,-2],[40,-12],[35,-22],[27,-33],[20,-34],[13,-22],[9,-3],[5,4],[-7,5],[-13,9],[-16,14]] },
  { tone:'land', pts:[[-10,36],[-9,44],[-2,49],[2,51],[8,54],[5,58],[12,58],[14,54],[26,55],[30,60],[28,67],[18,69],[10,64],[6,62],[9,55],[1,47],[-2,44],[-9,38],[-10,36]] },
  { tone:'land', pts:[[26,40],[34,37],[36,30],[44,40],[50,40],[50,46],[60,46],[58,40],[54,26],[57,25],[64,25],[70,24],[74,20],[77,8],[80,13],[83,18],[89,22],[94,18],[98,9],[104,9],[106,15],[109,18],[108,21],[113,21],[118,24],[122,30],[121,38],[127,40],[131,43],[135,44],[141,46],[146,50],[140,53],[150,59],[160,61],[170,66],[179,68],[170,71],[150,72],[125,73],[105,77],[90,75],[70,73],[58,70],[48,67],[40,66],[35,62],[30,55],[28,48],[26,40]] },
  { tone:'land', pts:[[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-18],[150,-24],[153,-28],[150,-37],[143,-39],[137,-35],[130,-32],[123,-34],[115,-34],[113,-26],[114,-22]] },
  { tone:'ice',  pts:[[-45,60],[-30,60],[-20,70],[-22,80],[-40,83],[-58,80],[-55,70],[-45,60]] },
  { tone:'land', pts:[[43,-13],[49,-15],[50,-20],[46,-25],[44,-22],[43,-13]] },
  { tone:'land', pts:[[130,31],[136,35],[141,40],[140,36],[135,33],[130,31]] },
  { tone:'land', pts:[[166,-40],[173,-41],[174,-46],[168,-46],[166,-40]] },
  { tone:'land', pts:[[-8,50],[-2,52],[1,53],[-4,57],[-8,55],[-8,50]] },
  { tone:'land', pts:[[95,2],[104,1],[110,-3],[118,-3],[114,-8],[105,-6],[97,-2],[95,2]] },
  { tone:'land', pts:[[118,1],[125,1],[125,-4],[119,-4],[118,1]] },
]

const TILT = -20

function buildTexture() {
  const TW = 1024, TH = 512
  const c = document.createElement('canvas')
  c.width = TW; c.height = TH
  const x = c.getContext('2d')
  x.fillStyle = '#AED2E6'; x.fillRect(0, 0, TW, TH)
  const og = x.createLinearGradient(0, 0, 0, TH)
  og.addColorStop(0,   'rgba(210,235,246,0.45)')
  og.addColorStop(0.5, 'rgba(170,205,228,0)')
  og.addColorStop(1,   'rgba(150,190,215,0.40)')
  x.fillStyle = og; x.fillRect(0, 0, TW, TH)
  x.fillStyle = '#e2eef0'
  x.beginPath(); x.moveTo(0, TH)
  for (let lng = -180; lng <= 180; lng += 20) {
    const px  = (lng + 180) / 360 * TW
    const lat = -64 + Math.sin(lng * 0.09) * 4
    x.lineTo(px, (90 - lat) / 180 * TH)
  }
  x.lineTo(TW, TH); x.closePath(); x.fill()
  const toXY = (lng, lat) => [(lng+180)/360*TW, (90-lat)/180*TH]
  LAND.forEach(({ pts, tone }) => {
    x.beginPath()
    pts.forEach(([lng, lat], i) => {
      const [px, py] = toXY(lng, lat)
      i ? x.lineTo(px, py) : x.moveTo(px, py)
    })
    x.closePath()
    x.fillStyle = tone === 'ice' ? '#e2eef0' : '#9CCF88'; x.fill()
    x.fillStyle = tone === 'ice' ? 'rgba(255,255,255,0.15)' : 'rgba(120,175,100,0.28)'; x.fill()
  })
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 1
  for (let lng=-180; lng<=180; lng+=30) { const px=(lng+180)/360*TW; x.beginPath(); x.moveTo(px,0); x.lineTo(px,TH); x.stroke() }
  for (let lat=-60;  lat<=60;  lat+=30) { const py=(90-lat)/180*TH; x.beginPath(); x.moveTo(0,py); x.lineTo(TW,py); x.stroke() }
  return x.getImageData(0, 0, TW, TH)
}

function project(lat, lng, rotY, R, cx, cy) {
  const la=lat*Math.PI/180, lo=(lng+rotY)*Math.PI/180, t=TILT*Math.PI/180
  const X0=Math.cos(la)*Math.sin(lo), Y0=Math.sin(la), Z0=Math.cos(la)*Math.cos(lo)
  const Y1=Y0*Math.cos(t)-Z0*Math.sin(t), Z1=Y0*Math.sin(t)+Z0*Math.cos(t)
  return { x: cx+R*X0, y: cy-R*Y1, z: Z1 }
}

function GlobeViz({ cities, active, setActive, D, onPinClick }) {
  const tex      = useRef(null)
  const canvasRef= useRef(null)
  const [rotY, setRotY]   = useState(-2)
  const rotRef   = useRef(-2)
  const dragging = useRef(false)
  const last     = useRef(0)
  const lastDraw = useRef(0)

  const R = D/2-6, cx = D/2, cy = D/2
  const DI = Math.min(D, 440)

  if (!tex.current) tex.current = buildTexture()

  const draw = (rot) => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d')
    const img = ctx.createImageData(DI, DI)
    const out = img.data
    const t=TILT*Math.PI/180, ct=Math.cos(t), st=Math.sin(t)
    const rRad=rot*Math.PI/180
    const T=tex.current, TW=T.width, TH=T.height, td=T.data
    const Ri=DI/2-1, ci=DI/2
    const Lx=-0.4, Ly=0.46, Lz=0.79
    for (let py=0; py<DI; py++) {
      const Y1=(ci-py)/Ri
      for (let px=0; px<DI; px++) {
        const X1=(px-ci)/Ri
        const r2=X1*X1+Y1*Y1
        const o=(py*DI+px)*4
        if (r2>1) { out[o+3]=0; continue }
        const Z1=Math.sqrt(1-r2)
        const Y0=Y1*ct+Z1*st, Z0=-Y1*st+Z1*ct, X0=X1
        const lat=Math.asin(Math.max(-1,Math.min(1,Y0)))
        let lo=Math.atan2(X0,Z0)-rRad
        let u=(lo/(2*Math.PI)+0.5); u-=Math.floor(u)
        const v=(0.5-lat/Math.PI)
        const tx=(u*TW)|0, ty=Math.max(0,Math.min(TH-1,(v*TH)|0))
        const ti=(ty*TW+tx)*4
        let sh=X1*Lx+Y1*Ly+Z1*Lz
        sh=0.90+0.20*Math.max(0,sh)
        const glow=Math.max(0,X1*Lx+Y1*Ly+Z1*Lz)*38
        out[o]  =Math.min(255,td[ti]  *sh+glow)
        out[o+1]=Math.min(255,td[ti+1]*sh+glow)
        out[o+2]=Math.min(255,td[ti+2]*sh+glow)
        out[o+3]=200+38*Z1
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  useEffect(() => {
    rotRef.current = rotY
    const now = performance.now()
    if (now - lastDraw.current > 28) { draw(rotY); lastDraw.current = now }
  }, [rotY, D])

  useEffect(() => {
    let prev=performance.now(), accum=0, raf
    const tick = (now) => {
      const dt=now-prev; prev=now
      if (!dragging.current) { accum+=dt; if(accum>33){setRotY(r=>r+accum*0.0045);accum=0} }
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onDown = (e) => { dragging.current=true; last.current=e.clientX }
  const onMove = (e) => { if(!dragging.current)return; const dx=e.clientX-last.current; last.current=e.clientX; setRotY(r=>r+dx*0.4) }
  const onUp   = ()  => { dragging.current=false }

  const activeCity = cities.find(c => c.id === active)
  const ap = activeCity ? project(activeCity.lat, activeCity.lng, rotY, R, cx, cy) : null
  const tooltipVisible = ap && ap.z > 0.05

  return (
    <div style={{ position:'relative', width:D, height:D, userSelect:'none', cursor:dragging.current?'grabbing':'grab' }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>

      {/* Halo */}
      <div style={{ position:'absolute', inset:-48, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle at 50% 50%,rgba(190,224,244,0.55) 40%,rgba(170,210,238,0.28) 56%,rgba(190,224,244,0) 72%)',
        filter:'blur(8px)' }} />

      <canvas ref={canvasRef} width={DI} height={DI}
        style={{ width:D, height:D, borderRadius:'50%', display:'block',
          boxShadow:'0 18px 70px rgba(150,200,235,0.55),0 4px 24px rgba(120,170,210,0.40),inset 0 0 50px rgba(255,255,255,0.30)' }} />

      {/* Gloss */}
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', pointerEvents:'none',
        boxShadow:'inset 0 0 2px 1px rgba(255,255,255,0.70)',
        background:'radial-gradient(circle at 32% 26%,rgba(255,255,255,0.45),rgba(255,255,255,0) 38%)' }} />

      {/* Pins */}
      {cities.map(c => {
        const p = project(c.lat, c.lng, rotY, R, cx, cy)
        if (p.z <= 0) return null
        const isActive = c.id === active
        const sc = 0.72 + p.z * 0.5
        return (
          <div key={c.id}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setActive(c.id) }}
            style={{ position:'absolute', left:p.x, top:p.y,
              transform:`translate(-50%,-50%) scale(${sc})`,
              cursor:'pointer', zIndex:isActive ? 8 : 5 }}>
            <div style={{ position:'absolute', left:'50%', top:'50%', width:28, height:28,
              transform:'translate(-50%,-50%)', borderRadius:'50%',
              background:'rgba(212,119,74,0.28)',
              boxShadow: isActive ? '0 0 0 7px rgba(212,119,74,0.16)' : 'none' }} />
            <div style={{ position:'absolute', left:'50%', top:'50%', width:12, height:12,
              transform:'translate(-50%,-50%)', borderRadius:'50%', background:'#E8895A',
              border:'1.5px solid rgba(255,246,240,0.92)',
              boxShadow:'0 2px 6px rgba(120,60,30,0.45)' }} />
          </div>
        )
      })}

      {/* Tooltip */}
      {tooltipVisible && (
        <div className="glass" onClick={() => onPinClick(activeCity.id)}
          style={{ position:'absolute', left:ap.x, top:ap.y-26,
            transform:'translate(-50%,-100%)', width:210, padding:11, zIndex:12, cursor:'pointer' }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:62, height:46, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
              {activeCity.cover_photo_url
                ? <img src={activeCity.cover_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ width:'100%', height:'100%', background:activeCity.tint }} />}
            </div>
            <div style={{ minWidth:0 }}>
              <div className="serif" style={{ fontSize:15, fontWeight:500, lineHeight:1.15 }}>{activeCity.name}</div>
              <div className="muted" style={{ fontSize:12, marginTop:3 }}>{activeCity.date}</div>
              <div style={{ fontSize:11, color:'var(--accent)', marginTop:4 }}>View record →</div>
            </div>
          </div>
          {/* Arrow */}
          <div style={{ position:'absolute', left:'50%', bottom:-7, transform:'translateX(-50%) rotate(45deg)',
            width:12, height:12, background:'var(--glass-fill)',
            borderRight:'1px solid var(--glass-border)', borderBottom:'1px solid var(--glass-border)',
            backdropFilter:'blur(14px)' }} />
        </div>
      )}
    </div>
  )
}

export default function GlobeClient({ cities, stats }) {
  const router = useRouter()
  const [active, setActive] = useState(cities[0]?.id || null)

  if (cities.length === 0) {
    return (
      <div className="screen">
        <Navbar />
        <div style={{ position:'absolute', inset:'64px 0 0 0', display:'grid', placeItems:'center' }}>
          <div className="glass" style={{ padding:'32px 48px', textAlign:'center' }}>
            <div className="serif" style={{ fontSize:24, fontWeight:500, marginBottom:8 }}>No records yet</div>
            <div className="muted" style={{ fontSize:14 }}>Add your first trip to see it on the globe.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Navbar />
      <div style={{ position:'absolute', inset:'64px 0 0 0',
        display:'flex', alignItems:'center', justifyContent:'center',
        gap:64, padding:'0 60px' }}>

        <GlobeViz
          cities={cities}
          active={active}
          setActive={setActive}
          D={560}
          onPinClick={(id) => router.push(`/journal/${id}`)}
        />

        {/* Stats panel */}
        <div className="glass" style={{ width:248, padding:'22px 22px' }}>
          <div className="caps" style={{ marginBottom:14 }}>Your journey so far</div>
          {stats.map(([label, val, accent], i) => (
            <div key={label} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              gap:10, padding:'11px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--divider)',
            }}>
              <span className="muted" style={{ fontSize:13, whiteSpace:'nowrap' }}>{label}</span>
              <span className="serif" style={{ fontSize:24, fontWeight:500, color: accent ? 'var(--accent)' : 'var(--text)' }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
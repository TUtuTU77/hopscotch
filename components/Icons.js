function Icon({ d, size = 16, fill = 'none', stroke = 'currentColor', sw = 1.6, children, vb = 24, style }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill}
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d ? <path d={d} /> : children}
    </svg>
  )
}

export const I = {
  search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  refresh: (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></Icon>,
  pin:     (p) => <Icon {...p}><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></Icon>,
  cal:     (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></Icon>,
  cloud:   (p) => <Icon {...p}><path d="M6 19a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6-1.4A3.8 3.8 0 0 1 19 19z"/></Icon>,
  cloudsun:(p) => <Icon {...p}><path d="M8 6.5a4 4 0 0 1 7.7 1.3M5 4.2v1M2.2 7h1M7.8 4.4l.7.7M3.2 11l.7-.7"/><path d="M7 20a3.5 3.5 0 0 1 0-7 4.8 4.8 0 0 1 9.2-1.2A3.4 3.4 0 0 1 18 20z"/></Icon>,
  person:  (p) => <Icon {...p}><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></Icon>,
  pencil:  (p) => <Icon {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></Icon>,
  trash:   (p) => <Icon {...p}><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/></Icon>,
  chevL:   (p) => <Icon {...p}><path d="M15 5l-7 7 7 7"/></Icon>,
  chevR:   (p) => <Icon {...p}><path d="M9 5l7 7-7 7"/></Icon>,
  cam:     (p) => <Icon {...p}><path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4z"/><circle cx="12" cy="13" r="3.2"/></Icon>,
  plus:    (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  star:    (p) => <Icon {...p}><path d="M12 4l2.3 4.8 5.2.6-3.8 3.6 1 5.1L12 16l-4.7 2.7 1-5.1L4.5 9.4l5.2-.6z"/></Icon>,
  logout:  (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>,
  x:       (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
}
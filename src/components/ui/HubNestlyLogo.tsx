/**
 * HubNestlyLogo — Componente oficial da marca HubNestly
 *
 * Mark: três arcos aninhados em forma de ninho (bowl abrindo para cima) + hub dot
 * Cores: Forest Green (#0F3320, #1A6335) × Rose (#D03258, #F0A0B4)
 * Filosofia: Verdant Warmth — tensão produtiva entre verde-floresta e rosa
 */

interface HubNestlyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'white' | 'auto'
  showText?: boolean
  iconOnly?: boolean
  className?: string
}

const SIZES = {
  xs: { icon: 22,  textH: 14, textN: 14, gap: 6  },
  sm: { icon: 28,  textH: 18, textN: 18, gap: 8  },
  md: { icon: 36,  textH: 22, textN: 22, gap: 10 },
  lg: { icon: 48,  textH: 30, textN: 30, gap: 12 },
  xl: { icon: 64,  textH: 40, textN: 40, gap: 16 },
}

let _uid = 0
function uid() { return ++_uid }

export function HubNestlyLogo({
  size = 'md',
  variant = 'dark',
  showText = true,
  iconOnly = false,
  className = '',
}: HubNestlyLogoProps) {
  const s = SIZES[size]
  const id = uid()
  const midId = `hn-mid-${id}`

  const hubColor    = variant === 'white' ? '#4ACA6A' : '#1A6335'
  const nestlyColor = variant === 'white' ? '#F08098' : '#D03258'
  const outerColor  = variant === 'white' ? '#3AB85A' : '#1A6335'
  const innerColor  = variant === 'white' ? '#F08098' : '#D03258'
  const dotFill     = variant === 'white' ? '#FAF5F0' : '#0F3320'
  const dotInner    = variant === 'white' ? '#060C08' : '#FAF5F0'
  const midStart    = variant === 'white' ? '#3AB85A' : '#267A45'
  const midEnd      = variant === 'white' ? '#F08098' : '#C04068'

  // Icon viewport: 0 0 48 36 — bowl centred at (24,28)
  const cx = 24, cy = 28

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
    >
      {/* ── Mark ── */}
      <svg
        width={s.icon}
        height={Math.round(s.icon * 0.75)}
        viewBox="0 0 48 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={midId} x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={midStart}/>
            <stop offset="100%" stopColor={midEnd}/>
          </linearGradient>
        </defs>

        {/* Outer arc */}
        <path
          d={`M 2,${cy} A 22,22 0 0,1 46,${cy}`}
          stroke={outerColor} strokeWidth="4.5" strokeLinecap="round"
        />
        {/* Middle arc — gradient */}
        <path
          d={`M 9,${cy} A 15,15 0 0,1 39,${cy}`}
          stroke={`url(#${midId})`} strokeWidth="3.5" strokeLinecap="round"
        />
        {/* Inner arc */}
        <path
          d={`M 17,${cy} A 7,7 0 0,1 31,${cy}`}
          stroke={innerColor} strokeWidth="2.8" strokeLinecap="round"
        />
        {/* Hub dot */}
        <circle cx={cx} cy={cy} r="3"   fill={dotFill}/>
        <circle cx={cx} cy={cy} r="1.2" fill={dotInner}/>
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && showText && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 600,
            fontSize: s.textH,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <span style={{ color: hubColor }}>Hub</span>
          <span style={{ color: nestlyColor }}>Nestly</span>
        </span>
      )}
    </div>
  )
}

/**
 * Ícone quadrado para app icon / favicon / avatar
 */
export function HubNestlyIcon({ size = 32, rounded = 12 }: { size?: number; rounded?: number }) {
  const id = uid()
  const midId = `hn-icon-mid-${id}`
  const cx = size / 2
  const cy = size * 0.65
  const r1 = size * 0.43
  const r2 = size * 0.29
  const r3 = size * 0.14

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`hn-icon-bg-${id}`} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0E2A1A"/>
          <stop offset="100%" stopColor="#061208"/>
        </linearGradient>
        <linearGradient id={midId} x1="0" y1="0" x2={size} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3AB85A"/>
          <stop offset="100%" stopColor="#F08098"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width={size} height={size} rx={rounded} fill={`url(#hn-icon-bg-${id})`}/>
      <rect x="0" y="0" width={size} height={size} rx={rounded} fill="none"
        stroke="#2A7A44" strokeWidth="0.8" opacity="0.18"/>

      {/* Outer arc */}
      <path
        d={`M ${cx - r1},${cy} A ${r1},${r1} 0 0,1 ${cx + r1},${cy}`}
        stroke="#3AB85A" strokeWidth={size * 0.075} strokeLinecap="round" fill="none"
      />
      {/* Middle arc */}
      <path
        d={`M ${cx - r2},${cy} A ${r2},${r2} 0 0,1 ${cx + r2},${cy}`}
        stroke={`url(#${midId})`} strokeWidth={size * 0.06} strokeLinecap="round" fill="none"
      />
      {/* Inner arc */}
      <path
        d={`M ${cx - r3},${cy} A ${r3},${r3} 0 0,1 ${cx + r3},${cy}`}
        stroke="#F08098" strokeWidth={size * 0.05} strokeLinecap="round" fill="none"
      />
      {/* Hub dot */}
      <circle cx={cx} cy={cy} r={size * 0.055} fill="#FAF5F0"/>
      <circle cx={cx} cy={cy} r={size * 0.022} fill="#060C08"/>
    </svg>
  )
}

// Alias de compatibilidade (facilita migração dos imports antigos)
export { HubNestlyLogo as GleamLogo }
export { HubNestlyIcon as GleamIcon }

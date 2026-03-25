/**
 * OptimusLogo — Official Optimus-K brand logo
 * "K" shape formed by connected nodes inside a circle
 */

interface OptimusLogoProps {
  size?: number
  variant?: 'light' | 'dark' | 'auto'
  className?: string
}

// Brand colors for multicolor K
const BRAND = {
  cyan: '#5CE1E6',
  pink: '#FF66C4',
  violet: '#7C3AED',
  white: '#FFFFFF',
  black: '#000000',
}

export function OptimusLogo({ size = 32, variant = 'auto', className = '' }: OptimusLogoProps) {
  const circleColor = variant === 'dark' ? BRAND.white : variant === 'light' ? BRAND.violet : 'currentColor'

  // K shape nodes
  const A = { x: 30, y: 18 }  // top-left
  const B = { x: 30, y: 50 }  // mid-left (junction)
  const C = { x: 30, y: 82 }  // bottom-left
  const D = { x: 72, y: 20 }  // top-right
  const E = { x: 72, y: 80 }  // bottom-right

  // Each line has its own brand color
  const lines: Array<{ from: typeof A; to: typeof A; color: string }> = [
    { from: A, to: B, color: BRAND.cyan },     // vertical top
    { from: B, to: C, color: BRAND.violet },    // vertical bottom
    { from: B, to: D, color: BRAND.pink },      // diagonal arm up
    { from: B, to: E, color: BRAND.cyan },      // diagonal arm down
    { from: A, to: D, color: BRAND.violet },    // outer connection top
    { from: C, to: E, color: BRAND.pink },      // outer connection bottom
  ]

  // Each node has its own brand color
  const nodes: Array<{ x: number; y: number; color: string }> = [
    { ...A, color: BRAND.cyan },
    { ...B, color: BRAND.white },
    { ...C, color: BRAND.violet },
    { ...D, color: BRAND.pink },
    { ...E, color: BRAND.cyan },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="44" stroke={circleColor} strokeWidth="4" fill="none" />
      {lines.map((l, i) => (
        <line key={i} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke={l.color} strokeWidth="3.5" />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="5.5" fill={n.color} />
      ))}
    </svg>
  )
}

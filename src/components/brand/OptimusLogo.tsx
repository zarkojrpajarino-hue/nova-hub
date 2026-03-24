/**
 * OptimusLogo — Official Optimus-K brand logo
 * "K" shape formed by connected nodes inside a circle
 */

interface OptimusLogoProps {
  size?: number
  variant?: 'light' | 'dark' | 'auto'
  className?: string
}

export function OptimusLogo({ size = 32, variant = 'auto', className = '' }: OptimusLogoProps) {
  const circleColor = variant === 'dark' ? '#FFFFFF' : variant === 'light' ? '#7C3AED' : 'currentColor'
  const nodeColor = '#7C3AED'
  const lineColor = '#7C3AED'

  // K shape nodes:
  // Top-left (A), Mid-left (B), Bottom-left (C) = vertical bar
  // Top-right (D), Bottom-right (E) = diagonal arms
  const A = { x: 30, y: 18 }  // top-left
  const B = { x: 30, y: 50 }  // mid-left (junction)
  const C = { x: 30, y: 82 }  // bottom-left
  const D = { x: 72, y: 20 }  // top-right
  const E = { x: 72, y: 80 }  // bottom-right

  const lines = [
    [A, B], [B, C],   // vertical bar
    [B, D], [B, E],   // diagonal arms
    [A, D], [C, E],   // outer connections
  ]

  const nodes = [A, B, C, D, E]

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
      {lines.map(([from, to], i) => (
        <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={lineColor} strokeWidth="3.5" />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="5.5" fill={nodeColor} />
      ))}
    </svg>
  )
}

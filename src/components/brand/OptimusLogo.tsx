/**
 * OptimusLogo — Official Optimus-K brand logo
 * Circle with connected nodes (network graph)
 * Based on Canva brand guidelines
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

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main circle */}
      <circle cx="50" cy="50" r="42" stroke={circleColor} strokeWidth="4" fill="none" />

      {/* Connection lines between nodes */}
      <line x1="22" y1="32" x2="68" y2="22" stroke={lineColor} strokeWidth="3" />
      <line x1="22" y1="32" x2="50" y2="62" stroke={lineColor} strokeWidth="3" />
      <line x1="68" y1="22" x2="50" y2="62" stroke={lineColor} strokeWidth="3" />
      <line x1="68" y1="22" x2="80" y2="60" stroke={lineColor} strokeWidth="3" />
      <line x1="50" y1="62" x2="80" y2="60" stroke={lineColor} strokeWidth="3" />
      <line x1="50" y1="62" x2="32" y2="82" stroke={lineColor} strokeWidth="3" />

      {/* Nodes (dots) */}
      <circle cx="22" cy="32" r="5" fill={nodeColor} />
      <circle cx="68" cy="22" r="5" fill={nodeColor} />
      <circle cx="50" cy="62" r="5" fill={nodeColor} />
      <circle cx="80" cy="60" r="5" fill={nodeColor} />
      <circle cx="32" cy="82" r="5" fill={nodeColor} />
    </svg>
  )
}

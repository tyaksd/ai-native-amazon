export default function LoadingG() {
  return (
    <svg className="loading-g-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="50%" stopColor="black" stopOpacity="0.3" />
          <stop offset="100%" stopColor="black" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Trail path (faded line that stays behind) */}
      <path
        className="loading-g-trail"
        d="M 100 50 Q 50 50 50 100 Q 50 150 100 150 Q 150 150 150 100 L 150 80 L 100 80"
      />
      {/* Main path (bright line being drawn) */}
      <path
        className="loading-g-path"
        d="M 100 50 Q 50 50 50 100 Q 50 150 100 150 Q 150 150 150 100 L 150 80 L 100 80"
        stroke="url(#glowGradient)"
      />
      {/* Glow point at the drawing end */}
      <circle className="loading-g-glow" r="8" cx="100" cy="80">
        <animateMotion
          dur="1s"
          repeatCount="indefinite"
          path="M 100 50 Q 50 50 50 100 Q 50 150 100 150 Q 150 150 150 100 L 150 80 L 100 80"
        />
      </circle>
    </svg>
  )
}


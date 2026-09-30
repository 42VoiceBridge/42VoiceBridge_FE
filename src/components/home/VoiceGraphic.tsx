/** Original line art: two voices joined by an arch, with no external image assets. */
export const VoiceGraphic = ({ variant = 'bridge' }: { variant?: 'bridge' | 'conversation' }) => (
  <svg className={`vb-graphic vb-graphic--${variant}`} viewBox="0 0 600 480" fill="none" aria-hidden="true">
    <circle className="vb-graphic-disc" cx="300" cy="240" r="206" />
    <g stroke="currentColor" strokeWidth="1.3">
      {Array.from({ length: 9 }, (_,i) => (
        <path key={i} d={`M ${80+i*13} 356 V 248 C ${80+i*13} ${40+i*15}, ${520-i*13} ${40+i*15}, ${520-i*13} 248 V 356`} />
      ))}
      <path d="M64 356H536" /><path d="M64 368H536" opacity=".35" />
    </g>
    <g className="vb-graphic-wave" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
      {[24,48,82,116,66,38,92,144,92,38,66,116,82,48,24].map((height,i) => (
        <path key={i} d={`M${188+i*16} ${263-height/2}v${height}`} style={{ animationDelay: `${i*80}ms` }} />
      ))}
    </g>
    <circle cx="80" cy="356" r="8" fill="currentColor" /><circle cx="520" cy="356" r="8" fill="currentColor" />
    {variant === 'conversation' && <g stroke="currentColor" strokeWidth="1.5">
      <path d="M58 65h166v76H108l-28 23v-23H58Z" className="vb-graphic-bubble" />
      <path d="M376 345h166v76h-22v23l-28-23H376Z" className="vb-graphic-bubble" />
      <path d="M82 94h116M82 112h76M398 372h116M398 391h76" />
    </g>}
  </svg>
);

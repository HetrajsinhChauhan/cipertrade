import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function RadarScanner() {
  const container = useRef(null);

  useGSAP(() => {
    // Spin the sweeping scanner line
    gsap.to('.radar-sweep', {
      rotate: 360,
      duration: 4.5,
      repeat: -1,
      ease: 'none'
    });

    // Spin auxiliary rings
    gsap.to('.radar-ring-spinner', {
      rotate: -360,
      duration: 10,
      repeat: -1,
      ease: 'none'
    });

    // Pulse target blips
    gsap.fromTo('.radar-blip',
      { opacity: 0.1, scale: 0.6 },
      {
        opacity: 0.95,
        scale: 1,
        stagger: { each: 0.8, repeat: -1, yoyo: true },
        duration: 1.6,
        ease: 'power2.inOut'
      }
    );

    // Pulse target brackets/locking system
    gsap.fromTo('.target-lock-bracket',
      { scale: 0.85, opacity: 0.3 },
      { scale: 1.1, opacity: 1, repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut' }
    );
  }, { scope: container });

  return (
    <div 
      ref={container} 
      style={{ 
        width: '240px', 
        height: '240px', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justify: 'center' 
      }}
    >
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(189,0,255,0.18) 0%, rgba(0,87,255,0.08) 60%, rgba(0,0,0,0) 80%)',
        filter: 'blur(25px)',
        zIndex: -1
      }} />

      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bd00ff" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#bd00ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#bd00ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Radar concentric circular grid */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(189, 0, 255, 0.15)" strokeWidth="1" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(0, 87, 255, 0.15)" strokeWidth="1" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="rgba(18, 179, 179, 0.12)" strokeWidth="1" strokeDasharray="3,3" />

        {/* Outer calibrations / Degree numbers */}
        <text x="100" y="8" fill="rgba(255,255,255,0.3)" fontSize="6" fontWeight="bold" textAnchor="middle">000°</text>
        <text x="195" y="102" fill="rgba(255,255,255,0.3)" fontSize="6" fontWeight="bold" textAnchor="start">090°</text>
        <text x="100" y="198" fill="rgba(255,255,255,0.3)" fontSize="6" fontWeight="bold" textAnchor="middle">180°</text>
        <text x="5" y="102" fill="rgba(255,255,255,0.3)" fontSize="6" fontWeight="bold" textAnchor="end">270°</text>

        {/* Tick marks around outer ring */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="100" y1="10" x2="100" y2="13"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}

        {/* Crosshair grids */}
        <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(189, 0, 255, 0.08)" strokeWidth="1" />
        <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(189, 0, 255, 0.08)" strokeWidth="1" />
        
        {/* Auxiliary rotating ring spinner */}
        <circle className="radar-ring-spinner" cx="100" cy="100" r="76" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5" strokeDasharray="10,40,30,40" style={{ transformOrigin: '100px 100px' }} />

        {/* Radar Sweeping Line & Gradient Area */}
        <g className="radar-sweep" style={{ transformOrigin: '100px 100px' }}>
          <line x1="100" y1="100" x2="100" y2="10" stroke="var(--primary-color)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 100 100 L 100 10 A 90 90 0 0 1 163 36 Z" fill="url(#sweepGrad)" />
        </g>

        {/* Center Bullseye Node */}
        <circle cx="100" cy="100" r="4.5" fill="var(--primary-color)" />
        <circle cx="100" cy="100" r="12" fill="none" stroke="var(--primary-color)" strokeWidth="1" strokeDasharray="2,2" />

        {/* Target Blips & Bounding Locks */}
        <g>
          {/* Target 1 (Teal) */}
          <g className="radar-blip" style={{ transformOrigin: '144px 56px' }}>
            <circle cx="144" cy="56" r="4" fill="var(--accent-teal)" />
            <circle cx="144" cy="56" r="10" fill="none" stroke="var(--accent-teal)" strokeWidth="0.8" />
            <line x1="134" y1="56" x2="154" y2="56" stroke="var(--accent-teal)" strokeWidth="0.5" />
            <line x1="144" y1="46" x2="144" y2="66" stroke="var(--accent-teal)" strokeWidth="0.5" />
            
            {/* HUD Bracket lock shapes around target */}
            <g className="target-lock-bracket" style={{ transformOrigin: '144px 56px' }}>
              <path d="M 134 50 L 134 46 L 138 46" fill="none" stroke="var(--accent-teal)" strokeWidth="1" />
              <path d="M 154 50 L 154 46 L 150 46" fill="none" stroke="var(--accent-teal)" strokeWidth="1" />
              <path d="M 134 62 L 134 66 L 138 66" fill="none" stroke="var(--accent-teal)" strokeWidth="1" />
              <path d="M 154 62 L 154 66 L 150 66" fill="none" stroke="var(--accent-teal)" strokeWidth="1" />
            </g>
          </g>

          {/* Target 2 (Blue) */}
          <g className="radar-blip" style={{ transformOrigin: '64px 138px' }}>
            <circle cx="64" cy="138" r="5" fill="var(--accent-blue)" />
            <circle cx="64" cy="138" r="12" fill="none" stroke="var(--accent-blue)" strokeWidth="0.8" />
            <line x1="52" y1="138" x2="76" y2="138" stroke="var(--accent-blue)" strokeWidth="0.5" />
            <line x1="64" y1="126" x2="64" y2="150" stroke="var(--accent-blue)" strokeWidth="0.5" />

            {/* HUD Bracket lock shapes around target */}
            <g className="target-lock-bracket" style={{ transformOrigin: '64px 138px' }}>
              <path d="M 54 132 L 54 128 L 58 128" fill="none" stroke="var(--accent-blue)" strokeWidth="1" />
              <path d="M 74 132 L 74 128 L 70 128" fill="none" stroke="var(--accent-blue)" strokeWidth="1" />
              <path d="M 54 144 L 54 148 L 58 148" fill="none" stroke="var(--accent-blue)" strokeWidth="1" />
              <path d="M 74 144 L 74 148 L 70 148" fill="none" stroke="var(--accent-blue)" strokeWidth="1" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

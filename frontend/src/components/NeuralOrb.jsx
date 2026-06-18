import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function NeuralOrb() {
  const container = useRef(null);

  useGSAP(() => {
    // Single slow, elegant spin for the outer concentric rings
    gsap.to('.orb-rings-group', { rotate: 360, duration: 50, repeat: -1, ease: 'none' });

    // Pulse core glow aura very slowly
    gsap.fromTo('.orb-core-glow',
      { r: 25, opacity: 0.1 },
      { r: 42, opacity: 0.22, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' }
    );
  }, { scope: container });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: -1,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      <div 
        ref={container} 
        className="floating-3d-asset" 
        style={{ 
          width: '75vw', 
          height: '75vw', 
          maxWidth: '900px', 
          maxHeight: '900px', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: 0.25,
        }}
      >
        {/* Blur Backing Halo */}
        <div style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(189,0,255,0.18) 0%, rgba(0,87,255,0.1) 50%, rgba(18,179,179,0) 70%)',
          filter: 'blur(90px)',
          zIndex: -1
        }} />

        <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <radialGradient id="coreGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bd00ff" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#0057ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Core guidelines */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="0.8" />
          <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(255, 255, 255, 0.01)" strokeWidth="0.5" />
          <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(255, 255, 255, 0.01)" strokeWidth="0.5" />

          {/* Grouped concentric rings for a clean, unified slow movement */}
          <g className="orb-rings-group" style={{ transformOrigin: '100px 100px' }}>
            {/* Outer Ring - Tech calipers style */}
            <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(189, 0, 255, 0.2)" strokeWidth="1.2" strokeDasharray="60,20,5,10,5,20" />
            
            {/* Mid Ring - Circuit pattern layout */}
            <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(0, 87, 255, 0.25)" strokeWidth="1" strokeDasharray="30,15,8,8,8,15" />
            
            {/* Inner Ring - Calibrated markings */}
            <circle cx="100" cy="100" r="46" fill="none" stroke="rgba(18, 179, 179, 0.3)" strokeWidth="1" strokeDasharray="4,6" />
          </g>

          {/* Pulsing Core Aura */}
          <circle className="orb-core-glow" cx="100" cy="100" r="28" fill="url(#coreGlowGrad)" style={{ mixBlendMode: 'screen' }} />
        </svg>
      </div>
    </div>
  );
}

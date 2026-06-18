import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Marquee() {
  const marqueeRef = useRef();

  useGSAP(() => {
    gsap.to('.marquee-content', {
      xPercent: -50,
      ease: 'none',
      duration: 22,
      repeat: -1
    });
  }, { scope: marqueeRef });

  return (
    <div 
      ref={marqueeRef} 
      style={{
        width: '100%',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(10px)',
        color: '#0f172a',
        padding: '1.2rem 0',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(18, 179, 179, 0.15)',
        borderBottom: '1px solid rgba(18, 179, 179, 0.15)',
        transform: 'rotate(-1.5deg) scale(1.02)',
        margin: '5rem 0',
        boxShadow: '0 10px 30px rgba(18, 179, 179, 0.03)',
        zIndex: 5,
        position: 'relative'
      }}
    >
      <div 
        className="marquee-content" 
        style={{ 
          display: 'flex', 
          fontSize: '1.2rem', 
          fontWeight: '800', 
          textTransform: 'uppercase', 
          letterSpacing: '3px', 
          fontFamily: "'Outfit', sans-serif" 
        }}
      >
        <span>
          <span style={{ color: '#12b3b3' }}>•</span> AI PRECISION <span style={{ color: '#12b3b3' }}>•</span> AUTO SUPPORT & RESISTANCE <span style={{ color: '#12b3b3' }}>•</span> HIGH PROBABILITY SETUPS <span style={{ color: '#12b3b3' }}>•</span> NEURAL PATTERN DETECTION <span style={{ color: '#12b3b3' }}>•</span> DYNAMIC VOLATILITY SCANS&nbsp;
        </span>
        <span>
          <span style={{ color: '#12b3b3' }}>•</span> AI PRECISION <span style={{ color: '#12b3b3' }}>•</span> AUTO SUPPORT & RESISTANCE <span style={{ color: '#12b3b3' }}>•</span> HIGH PROBABILITY SETUPS <span style={{ color: '#12b3b3' }}>•</span> NEURAL PATTERN DETECTION <span style={{ color: '#12b3b3' }}>•</span> DYNAMIC VOLATILITY SCANS&nbsp;
        </span>
      </div>
    </div>
  );
}

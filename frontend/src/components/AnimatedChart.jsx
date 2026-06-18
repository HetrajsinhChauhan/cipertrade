import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AnimatedChart() {
  const container = useRef();
  
  // Sample candlestick data: { x, o, h, l, c }
  const data = [
    { x: 20, o: 100, h: 60, l: 140, c: 130, bear: true },
    { x: 60, o: 130, h: 90, l: 160, c: 110, bear: false },
    { x: 100, o: 110, h: 80, l: 150, c: 140, bear: true },
    { x: 140, o: 140, h: 110, l: 170, c: 160, bear: true },
    { x: 180, o: 160, h: 120, l: 190, c: 130, bear: false },
    // Reversal / Breakout
    { x: 220, o: 130, h: 80, l: 140, c: 90, bear: false },
    { x: 260, o: 90, h: 40, l: 110, c: 50, bear: false },
    { x: 300, o: 50, h: 20, l: 70, c: 30, bear: false },
    { x: 340, o: 30, h: 10, l: 60, c: 20, bear: false },
  ];

  useGSAP(() => {
    // Animate grid lines
    gsap.from('.grid-line', {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'left',
      stagger: 0.1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 80%',
      }
    });

    // Animate candlesticks
    const candles = gsap.utils.toArray('.candle');
    gsap.set(candles, { scaleY: 0, opacity: 0, transformOrigin: 'bottom' });
    
    gsap.to(candles, {
      scaleY: 1,
      opacity: 1,
      stagger: 0.1,
      duration: 0.8,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 75%',
      }
    });

    // Animate AI highlight box
    gsap.from('.ai-highlight', {
      opacity: 0,
      scale: 0.8,
      duration: 1,
      delay: 1.5,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 75%',
      }
    });
      
  }, { scope: container });

  return (
    <div ref={container} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Background Grid */}
        <g className="grid">
          {[50, 100, 150].map((y, i) => (
            <line key={`h-${i}`} className="grid-line" x1="0" y1={y} x2="400" y2={y} stroke="rgba(15, 23, 42, 0.05)" strokeWidth="1" strokeDasharray="4,4" />
          ))}
        </g>

        {/* Candlesticks */}
        <g className="candlesticks">
          {data.map((d, i) => {
            const color = d.bear ? 'var(--candle-bear)' : 'var(--candle-bull)';
            const yRect = Math.min(d.o, d.c);
            const hRect = Math.max(d.o, d.c) - yRect || 2; // min height
            
            return (
              <g key={i} className="candle" style={{ transformOrigin: `${d.x + 5}px 200px` }}>
                {/* Wick */}
                <line x1={d.x + 5} y1={d.h} x2={d.x + 5} y2={d.l} stroke={color} strokeWidth="2" />
                {/* Body */}
                <rect x={d.x} y={yRect} width="10" height={hRect} fill={color} rx="2" />
              </g>
            );
          })}
        </g>
        
        {/* AI Pattern Highlight Box */}
        <g className="ai-highlight">
          <rect x="200" y="10" width="160" height="180" fill="rgba(18, 179, 179, 0.05)" stroke="var(--primary-color)" strokeWidth="2" strokeDasharray="5,5" rx="8" />
          <rect x="240" y="0" width="80" height="20" fill="var(--primary-color)" rx="4" />
          <text x="280" y="14" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="'Outfit', sans-serif">BULL FLAG DETECTED</text>
        </g>
      </svg>
    </div>
  );
}

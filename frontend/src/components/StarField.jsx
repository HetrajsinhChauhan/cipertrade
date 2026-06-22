import React, { useEffect, useRef } from 'react';

export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const numStars = 110;
    const stars = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseSize: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        driftX: (Math.random() - 0.5) * 0.05,
        driftY: (Math.random() - 0.5) * 0.05,
        color: Math.random() > 0.8 ? '#bd00ff' : Math.random() > 0.8 ? '#0057ff' : '#ffffff'
      });
    }

    let scrollY = window.scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        // Slow drift
        star.x += star.driftX;
        star.y += star.driftY;

        // Loop screen edges
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle calculation
        star.phase += star.twinkleSpeed;
        const currentAlpha = Math.max(0.1, Math.min(1, star.alpha + Math.sin(star.phase) * 0.35));

        // Parallax scroll calculation: deep stars move slower, closer stars move faster
        const parallaxOffset = (scrollY * (star.baseSize * 0.12)) % height;
        let drawY = star.y - parallaxOffset;
        if (drawY < 0) drawY += height;

        // Draw star with glow radial gradient
        ctx.beginPath();
        ctx.arc(star.x, drawY, star.baseSize, 0, Math.PI * 2);
        
        const isAdminPath = window.location.pathname === '/adminhetraj';
        
        if (star.color === '#ffffff') {
          ctx.fillStyle = isAdminPath 
            ? `rgba(30, 41, 59, ${currentAlpha})` 
            : `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.fill();
        } else if (star.color === '#bd00ff') {
          // Glow effect for neon purple stars
          ctx.fillStyle = `rgba(189, 0, 255, ${currentAlpha})`;
          ctx.shadowBlur = isAdminPath ? 2 : 8;
          ctx.shadowColor = '#bd00ff';
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
        } else {
          // Glow effect for blue stars
          ctx.fillStyle = `rgba(0, 87, 255, ${currentAlpha})`;
          ctx.shadowBlur = isAdminPath ? 2 : 8;
          ctx.shadowColor = '#0057ff';
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -3,
        opacity: 0.75
      }}
    />
  );
}

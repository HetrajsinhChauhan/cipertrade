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
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      // Avoid resetting canvas on minor height fluctuations (e.g. mobile URL bar show/hide)
      if (Math.abs(newWidth - width) > 10 || Math.abs(newHeight - height) > 100) {
        width = canvas.width = newWidth;
        height = canvas.height = newHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Generate stars with relative coordinates (0 to 1)
    const numStars = 110;
    const stars = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random(), // 0 to 1
        y: Math.random(), // 0 to 1
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
        // Slow drift relative to current dimensions
        star.x += star.driftX / width;
        star.y += star.driftY / height;

        // Loop screen edges
        if (star.x < 0) star.x = 1;
        if (star.x > 1) star.x = 0;
        if (star.y < 0) star.y = 1;
        if (star.y > 1) star.y = 0;

        // Twinkle calculation
        star.phase += star.twinkleSpeed;
        const currentAlpha = Math.max(0.1, Math.min(1, star.alpha + Math.sin(star.phase) * 0.35));

        // Parallax scroll calculation: deep stars move slower, closer stars move faster
        const parallaxOffset = (scrollY * (star.baseSize * 0.12)) % height;
        let drawY = (star.y * height) - parallaxOffset;
        if (drawY < 0) drawY += height;

        const drawX = star.x * width;

        // Draw star with glow radial gradient
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.baseSize, 0, Math.PI * 2);
        
        const isAdminPath = window.location.pathname === '/adminhetraj';
        const isMobile = width < 768;
        
        if (star.color === '#ffffff') {
          ctx.fillStyle = isAdminPath 
            ? `rgba(30, 41, 59, ${currentAlpha})` 
            : `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.fill();
        } else if (star.color === '#bd00ff') {
          ctx.fillStyle = `rgba(189, 0, 255, ${currentAlpha})`;
          if (!isMobile) {
            ctx.shadowBlur = isAdminPath ? 2 : 8;
            ctx.shadowColor = '#bd00ff';
          }
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
        } else {
          ctx.fillStyle = `rgba(0, 87, 255, ${currentAlpha})`;
          if (!isMobile) {
            ctx.shadowBlur = isAdminPath ? 2 : 8;
            ctx.shadowColor = '#0057ff';
          }
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
        display: 'block',
        pointerEvents: 'none',
        zIndex: -3,
        opacity: 0.75
      }}
    />
  );
}

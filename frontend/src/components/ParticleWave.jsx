import React, { useEffect, useRef } from 'react';

export default function ParticleWave() {
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

    // Grid details
    const numPointsX = 40;
    const numPointsZ = 25;
    const spacingX = 45;
    const spacingZ = 42;
    let count = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const fov = 300;
      const cx = width / 2;
      const cy = height / 3;

      for (let ix = 0; ix < numPointsX; ix++) {
        for (let iz = 0; iz < numPointsZ; iz++) {
          // Calculate 3D coordinates relative to center
          const x3d = (ix - numPointsX / 2) * spacingX;
          const z3d = iz * spacingZ + 120;
          
          // Double sine wave heights
          const y3d = Math.sin(ix * 0.18 + count) * 30 + Math.cos(iz * 0.18 + count) * 30;

          // 3D projection
          const scale = fov / (fov + z3d);
          const x2d = cx + x3d * scale;
          const y2d = cy + y3d * scale + (z3d * 0.15); // perspective slide downwards

          if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
            const size = Math.max(0.5, scale * 3.5);
            // Harmonic color shifts based on coordinates
            const r = Math.floor(180 + (x3d * 0.04));
            const g = Math.floor(0);
            const b = Math.floor(255 - (z3d * 0.05));
            const alpha = scale * 0.6; 

            // Draw Node Particle
            ctx.fillStyle = `rgba(${r % 255}, ${g}, ${b % 255}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            ctx.fill();

            // Draw glowing grid line to next point along X
            if (ix < numPointsX - 1) {
              const nextX3d = (ix + 1 - numPointsX / 2) * spacingX;
              const nextY3d = Math.sin((ix + 1) * 0.18 + count) * 30 + Math.cos(iz * 0.18 + count) * 30;
              const nextScale = fov / (fov + z3d);
              const nextX2d = cx + nextX3d * nextScale;
              const nextY2d = cy + nextY3d * nextScale + (z3d * 0.15);

              if (nextX2d >= 0 && nextX2d <= width && nextY2d >= 0 && nextY2d <= height) {
                ctx.strokeStyle = `rgba(${r % 255}, 50, ${b % 255}, ${alpha * 0.15})`;
                ctx.lineWidth = Math.max(0.1, scale * 0.6);
                ctx.beginPath();
                ctx.moveTo(x2d, y2d);
                ctx.lineTo(nextX2d, nextY2d);
                ctx.stroke();
              }
            }

            // Draw glowing grid line to next point along Z
            if (iz < numPointsZ - 1) {
              const nextZ3d = (iz + 1) * spacingZ + 120;
              const nextY3d = Math.sin(ix * 0.18 + count) * 30 + Math.cos((iz + 1) * 0.18 + count) * 30;
              const nextScale = fov / (fov + nextZ3d);
              const nextX2d = cx + x3d * nextScale;
              const nextY2d = cy + nextY3d * nextScale + (nextZ3d * 0.15);

              if (nextX2d >= 0 && nextX2d <= width && nextY2d >= 0 && nextY2d <= height) {
                ctx.strokeStyle = `rgba(${r % 255}, 50, ${b % 255}, ${alpha * 0.15})`;
                ctx.lineWidth = Math.max(0.1, scale * 0.6);
                ctx.beginPath();
                ctx.moveTo(x2d, y2d);
                ctx.lineTo(nextX2d, nextY2d);
                ctx.stroke();
              }
            }

          }
        }
      }

      count += 0.012; // slow, premium pacing
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -2,
        mixBlendMode: 'screen',
        opacity: 0.55
      }}
    />
  );
}



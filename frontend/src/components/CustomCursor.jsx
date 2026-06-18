import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    let isMoving = false;
    let stopTimeout;

    const onMouseMove = (e) => {
      // Position cursor and follower elements
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.06 });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });

      // Movement Animation: Expand and color-shift cursor elements when moving
      if (!isMoving) {
        isMoving = true;
        gsap.to(follower, { 
          scale: 1.3, 
          borderColor: 'rgba(0, 87, 255, 0.7)', 
          duration: 0.2, 
          overwrite: 'auto' 
        });
        gsap.to(cursor, { 
          scale: 1.25, 
          backgroundColor: '#0057ff', 
          duration: 0.15, 
          overwrite: 'auto' 
        });
      }

      // Debounce: Relax cursor back to stationary state when movement stops
      clearTimeout(stopTimeout);
      stopTimeout = setTimeout(() => {
        isMoving = false;
        gsap.to(follower, { 
          scale: 1.0, 
          borderColor: 'rgba(189, 0, 255, 0.4)', 
          duration: 0.35, 
          overwrite: 'auto' 
        });
        gsap.to(cursor, { 
          scale: 1.0, 
          backgroundColor: '#bd00ff', 
          duration: 0.4, 
          overwrite: 'auto' 
        });
      }, 100);
    };

    const onMouseHover = () => {
      gsap.to(cursor, { 
        scale: 1.6, 
        backgroundColor: 'rgba(0, 87, 255, 0.15)', 
        border: '1px solid #0057ff', 
        overwrite: 'auto' 
      });
      gsap.to(follower, { 
        scale: 1.5, 
        borderColor: '#bd00ff', 
        duration: 0.2, 
        overwrite: 'auto' 
      });
    };

    const onMouseLeave = () => {
      gsap.to(cursor, { 
        scale: 1.0, 
        backgroundColor: '#bd00ff', 
        border: 'none', 
        overwrite: 'auto' 
      });
      gsap.to(follower, { 
        scale: 1.0, 
        borderColor: 'rgba(189, 0, 255, 0.4)', 
        overwrite: 'auto' 
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    // Hover listeners for links and buttons
    const interactiveElements = document.querySelectorAll('a, button, input');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', onMouseHover);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onMouseHover);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
      clearTimeout(stopTimeout);
    };
  }, []);

  return (
    <>
      {/* Centered Small Dot */}
      <div 
        ref={cursorRef} 
        style={{
          position: 'fixed',
          top: '-4px',
          left: '-4px',
          width: '8px',
          height: '8px',
          backgroundColor: '#bd00ff',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          boxShadow: '0 0 8px rgba(189, 0, 255, 0.6)'
        }} 
      />
      {/* Outer Follower Ring */}
      <div 
        ref={followerRef} 
        style={{
          position: 'fixed',
          top: '-15px',
          left: '-15px',
          width: '30px',
          height: '30px',
          border: '1px solid rgba(189, 0, 255, 0.4)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99998,
          boxShadow: '0 0 10px rgba(189, 0, 255, 0.15)'
        }} 
      />
    </>
  );
}

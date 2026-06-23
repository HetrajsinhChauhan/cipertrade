import React, { useEffect, useState } from 'react';
import NeuralOrb from './NeuralOrb';
import StarField from './StarField';

export default function MaintenanceNotice() {
  const [dots, setDots] = useState('...');
  const [terminalLog, setTerminalLog] = useState([
    'Initializing re-calibration protocol...',
    'Loading current neural weight sets: [OK]',
    'Re-indexing structure databases: [92%]'
  ]);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 800);

    const logs = [
      'Scaling cluster micro-services...',
      'Connecting to liquidity networks: [RE-ROUTING]',
      'Optimizing standard deviation Pivot algorithms: [COMPILING]',
      'Clearing memory pools...',
      'System status: 100% Secure.',
      'Deploying new breakout vector models...',
      'Calibrating Multi-Timeframe scanners...'
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setTerminalLog(prev => [...prev.slice(-3), logs[logIndex]]);
        logIndex++;
      } else {
        logIndex = 0;
      }
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Star field background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.85 }}>
        <StarField />
      </div>

      {/* Dark background glow orbs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(189, 0, 255, 0.15) 0%, rgba(0, 87, 255, 0.05) 50%, transparent 100%)',
          filter: 'blur(80px)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, rgba(0, 87, 255, 0.1) 0%, rgba(18, 179, 179, 0.04) 50%, transparent 100%)',
          filter: 'blur(80px)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Floating Concentric Neural Orb */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '2.5rem', transform: 'scale(1.15)', filter: 'drop-shadow(0 0 25px rgba(189, 0, 255, 0.25))' }}>
        <NeuralOrb />
      </div>

      {/* Glassmorphic Maintenance Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '580px',
        width: '100%',
        background: 'rgba(10, 10, 12, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(189, 0, 255, 0.2)',
        borderRadius: '24px',
        padding: '2.5rem 2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(189, 0, 255, 0.08)'
      }}>
        {/* Blinking Live Recalibration Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(189, 0, 255, 0.08)',
          border: '1px solid rgba(189, 0, 255, 0.35)',
          borderRadius: '30px',
          padding: '6px 16px',
          marginBottom: '1.5rem',
          boxShadow: '0 0 15px rgba(189, 0, 255, 0.1)'
        }}>
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            background: '#bd00ff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #bd00ff',
            animation: 'maintenancePulse 1.2s infinite ease-in-out'
          }} />
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#d866ff',
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}>
            System Recalibration {dots}
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '2rem',
          fontWeight: 800,
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Ciper AI is Undergoing <span style={{ background: 'linear-gradient(135deg, #bd00ff 0%, #0057ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scheduled Maintenance</span>
        </h1>

        {/* Description English */}
        <p style={{
          fontSize: '0.92rem',
          color: '#94a3b8',
          lineHeight: '1.6',
          marginBottom: '1.2rem',
          textAlign: 'center'
        }}>
          We are currently upgrading our neural compute layers and optimizing database structures to deliver highly precise breakout signals and lower latency.
        </p>

        {/* Description Hindi (Hinglish) */}
        <p style={{
          fontSize: '0.9rem',
          color: '#64748b',
          lineHeight: '1.5',
          fontStyle: 'italic',
          borderTop: '1px dashed rgba(255,255,255,0.06)',
          paddingTop: '1rem',
          marginBottom: '1.8rem'
        }}>
          Website par maintenance chal rahi hai aur thodi der ke liye user access temporary block rahega. Hum bohot jald upgraded server ke saath wapis aayenge!
        </p>

        {/* Cyberpunk Interactive Status Terminal Log */}
        <div style={{
          background: '#040406',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          textAlign: 'left',
          marginBottom: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.78rem'
        }}>
          <div style={{ color: '#0057ff', marginBottom: '6px', fontWeight: 'bold' }}>ciper-node-01:~$ optimize --neural-network</div>
          {terminalLog.map((log, idx) => (
            <div key={idx} style={{
              color: idx === terminalLog.length - 1 ? '#10b981' : '#64748b',
              margin: '3px 0',
              textShadow: idx === terminalLog.length - 1 ? '0 0 6px rgba(16, 185, 129, 0.3)' : 'none'
            }}>
              &gt; {log}
            </div>
          ))}
          <div style={{
            display: 'inline-block',
            width: '6px',
            height: '12px',
            background: '#10b981',
            marginLeft: '4px',
            animation: 'terminalCursor 1s infinite'
          }} />
        </div>

        {/* Footer Support Info */}
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Need urgent assistance? Contact us at{' '}
          <a
            href="mailto:ciperindicaters@gmail.com"
            style={{ color: '#bd00ff', textDecoration: 'none', fontWeight: 600 }}
          >
            ciperindicaters@gmail.com
          </a>
        </div>
      </div>

      {/* Styled Animations */}
      <style>{`
        @keyframes maintenancePulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes terminalCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

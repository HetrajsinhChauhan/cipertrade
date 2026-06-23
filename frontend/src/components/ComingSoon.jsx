import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ComingSoon({ 
  onPrebook,
  systemConfig = {
    monthlyDiscountPrice: 299,
    monthlyStrikePrice: 399,
    annualDiscountPrice: 999,
    annualStrikePrice: 1200,
    indicatorMode: 'prebook'
  },
  referralDiscount = { code: '', discountPercent: 0, name: '' },
  allIndicators = []
}) {
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const sectionRef = useRef(null);
  const chartRef = useRef(null);

  // Set default active indicator once allIndicators are loaded
  useEffect(() => {
    if (allIndicators.length > 0 && !activeIndicator) {
      setActiveIndicator(allIndicators[0]);
    }
  }, [allIndicators, activeIndicator]);

  const indicator = activeIndicator || (allIndicators.length > 0 ? allIndicators[0] : {
    title: "Ciper TL (Trend Line)",
    desc: "Plots high-probability trend lines and automatically highlights chart pattern breakout vectors in H1/H4 timeframes.",
    status: "Beta Testing",
    icon: "trend",
    monthlyStrikePrice: 399,
    monthlyDiscountPrice: 299,
    annualStrikePrice: 1200,
    annualDiscountPrice: 999
  });

  const monthlyPrice = indicator.monthlyDiscountPrice || 299;
  const annualPrice = indicator.annualDiscountPrice || 999;

  const getIndicatorCapabilities = (ind) => {
    if (!ind) return [];
    switch (ind.icon) {
      case 'volume':
        return [
          { icon: '📊', title: 'Institutional Volume Profile', desc: 'Visualizes volume distribution across price levels, identifying high volume nodes.' },
          { icon: '🎯', title: 'Point of Control (POC)', desc: 'Detects the price level with the highest traded volume for precise target mapping.' },
          { icon: '⚡', title: 'Real-time Volume Delta', desc: 'Alerts you to buying/selling imbalances as they form in the order book.' }
        ];
      case 'liquidity':
        return [
          { icon: '💧', title: 'Liquidity Grab Tracker', desc: 'Flags retail stop-loss clusters and potential institutional hunt zones.' },
          { icon: '🔄', title: 'Standard Deviation Bands', desc: 'Calculates standard deviations to spot exhaustion and trend reversal pivots.' },
          { icon: '🐳', title: 'Whale Execution Zones', desc: 'Highlights whale activity and order block execution zones.' }
        ];
      case 'neural':
        return [
          { icon: '🧠', title: 'Deep Learning Classifier', desc: 'Evaluates historical price structures to project vector directions.' },
          { icon: '🤖', title: 'Multi-Timeframe Convergence', desc: 'Confirms pattern alignment across H1, H4, and Daily timeframes.' },
          { icon: '⚡', title: 'Breakout Probability Score', desc: 'Provides a mathematical confidence percentage for each setup.' }
        ];
      case 'trend':
      default:
        return [
          { icon: '📈', title: 'High-Probability Auto Trend Lines', desc: 'Calculates mathematical swing pivots and connects support/resistance vector lines.' },
          { icon: '🔍', title: 'Multi-Timeframe Chart Patterns', desc: 'Instantly flags triangles, wedges, channels, and head-and-shoulders.' },
          { icon: '⚡', title: 'Real-Time Breakout Signals', desc: 'Alerts you immediately when a trend line is breached with volume confirmation.' }
        ];
    }
  };

  useGSAP(() => {
    // Reveal section items on scroll
    gsap.from('.coming-soon-info h2, .coming-soon-info p, .coming-soon-info .indicator-features li', {
      x: -50,
      opacity: 0,
      stagger: 0.1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      }
    });

    gsap.from('.pricing-cards-container', {
      x: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      }
    });

    // SVG Chart Animations
    // 1. Grid line entrances
    gsap.from('.chart-grid-line', {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'left',
      stagger: 0.08,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: chartRef.current,
        start: 'top 75%'
      }
    });

    // 2. Candlesticks entrance
    const candlesticks = gsap.utils.toArray('.chart-candle');
    gsap.set(candlesticks, { scaleY: 0, opacity: 0, transformOrigin: 'bottom' });
    gsap.to(candlesticks, {
      scaleY: 1,
      opacity: 1,
      stagger: 0.05,
      duration: 0.8,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: chartRef.current,
        start: 'top 75%'
      }
    });

    // 3. Trend Lines Draw-in Effect
    gsap.fromTo('.trend-line-path', 
      { strokeDashoffset: 600 },
      {
        strokeDashoffset: 0,
        duration: 2,
        ease: 'power2.out',
        stagger: 0.4,
        scrollTrigger: {
          trigger: chartRef.current,
          start: 'top 70%'
        }
      }
    );

    // 4. Pattern Fill & Signal reveal
    gsap.from('.pattern-fill, .pattern-label, .breakout-signal', {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      delay: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: chartRef.current,
        start: 'top 70%'
      }
    });

    // 5. Target Zone pulse
    gsap.fromTo('.target-zone', 
      { opacity: 0.3, scale: 0.98 },
      {
        opacity: 0.9,
        scale: 1.02,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      }
    );

  }, { scope: sectionRef });

  // Handle plan card clicks
  const selectPlanType = (plan) => {
    setSelectedPlan(plan);
    if (onPrebook) {
      onPrebook(plan, indicator);
    }
  };

  // SVG Chart candlestick points
  const candleData = [
    { x: 30, o: 170, h: 140, l: 190, c: 150, bull: true },
    { x: 65, o: 150, h: 110, l: 160, c: 120, bull: true },
    { x: 100, o: 120, h: 115, l: 145, c: 140, bull: false },
    { x: 135, o: 140, h: 90, l: 150, c: 100, bull: true },
    { x: 170, o: 100, h: 95, l: 130, c: 125, bull: false },
    { x: 205, o: 125, h: 80, l: 135, c: 90, bull: true },
    { x: 240, o: 90, h: 85, l: 115, c: 110, bull: false },
    { x: 275, o: 110, h: 70, l: 120, c: 80, bull: true },
    // Breakout Candle!
    { x: 310, o: 80, h: 30, l: 90, c: 40, bull: true },
    { x: 345, o: 40, h: 10, l: 50, c: 20, bull: true },
  ];

  return (
    <section className="coming-soon-section" id="prebook" ref={sectionRef}>
      <div className="section-header">
        <div className="card-badge coming-soon-badge">{indicator ? `INDICATOR ${indicator.status.toUpperCase()}` : 'INDICATOR COMING SOON'}</div>
        <h2>{indicator ? indicator.title : "Auto Trend Line Generator"}</h2>
        <p>{indicator ? indicator.desc : "Unlock high-probability trend lines and automatic chart pattern detection directly inside your charting interface."}</p>
      </div>

      {allIndicators && allIndicators.length > 0 && (
        <div className="indicator-selector-tabs" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '6px',
          borderRadius: '40px',
          maxWidth: 'fit-content',
          margin: '0 auto 3rem auto',
          backdropFilter: 'blur(10px)'
        }}>
          {allIndicators.map((ind) => {
            const isActive = indicator && indicator._id === ind._id;
            return (
              <button
                key={ind._id}
                type="button"
                onClick={() => setActiveIndicator(ind)}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '30px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-blue) 100%)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 4px 15px rgba(189, 0, 255, 0.3)' : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {ind.title.replace('Ciper ', '')}
              </button>
            );
          })}
        </div>
      )}

      <div className="coming-soon-container vertical-stack">
        {/* Row 1: Info & SVG Chart */}
        <div className="coming-soon-top-row">
          <div className="coming-soon-info-col">
            <div className="coming-soon-info">
              <h3>Automate Your Technical Analysis</h3>
              <p>
                Manual charting is prone to bias, fatigue, and human error. The <strong>{indicator ? indicator.title : 'Ciper'}</strong> system scans structures continuously to deliver institutional-grade analysis.
              </p>
              <ul className="indicator-features">
                {getIndicatorCapabilities(indicator).map((feat, idx) => (
                  <li key={idx}>
                    <span className="feature-icon">{feat.icon}</span>
                    <div className="feature-text">
                      <h4>{feat.title}</h4>
                      <p>{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="coming-soon-chart-col">
            {/* SVG Animated Chart Mockup (Rendered directly in web, borderless) */}
            <div className="direct-chart-wrapper" ref={chartRef}>
              <div className="chart-floating-metrics">
                <span className="floating-metric">
                  <span className="indicator-dot"></span> Ciper TL (Trend Line) Scanner
                </span>
                <span className="floating-metric text-teal">ACTIVE SCAN</span>
                <span className="floating-metric">Probability: <strong className="text-green">94%</strong></span>
                <span className="floating-metric">Convergence: <strong className="text-blue">Multi-TF</strong></span>
              </div>

              <div className="svg-chart-container borderless">
                <svg viewBox="0 0 400 240" className="svg-chart">
                  <defs>
                    {/* Glowing line gradients */}
                    <linearGradient id="resistance-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bd00ff" />
                      <stop offset="100%" stopColor="#0057ff" />
                    </linearGradient>
                    <linearGradient id="support-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#12b3b3" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <radialGradient id="breakout-radial" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(18, 179, 179, 0.4)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>

                  {/* Grid Background Lines */}
                  <g className="chart-grid">
                    {[40, 80, 120, 160, 200].map((y, idx) => (
                      <line
                        key={idx}
                        className="chart-grid-line"
                        x1="10"
                        y1={y}
                        x2="390"
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    ))}
                  </g>

                  {/* Pattern Background Fill (Symmetrical Triangle Consolidation Zone) */}
                  <polygon
                    className="pattern-fill"
                    points="35,170 310,80 35,115"
                    fill="rgba(189, 0, 255, 0.03)"
                    stroke="rgba(189, 0, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />

                  {/* Candlesticks */}
                  <g className="chart-candlesticks">
                    {candleData.map((d, i) => {
                      const color = d.bull ? 'var(--candle-bull)' : 'var(--candle-bear)';
                      const yRect = Math.min(d.o, d.c);
                      const hRect = Math.max(d.o, d.c) - yRect || 3;
                      return (
                        <g key={i} className="chart-candle" style={{ transformOrigin: `${d.x + 6}px 240px` }}>
                          {/* Shadow wick */}
                          <line x1={d.x + 6} y1={d.h} x2={d.x + 6} y2={d.l} stroke={color} strokeWidth="1.5" opacity="0.8" />
                          {/* Candlestick body */}
                          <rect x={d.x} y={yRect} width="12" height={hRect} fill={color} rx="2" />
                        </g>
                      );
                    })}
                  </g>

                  {/* AI Auto-Trend Lines (Animated Path) */}
                  {/* 1. Resistance Trend Line (Descending) */}
                  <path
                    className="trend-line-path resistance-line"
                    d="M 25 105 L 390 70"
                    stroke="url(#resistance-glow)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="600"
                    strokeDashoffset="600"
                    filter="drop-shadow(0 0 4px rgba(189,0,255,0.4))"
                  />

                  {/* 2. Support Trend Line (Ascending) */}
                  <path
                    className="trend-line-path support-line"
                    d="M 25 190 L 390 60"
                    stroke="url(#support-glow)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="600"
                    strokeDashoffset="600"
                    filter="drop-shadow(0 0 4px rgba(18,179,179,0.4))"
                  />

                  {/* Breakout Target Zone */}
                  <g className="target-zone" style={{ transformOrigin: '330px 40px' }}>
                    <circle cx="330" cy="40" r="16" fill="url(#breakout-radial)" />
                    <circle cx="330" cy="40" r="4" fill="var(--accent-teal)" />
                    <line x1="310" y1="40" x2="350" y2="40" stroke="var(--accent-teal)" strokeWidth="0.75" strokeDasharray="2,2" />
                    <line x1="330" y1="20" x2="330" y2="60" stroke="var(--accent-teal)" strokeWidth="0.75" strokeDasharray="2,2" />
                  </g>

                  {/* Pattern labels & overlays */}
                  <g className="pattern-label">
                    <rect x="55" y="200" width="150" height="22" fill="rgba(10, 10, 12, 0.85)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" rx="4" />
                    <text x="65" y="214" fill="var(--text-muted)" fontSize="8.5" fontFamily="'Outfit', sans-serif">
                      Pattern: <tspan fill="#fff" fontWeight="bold">Symmetrical Triangle</tspan>
                    </text>
                  </g>

                  {/* Breakout Signal Badge */}
                  <g className="breakout-signal">
                    <rect x="235" y="10" width="135" height="24" fill="rgba(16, 185, 129, 0.12)" stroke="var(--success-color)" strokeWidth="1" rx="6" />
                    <text x="302" y="25" fill="var(--success-color)" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="'Outfit', sans-serif" letterSpacing="0.5">
                      ⚡ BREAKOUT CONFIRMED
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Exclusive Launch Pricing */}
        <div className="coming-soon-pricing-row">
          <div className="pricing-cards-container centered-pricing">
            <h3>Exclusive Pre-Book Discount Pricing</h3>
            <div style={{ fontSize: '0.78rem', color: '#bd00ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.2rem', display: 'inline-block', padding: '4px 14px', background: 'rgba(189, 0, 255, 0.08)', borderRadius: '20px', border: '1px solid rgba(189, 0, 255, 0.2)' }}>
              🎯 Plan for: {indicator ? indicator.title : 'Ciper Indicator'}
            </div>
            <p>
              {referralDiscount.discountPercent > 0 
                ? `Referral discount code "${referralDiscount.code}" applied! (${referralDiscount.discountPercent}% OFF waitlist pricing).` 
                : 'Secure early access pricing now. Subscriptions will launch at higher prices after the beta period.'}
            </p>
            
            <div className="pricing-cards-grid">
              {/* Monthly pricing card */}
              <div 
                className={`pricing-card-option ${selectedPlan === 'monthly' ? 'active' : ''}`}
                onClick={() => selectPlanType('monthly')}
              >
                <div className="pricing-badge">{referralDiscount.discountPercent > 0 ? `${25 + referralDiscount.discountPercent}% OFF` : '25% OFF'}</div>
                <h4>Monthly Access</h4>
                <div className="pricing-amount">
                  <span className="price-strike">₹{indicator ? indicator.monthlyStrikePrice : systemConfig.monthlyStrikePrice}</span>
                  <span className="price-discount">₹{monthlyPrice}</span>
                  <span className="price-period">/ month</span>
                </div>
                <div className="price-efficiency-tag">Only ₹{Math.round(monthlyPrice / 30 * 10) / 10} / day</div>
                <ul className="price-features-list">
                  {getIndicatorCapabilities(indicator).slice(0, 2).map((feat, i) => (
                    <li key={i}>{feat.title}</li>
                  ))}
                  <li>Real-time Browser Alerts</li>
                  <li>Multi-device sync</li>
                </ul>
                <button 
                  type="button" 
                  className="btn-select-plan"
                  onClick={(e) => { e.stopPropagation(); selectPlanType('monthly'); }}
                >
                  {systemConfig.indicatorMode === 'prebook' ? 'Pre-Book Monthly' : 'Book Monthly'}
                </button>
              </div>

              {/* Annual pricing card */}
              <div 
                className={`pricing-card-option best-value-card ${selectedPlan === 'annual' ? 'active' : ''}`}
                onClick={() => selectPlanType('annual')}
              >
                <div className="best-value-ribbon">BEST VALUE</div>
                <div className="pricing-badge">{referralDiscount.discountPercent > 0 ? `${17 + referralDiscount.discountPercent}% OFF` : '17% OFF'}</div>
                <h4>Annual Access</h4>
                <div className="pricing-amount">
                  <span className="price-strike">₹{indicator ? indicator.annualStrikePrice : systemConfig.annualStrikePrice}</span>
                  <span className="price-discount">₹{annualPrice}</span>
                  <span className="price-period">/ year</span>
                </div>
                <div className="price-efficiency-tag">Only ₹{Math.round(annualPrice / 365 * 10) / 10} / day</div>
                <ul className="price-features-list">
                  {getIndicatorCapabilities(indicator).map((feat, i) => (
                    <li key={i}>{feat.title}</li>
                  ))}
                  <li>Premium Priority Support</li>
                  <li>Beta Tester Slack Group</li>
                </ul>
                <button 
                  type="button" 
                  className="btn-select-plan"
                  onClick={(e) => { e.stopPropagation(); selectPlanType('annual'); }}
                >
                  {systemConfig.indicatorMode === 'prebook' ? 'Pre-Book Annual' : 'Book Annual'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

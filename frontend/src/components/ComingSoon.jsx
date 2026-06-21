import React, { useState, useRef } from 'react';
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
  monthlyPrice = 299,
  annualPrice = 999
}) {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const sectionRef = useRef(null);
  const chartRef = useRef(null);

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
      onPrebook(plan);
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
        <div className="card-badge coming-soon-badge">INDICATOR COMING SOON</div>
        <h2>Auto Trend Line Generator</h2>
        <p>Unlock high-probability trend lines and automatic chart pattern detection directly inside your charting interface.</p>
      </div>

      <div className="coming-soon-container vertical-stack">
        {/* Row 1: Info & SVG Chart */}
        <div className="coming-soon-top-row">
          <div className="coming-soon-info-col">
            <div className="coming-soon-info">
              <h3>Automate Your Technical Analysis</h3>
              <p>
                Manual charting is prone to bias, fatigue, and human error. The <strong>Ciper Auto Trend Line Generator</strong> continuously scans multi-timeframe structures to deliver institutional-grade analysis.
              </p>
              <ul className="indicator-features">
                <li>
                  <span className="feature-icon">📈</span>
                  <div className="feature-text">
                    <h4>High-Probability Auto Trend Lines</h4>
                    <p>Calculates mathematical swing pivots and automatically connects them with precise support/resistance vector lines.</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">🔍</span>
                  <div className="feature-text">
                    <h4>Multi-Timeframe Chart Patterns</h4>
                    <p>Instantly flags triangles, wedges, channels, and head-and-shoulders across 1H, 4H, and 1D timeframes.</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">⚡</span>
                  <div className="feature-text">
                    <h4>Real-Time Breakout Signals</h4>
                    <p>Alerts you immediately when a trend line is breached with strong volume confirmation.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="coming-soon-chart-col">
            {/* SVG Animated Chart Mockup (Rendered directly in web, borderless) */}
            <div className="direct-chart-wrapper" ref={chartRef}>
              <div className="chart-floating-metrics">
                <span className="floating-metric">
                  <span className="indicator-dot"></span> Auto Trend Line Scanner (H4)
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
                  <span className="price-strike">₹{systemConfig.monthlyStrikePrice}</span>
                  <span className="price-discount">₹{monthlyPrice}</span>
                  <span className="price-period">/ month</span>
                </div>
                <div className="price-efficiency-tag">Only ₹{Math.round(monthlyPrice / 30 * 10) / 10} / day</div>
                <ul className="price-features-list">
                  <li>Full Indicator Suite</li>
                  <li>Auto Trend Line Generator</li>
                  <li>H4 & D1 Chart Patterns</li>
                  <li>Real-time Browser Alerts</li>
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
                  <span className="price-strike">₹{systemConfig.annualStrikePrice}</span>
                  <span className="price-discount">₹{annualPrice}</span>
                  <span className="price-period">/ year</span>
                </div>
                <div className="price-efficiency-tag">Only ₹{Math.round(annualPrice / 365 * 10) / 10} / day</div>
                <ul className="price-features-list">
                  <li>Full Indicator Suite</li>
                  <li>Auto Trend Line Generator</li>
                  <li>All Timeframes Active</li>
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

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from './components/Logo';
import PrebookForm from './components/PrebookForm';
import CustomCursor from './components/CustomCursor';
import AnimatedChart from './components/AnimatedChart';
import Marquee from './components/Marquee';
import ParticleWave from './components/ParticleWave';
import NeuralOrb from './components/NeuralOrb';
import RadarScanner from './components/RadarScanner';
import StarField from './components/StarField';


gsap.registerPlugin(ScrollTrigger);

function App() {
  const container = useRef();
  const heroMockupWrapperRef = useRef();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Shrink navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const reviews = [
    {
      quote: "Works like absolute magic. The neural pattern scanner marks structural zones in seconds. Completely optimized my entries and exit speeds.",
      user: "@Mishatrading",
      avatar: "MT",
      role: "Pro Crypto Trader"
    },
    {
      quote: "The auto support & resistance overlays are incredibly precise. It maps liquidity pools exactly where institutional orders sit. Highly recommend.",
      user: "@NazarBuch",
      avatar: "NB",
      role: "Forex Specialist"
    },
    {
      quote: "Ciper's convergence metrics have saved me hours of analysis. Seeing multiple mathematical indicators align in real-time is a complete cheat code.",
      user: "@CryptoApex",
      avatar: "CA",
      role: "Equity Analyst"
    }
  ];

  const nextReview = () => {
    gsap.to('.testimonial-card', {
      rotateY: -15,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
        gsap.fromTo('.testimonial-card', 
          { rotateY: 15, opacity: 0 },
          { rotateY: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
  };

  const prevReview = () => {
    gsap.to('.testimonial-card', {
      rotateY: 15,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setActiveReviewIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
        gsap.fromTo('.testimonial-card', 
          { rotateY: -15, opacity: 0 },
          { rotateY: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
  };

  const faqs = [
    {
      q: "How does Ciper detect pattern zones?",
      a: "Ciper scans historical and real-time candlestick data across multiple timeframes, calculating mathematical standard deviations and liquidity imbalances to map pattern zones."
    },
    {
      q: "Is Ciper suitable for beginners?",
      a: "Yes. Ciper takes complex institutional concepts (like support/resistance nodes and multi-indicator convergence) and translates them into simple, clean visual cues on your chart."
    },
    {
      q: "Which assets and platforms does Ciper support?",
      a: "Ciper works across major asset classes including Cryptocurrencies, Forex, and Stocks. It is designed to integrate seamlessly with major charting platforms like TradingView."
    },
    {
      q: "What does the early access waitlist include?",
      a: "Joining the waitlist secures your early access slot, exclusive discounted pricing upon launch, and access to private beta testing groups."
    }
  ];

  const roadmapSteps = [
    {
      num: "01",
      title: "Market Ingestion",
      desc: "Ciper ingests real-time tick data, order books, and volume metrics from top-tier exchanges."
    },
    {
      num: "02",
      title: "Neural Engine Mapping",
      desc: "Our deep learning models identify candlestick structures and highlight key support and resistance vectors."
    },
    {
      num: "03",
      title: "Convergence & Trigger",
      desc: "When multiple mathematical edges align, Ciper overlays high probability 'Kill Zones' directly on your chart."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useGSAP(() => {
    // Navbar entrance
    gsap.from('.navbar-wrapper', { 
      y: -100, 
      opacity: 0, 
      duration: 1.2, 
      ease: 'power4.out', 
      delay: 0.2 
    });
    
    // Staggered text reveal for hero
    const heroTl = gsap.timeline();
    heroTl.from('.hero h1 span', { 
      y: 60, 
      opacity: 0, 
      duration: 1, 
      ease: 'power4.out', 
      stagger: 0.08 
    })
    .from('.hero p', { 
      y: 30, 
      opacity: 0, 
      duration: 0.8, 
      ease: 'power3.out' 
    }, "-=0.6")
    .from('.hero-buttons', { 
      y: 30, 
      opacity: 0, 
      duration: 0.8, 
      ease: 'power3.out' 
    }, "-=0.6")
    .from('.floating-3d-asset', {
      scale: 0.5,
      opacity: 0,
      duration: 1.4,
      ease: 'back.out(1.5)'
    }, "-=1.0");

    // Float loop for the 3D crystal torus
    gsap.to('.floating-3d-asset', {
      y: -25,
      rotation: 6,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Float loop for margin decorations
    gsap.to('.decor-left-1', {
      y: -20,
      rotation: 8,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    gsap.to('.decor-right-1', {
      y: 20,
      rotation: -6,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.3
    });
    
    gsap.to('.decor-left-2', {
      y: 15,
      rotation: -10,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    gsap.to('.decor-right-2', {
      y: -15,
      rotation: 8,
      duration: 5.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.2
    });

    gsap.to('.decor-left-3', {
      y: -12,
      rotation: 6,
      duration: 4.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    gsap.to('.decor-right-3', {
      y: 15,
      rotation: -8,
      duration: 5.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.4
    });

    // Stats Bar Cards Scroll Reveal
    gsap.from('.stat-bar-card', {
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.stats-dashboard-section',
        start: 'top 85%'
      }
    });

    // Bento section title reveal
    gsap.from('.section-header h2', {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.bento-section',
        start: 'top 80%',
      }
    });

    gsap.from('.section-header p', {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.bento-section',
        start: 'top 75%',
      }
    });

    // Bento Cards Scroll Stagger Reveal
    gsap.from('.bento-card', {
      y: 80,
      opacity: 0,
      stagger: 0.15,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.bento-grid',
        start: 'top 85%'
      }
    });

    // Radial Dial & Accuracy Counter Animation
    const countObj = { val: 0 };
    gsap.to(countObj, {
      val: 94,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stat-accuracy-container',
        start: 'top 85%',
      },
      onUpdate: () => {
        const el = document.getElementById('accuracy-number');
        if (el) el.textContent = Math.round(countObj.val) + '%';
      }
    });
    
    gsap.to('.radial-progress-bar', {
      strokeDashoffset: 408 * (1 - 0.94),
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stat-accuracy-container',
        start: 'top 85%',
      }
    });

    // Convergence Card Progress Bars Animate on scroll
    gsap.to('.metric-progress-fill', {
      width: (i, el) => el.getAttribute('data-target-width') + '%',
      duration: 1.5,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.convergence-visual',
        start: 'top 85%',
      }
    });

    // Testimonials grid reveal
    gsap.from('.testimonials-grid-wrapper', {
      y: 50,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: 'top 80%'
      }
    });





    // Parallax scrolling for bento card SVG visuals
    gsap.to('.bento-card .card-visual svg', {
      y: -25,
      scrollTrigger: {
        trigger: '.bento-grid',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    // Magnetic Button & Link Hover Effect
    const magneticElements = gsap.utils.toArray('.magnetic-element');
    magneticElements.forEach((el) => {
      const handleMove = (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        gsap.to(el, {
          x: dx * 0.3,
          y: dy * 0.3,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const handleLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1.1, 0.4)'
        });
      };

      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
    });

    // Testimonial Cards 3D Tilt Hover Effect
    const testimonialCards = gsap.utils.toArray('.testimonial-card');
    testimonialCards.forEach((card) => {
      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(card, {
          rotateY: x * 0.04,
          rotateX: -y * 0.04,
          transformPerspective: 1000,
          ease: 'power3.out',
          duration: 0.5
        });
      };

      const handleLeave = () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          ease: 'power3.out',
          duration: 0.8
        });
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', handleLeave);
    });

  }, { scope: container });


  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={container} style={{ position: 'relative' }}>
      <CustomCursor />
      <StarField />
      
      {/* Dark Background Glow Orbs */}
      <div className="bg-animations">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {/* Floating Pill Navbar */}
      <div className="navbar-wrapper">
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
          <Logo color="var(--primary-color)" />
          <div className="nav-links">
            <a href="#features" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#testimonials" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Reviews</a>
            <a href="#roadmap" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('roadmap'); }}>Roadmap</a>
          </div>
          <button className="btn-primary magnetic-element" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }} onClick={() => setIsModalOpen(true)}>
            Get Started
          </button>
        </nav>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero" style={{ position: 'relative' }}>
          {/* Neon Purple Wave Grid Background Canvas */}
          <ParticleWave />
          
          {/* Floating SVG Concentric Neural Orb */}
          <NeuralOrb />

          <div className="hero-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h1>
              <span>Automate</span> <br /><span className="gradient">Your Market Edge</span>
            </h1>
            <p>
              Ciper uses advanced neural networks to map out the market in real-time. Detects intricate chart patterns, high probability kill zones, and draws dynamic trend lines automatically.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary magnetic-element" onClick={() => setIsModalOpen(true)}>
                Secure Early Access
              </button>
              <button className="btn-secondary" onClick={() => scrollToSection('features')}>
                Explore Features
              </button>
            </div>
          </div>
        </section>


        {/* Diagonal Scrolling Marquee for dynamic look */}
        <Marquee />

        {/* Live Performance Stats Dashboard Section */}
        <section className="stats-dashboard-section" id="stats">
          <div className="section-header">
            <span className="card-badge" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#d866ff', border: '1px solid rgba(189,0,255,0.2)' }}>Performance</span>
            <h2>Proven Intelligence Metrics</h2>
            <p>Live trading statistics and neural scanner efficiency tracked across major indicators.</p>
          </div>
          <div className="stats-bar-grid">
            <div className="stat-bar-card">
              <div className="stat-bar-num" style={{ color: '#bd00ff' }}>94%</div>
              <div className="stat-bar-label">Setup Accuracy</div>
              <div className="stat-bar-desc">Aggregated success rating recorded across validated neural breakout zones.</div>
            </div>
            <div className="stat-bar-card">
              <div className="stat-bar-num">53</div>
              <div className="stat-bar-label">Active Scans / Min</div>
              <div className="stat-bar-desc">Continuous real-time scans across multiple timeframes simultaneously.</div>
            </div>
            <div className="stat-bar-card">
              <div className="stat-bar-num" style={{ color: '#ef4444' }}>4%</div>
              <div className="stat-bar-label">Max Drawdown</div>
              <div className="stat-bar-desc">Minimal risk parameters enforced automatically by overlapping convergence zones.</div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="bento-section" id="features">
          {/* Floating Margin Decorations */}
          <svg className="decor-element decor-left-1" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <line x1="10" y1="90" x2="90" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="10" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="30" y1="10" x2="30" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="70" y1="10" x2="70" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 2" />
            <path d="M 10 80 Q 30 75 40 55 T 70 30 T 90 15" stroke="var(--primary-color)" strokeWidth="1.5" fill="none" />
            <path d="M 10 80 Q 30 75 40 55 T 70 30 T 90 15 L 90 90 L 10 90 Z" fill="url(#grad-left-1)" opacity="0.04" />
            <line x1="10" y1="80" x2="90" y2="15" stroke="var(--accent-blue)" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="40" cy="55" r="2" fill="var(--primary-color)" />
            <circle cx="70" cy="30" r="2" fill="var(--accent-blue)" />
            <circle cx="90" cy="15" r="3" fill="var(--accent-teal)" />
            <defs>
              <linearGradient id="grad-left-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="decor-element decor-right-1" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="18" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5" />
            <path d="M 50 50 A 8 8 0 0 1 50 58" stroke="var(--primary-color)" strokeWidth="1" />
            <path d="M 50 58 A 13 13 0 0 1 37 50" stroke="var(--accent-blue)" strokeWidth="1" />
            <path d="M 37 50 A 21 21 0 0 1 50 29" stroke="var(--accent-teal)" strokeWidth="1" />
            <path d="M 50 29 A 34 34 0 0 1 84 50" stroke="var(--primary-color)" strokeWidth="1.2" />
            <path d="M 84 50 A 55 55 0 0 1 50 105" stroke="var(--accent-blue)" strokeWidth="1.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          </svg>

          <div className="section-header">
            <div className="card-badge" style={{ background: 'rgba(12, 179, 179, 0.1)', color: 'var(--primary-color)' }}>Capabilities</div>
            <h2>Smarter Analysis. Faster Execution.</h2>
            <p>
              Ciper integrates complex institutional trading strategies into a single visual suite powered by neural models.
            </p>
          </div>

          <div className="bento-grid">
            
            {/* Card 1: Neural Pattern Detection */}
            <div className="bento-card col-span-2">
              <div className="card-header-details">
                <span className="card-badge">Neural Scanning</span>
                <h3 className="card-title">Auto Chart Pattern Detection</h3>
                <p className="card-description">
                  Stop missing structural breakouts. Ciper continuously deciphers complex price formations—like wedges, double bottoms, and head-and-shoulders patterns—and marks them out in real-time.
                </p>
              </div>
              <div className="card-visual" style={{ padding: '2rem', minHeight: '260px' }}>
                <AnimatedChart />
              </div>
            </div>

            {/* Card 2: Support & Resistance */}
            <div className="bento-card">
              <div className="card-header-details">
                <span className="card-badge">Liquidity</span>
                <h3 className="card-title">Dynamic S&R Mapping</h3>
                <p className="card-description">
                  Maps out high-volume nodes and liquidity centers dynamically. Detects structural zones of institutional supply and demand.
                </p>
              </div>
              <div className="card-visual" style={{ minHeight: '220px' }}>
                <div className="sr-visual-container">
                  <div className="sr-line-wrapper">
                    <div className="sr-line resistance">
                      <div className="sr-label resistance">RESISTANCE NODE: $68,400</div>
                    </div>
                  </div>
                  <div className="sr-pulse-dot">
                    ⚡
                  </div>
                  <div className="sr-line-wrapper">
                    <div className="sr-line support">
                      <div className="sr-label support">SUPPORT POOL: $66,100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Circular Dial Setup Accuracy */}
            <div className="bento-card">
              <div className="card-header-details">
                <span className="card-badge">Probability</span>
                <h3 className="card-title">Mathematical Advantage</h3>
                <p className="card-description">
                  Leverages multi-timeframe confirmation models to display probability ratings for every breakout setup.
                </p>
              </div>
              <div className="card-visual" style={{ minHeight: '220px' }}>
                <div className="stat-accuracy-container">
                  <div className="radial-progress-wrapper">
                    <svg className="radial-progress-svg">
                      <circle className="radial-progress-bg" cx="70" cy="70" r="65" />
                      <circle className="radial-progress-bar" cx="70" cy="70" r="65" />
                    </svg>
                    <div className="radial-text">
                      <div id="accuracy-number" className="radial-number">0%</div>
                      <div className="radial-label">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Neural Signal Convergence */}
            <div className="bento-card col-span-2">
              <div className="card-header-details">
                <span className="card-badge">Synergy</span>
                <h3 className="card-title">High Probability Convergence</h3>
                <p className="card-description">
                  When indicators align at the exact same price levels, Ciper signals high-probability "Kill Zones", providing optimal risk-to-reward parameters automatically.
                </p>
              </div>
              <div className="card-visual" style={{ minHeight: '240px' }}>
                <div className="convergence-visual">
                  <div className="signal-metric">
                    <div className="metric-label">Trend Alignment</div>
                    <div className="metric-value">
                      Bullish <span className="metric-badge high">STRONG</span>
                    </div>
                    <div className="metric-progress">
                      <div className="metric-progress-fill" data-target-width="90"></div>
                    </div>
                  </div>
                  <div className="signal-metric">
                    <div className="metric-label">Liquidity Cluster</div>
                    <div className="metric-value">
                      92% <span className="metric-badge high" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)' }}>Institutional</span>
                    </div>
                    <div className="metric-progress">
                      <div className="metric-progress-fill" data-target-width="92"></div>
                    </div>
                  </div>
                  <div className="signal-metric">
                    <div className="metric-label">Neural Confirmation</div>
                    <div className="metric-value">
                      89% <span className="metric-badge high">PASS</span>
                    </div>
                    <div className="metric-progress">
                      <div className="metric-progress-fill" data-target-width="89"></div>
                    </div>
                  </div>
                  <div className="signal-metric">
                    <div className="metric-label">Convergence Score</div>
                    <div className="metric-value" style={{ color: 'var(--primary-color)' }}>
                      9.4 / 10
                    </div>
                    <div className="metric-progress">
                      <div className="metric-progress-fill" data-target-width="94" style={{ background: 'var(--primary-color)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section" id="testimonials">
          <div className="section-header">
            <span className="card-badge" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#d866ff', border: '1px solid rgba(189,0,255,0.2)' }}>Community</span>
            <h2>Subscriber Reviews</h2>
            <p>Real feedback from beta members executing trades using Ciper's automated analysis zones.</p>
          </div>

          <div className="testimonials-grid-wrapper">
            {/* Left Card: Mishatrading */}
            <div className="testimonial-card">
              <div className="testimonial-quote">
                Works like absolute magic. The neural pattern scanner marks structural zones in seconds. Completely optimized my entries and exit speeds. 👍
              </div>
              <div className="testimonial-user">
                <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #bd00ff, #0057ff)' }}>MT</div>
                <div className="user-details">
                  <h4>@Mishatrading</h4>
                  <span>Community Member</span>
                </div>
              </div>
            </div>

            {/* Middle: Interactive Cybernetic Radar Scanner */}
            <div className="bull-head-container">
              <RadarScanner />
            </div>


            {/* Right Card: NazarBuch */}
            <div className="testimonial-card">
              <div className="testimonial-quote">
                The auto support & resistance overlays are incredibly precise. It maps liquidity pools exactly where institutional orders sit. Highly recommend!
              </div>
              <div className="testimonial-user">
                <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #0057ff, #bd00ff)' }}>NB</div>
                <div className="user-details">
                  <h4>@NazarBuch</h4>
                  <span>Investor / Copy-trader</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / How it Works Section */}
        <section className="roadmap-section" id="roadmap">
          {/* Floating Margin Decorations */}
          <svg className="decor-element decor-left-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="45" stroke="var(--primary-color)" strokeWidth="0.5" strokeDasharray="10 5 2 5" opacity="0.6" />
            <circle cx="50" cy="50" r="35" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="25" stroke="var(--accent-blue)" strokeWidth="1" strokeDasharray="30 15" />
            <circle cx="50" cy="50" r="15" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="5" fill="var(--accent-teal)" opacity="0.4" />
            <path d="M 50 2 L 50 8 M 50 92 L 50 98 M 2 50 L 8 50 M 92 50 L 98 50" stroke="var(--primary-color)" strokeWidth="1.2" />
            <line x1="20" y1="20" x2="25" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="80" y1="80" x2="75" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="20" y1="80" x2="25" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="80" y1="20" x2="75" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          </svg>
          <svg className="decor-element decor-right-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <line x1="15" y1="20" x2="50" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
            <line x1="50" y1="40" x2="85" y2="25" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
            <line x1="50" y1="40" x2="40" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
            <line x1="40" y1="75" x2="75" y2="85" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
            <line x1="15" y1="20" x2="40" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="85" y1="25" x2="75" y2="85" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy="40" r="7" stroke="var(--primary-color)" strokeWidth="0.5" opacity="0.3" />
            <circle cx="40" cy="75" r="6" stroke="var(--accent-blue)" strokeWidth="0.5" opacity="0.3" />
            <circle cx="15" cy="20" r="3" fill="var(--accent-teal)" />
            <circle cx="50" cy="40" r="4.5" fill="var(--primary-color)" />
            <circle cx="85" cy="25" r="3.5" fill="var(--accent-blue)" />
            <circle cx="40" cy="75" r="4" fill="var(--accent-blue)" />
            <circle cx="75" cy="85" r="3" fill="var(--primary-color)" />
          </svg>

          <div className="section-header">
            <span className="card-badge" style={{ background: 'rgba(18, 179, 179, 0.1)', color: 'var(--primary-color)' }}>Engine</span>
            <h2>Our Process Engine</h2>
            <p>Here is how the neural model processes raw price feeds into highly actionable charting zones.</p>
          </div>
          <div className="roadmap-grid">
            {roadmapSteps.map((step, idx) => (
              <div key={idx} className="roadmap-card">
                <div className="roadmap-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section Removed */}

      </main>

      {/* Rich Detailed Footer */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '800', fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem' }}>
              ⚡ Ciper AI
            </div>
            <p>
              An analytical neural network that deciphers complex order books and chart patterns into clean visual price zones automatically.
            </p>
          </div>
          <div className="footer-column">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#roadmap">Process Engine</a></li>
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Pre-Book</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Beta Access</a></li>
              <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Documentation</a></li>
              <li><a href="https://t.me/" target="_blank" rel="noreferrer">Telegram Channel</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Risk Warning</a></li>
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Privacy Policy</a></li>
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="disclaimer-text">
            <strong>INDICATOR RISK DISCLAIMER:</strong> Trading financial instruments, including cryptocurrencies, stocks, indices, and foreign exchange (Forex), involves a high degree of risk and can result in the loss of your capital. Past performance indicators, automated patterns, or AI convergence alerts generated by Ciper are not guarantees or reliable predictions of future market results. All content and visual pattern tools provided on this website are for general educational, analytical, and informational purposes only. Ciper is not a registered financial advisor, broker, or custodian, and does not provide financial, investment, tax, or legal advice. Users are solely responsible for managing their risk and executing trades.
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Ciper AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modal Popup Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            <PrebookForm />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

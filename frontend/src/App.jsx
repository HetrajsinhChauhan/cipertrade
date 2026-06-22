import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from './components/Logo';
import PrebookForm from './components/PrebookForm';
import AnimatedChart from './components/AnimatedChart';
import Marquee from './components/Marquee';
import ParticleWave from './components/ParticleWave';
import NeuralOrb from './components/NeuralOrb';
import RadarScanner from './components/RadarScanner';
import StarField from './components/StarField';
import ComingSoon from './components/ComingSoon';
import AdminPanel from './components/AdminPanel';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin
);



gsap.registerPlugin(ScrollTrigger);

function App() {
  const container = useRef();
  const heroMockupWrapperRef = useRef();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState('annual');
  const [modalType, setModalType] = useState('promo');
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Routing state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);



  // System dynamic configuration
  const [systemConfig, setSystemConfig] = useState({
    monthlyDiscountPrice: 299,
    monthlyStrikePrice: 399,
    annualDiscountPrice: 999,
    annualStrikePrice: 1200,
    indicatorMode: 'prebook'
  });

  // Referral discount tracking
  const [referralDiscount, setReferralDiscount] = useState({
    code: '',
    discountPercent: 0,
    name: ''
  });

  // Setup routing listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate-changed', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate-changed', handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    const event = new Event('pushstate-changed');
    window.dispatchEvent(event);
  };

  // Fetch configuration settings on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setSystemConfig(data);
        }
      } catch (err) {
        console.error('Error fetching settings config:', err);
      }
    };
    fetchConfig();
  }, []);

  // Detect referral parameter ?ref=CODE from url query on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      const registerClick = async () => {
        try {
          const res = await fetch(`${API_URL}/api/referrals/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: refCode })
          });
          if (res.ok) {
            const data = await res.json();
            setReferralDiscount({
              code: data.code,
              discountPercent: data.discountPercent,
              name: data.name
            });
            sessionStorage.setItem('ciper_referral_code', data.code);
          }
        } catch (err) {
          console.error('Error registering referral click:', err);
        }
      };
      registerClick();
    }
  }, []);



  const getMonthlyPrice = () => {
    const basePrice = systemConfig.monthlyDiscountPrice;
    if (referralDiscount.discountPercent > 0) {
      return Math.round(basePrice * (1 - referralDiscount.discountPercent / 100));
    }
    return basePrice;
  };

  const getAnnualPrice = () => {
    const basePrice = systemConfig.annualDiscountPrice;
    if (referralDiscount.discountPercent > 0) {
      return Math.round(basePrice * (1 - referralDiscount.discountPercent / 100));
    }
    return basePrice;
  };


  const heroSlides = [
    {
      badge: "Ciper AI Platform",
      titleSpan1: "Automate",
      titleSpan2: "Your Market Edge",
      desc: "Ciper uses advanced neural networks to map out the market in real-time. Detects support/resistance zones, high-probability convergence areas, and breakouts automatically.",
      primaryBtnText: "Explore Features",
      primaryAction: () => scrollToSection('features'),
      secondaryBtnText: "Join Waitlist",
      secondaryAction: () => openPrebookModal('annual')
    },
    {
      badge: "Featured Indicator",
      titleSpan1: "Ciper TL",
      titleSpan2: "Trend Scanner",
      desc: "Automatically plot high-probability trend lines and identify chart pattern breakout zones in higher timeframes (H1, H4, D1).",
      primaryBtnText: "Pre-Book Now",
      primaryAction: () => openPrebookModal('annual'),
      secondaryBtnText: "Learn More",
      secondaryAction: () => scrollToSection('prebook')
    }
  ];

  const openPrebookModal = (plan) => {
    setModalPlan(plan || 'annual');
    setModalType('form');
    setIsModalOpen(true);
  };

  // Show promo modal on page start
  useEffect(() => {
    setIsModalOpen(true);
    setModalType('promo');
  }, []);

  // Auto-close promo modal after 4 seconds
  useEffect(() => {
    if (isModalOpen && modalType === 'promo') {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, modalType]);

  // Refresh ScrollTrigger after layout settles to prevent cached calculation mismatch on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto rotate hero slides every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

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

  // Disable body scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isModalOpen]);

  // Route Guard for Admin Panel
  if (currentPath === '/adminhetraj') {
    return <AdminPanel />;
  }


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

  const indicatorReleaseList = [
    {
      title: "Ciper TL (Trend Line)",
      desc: "Plots high-probability trend lines and automatically highlights chart pattern breakout vectors in H1/H4 timeframes.",
      status: "Beta Testing",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="3"></line><circle cx="3" cy="21" r="2"></circle><circle cx="21" cy="3" r="2"></circle></svg>
      )
    },
    {
      title: "Ciper Volume Profile",
      desc: "Visualizes institutional volume distribution, Point of Control (POC), and high-volume nodes directly on your Y-axis.",
      status: "Coming Soon",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="4" height="16" rx="1"></rect><rect x="9" y="8" width="8" height="12" rx="1"></rect><rect x="19" y="11" width="2" height="9" rx="1"></rect></svg>
      )
    },
    {
      title: "Ciper Liquidity Grab",
      desc: "Tracks retail stop-loss clusters and alerts you to potential stop-hunts and manipulation zones prior to major market pivots.",
      status: "Coming Soon",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      )
    },
    {
      title: "Ciper Order Flow (Delta)",
      desc: "Analyzes real-time delta imbalances, institutional market orders, and aggressive buying/selling activity inside candles.",
      status: "Under Dev",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h6M18 12h6M18 16h6M2 8h8M2 12h14M2 16h10"></path></svg>
      )
    },
    {
      title: "Ciper Breakout Wave",
      desc: "A neural classifier that scans multiple timeframes simultaneously to flag ascending triangles, flags, and wedge breakouts.",
      status: "Under Dev",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
      )
    },
    {
      title: "Ciper Momentum Oscillator",
      desc: "A noise-filtered oscillator that uses neural smoothing models to identify overbought/oversold exhaustion zones.",
      status: "Coming Soon",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-9 4 18 3-10 3 1h3"></path></svg>
      )
    },
    {
      title: "Ciper Imbalance (FVG) Scanner",
      desc: "Scans for institutional Fair Value Gaps and imbalance zones, pinpointing potential magnetic areas for price draw.",
      status: "Coming Soon",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="5" rx="1"></rect><rect x="3" y="16" width="18" height="5" rx="1"></rect><path d="M5 12h14" strokeDasharray="3 3"></path><circle cx="12" cy="12" r="2" fill="currentColor"></circle></svg>
      )
    },
    {
      title: "Ciper Neural Trend Predictor",
      desc: "Utilizes deep neural models to evaluate historical velocity and project the mathematical direction of the next 3 candles.",
      status: "R&D Phase",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2"></circle><circle cx="14" cy="7" r="2"></circle><circle cx="14" cy="17" r="2"></circle><circle cx="20" cy="12" r="2"></circle><line x1="8" y1="11" x2="12" y2="8"></line><line x1="8" y1="13" x2="12" y2="16"></line><line x1="16" y1="8" x2="18" y2="11"></line><line x1="16" y1="16" x2="18" y2="13"></line><path d="M2 12h2" strokeWidth="1.5"></path><path d="M12 2v2M12 20v2" strokeWidth="1.5"></path></svg>
      )
    },
    {
      title: "Ciper Multi-Market Correlation",
      desc: "Calculates real-time macro-correlations between crypto, forex, and equity indices to alert you of divergence zones.",
      status: "Under Dev",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6"></circle><circle cx="15" cy="15" r="6"></circle><path d="M10 4a6 6 0 0 1 0 12"></path></svg>
      )
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

    // Global Section Headers Scroll Reveal
    gsap.utils.toArray('.section-header').forEach((header) => {
      gsap.from(header.querySelectorAll('h2, p, .card-badge'), {
        y: 45,
        opacity: 0,
        stagger: 0.12,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%'
        }
      });
    });

    // Roadmap Cards Scroll Reveal
    gsap.from('.roadmap-card', {
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.roadmap-section',
        start: 'top 75%'
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
        trigger: '.bento-section',
        start: 'top 75%'
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
      <StarField />
      
      {/* Dark Background Glow Orbs */}
      <div className="bg-animations">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {/* Floating Pill Navbar */}
      <div className="navbar-wrapper">
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
          <div className="navbar-header-row">
            <Logo color="var(--primary-color)" />
            
            {/* Desktop Nav Links */}
            <div className="nav-links">
              <a href="#features" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
              <a href="#testimonials" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Reviews</a>
              <a href="#prebook" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Pre-Book</a>
              <a href="#roadmap" className="magnetic-element" onClick={(e) => { e.preventDefault(); scrollToSection('roadmap'); }}>Indicators</a>
            </div>

            <div className="navbar-actions">
              <button className="btn-primary desktop-get-started magnetic-element" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }} onClick={() => openPrebookModal('annual')}>
                Get Started
              </button>

              {/* Mobile Hamburger menu toggle button */}
              <button 
                className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            </div>
          </div>

          {/* Mobile dropdown panel */}
          {isMobileMenuOpen && (
            <div className="mobile-menu-panel animate-slide-down">
              <a href="#features" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); scrollToSection('features'); }}>Features</a>
              <a href="#testimonials" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); scrollToSection('testimonials'); }}>Reviews</a>
              <a href="#prebook" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); scrollToSection('prebook'); }}>Pre-Book</a>
              <a href="#roadmap" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); scrollToSection('roadmap'); }}>Indicators</a>
              <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }} onClick={() => { setIsMobileMenuOpen(false); openPrebookModal('annual'); }}>
                Get Started
              </button>
            </div>
          )}
        </nav>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero" style={{ position: 'relative' }}>
          {/* Neon Purple Wave Grid Background Canvas */}
          <ParticleWave />
          
          {/* Floating SVG Concentric Neural Orb */}
          <NeuralOrb />

          <div className="hero-content-split">
            {/* Left Column: Text Slider */}
            <div className="hero-slider-column">
              <div className="hero-slider-slide" key={activeHeroSlide}>
                <div className="hero-badge">{heroSlides[activeHeroSlide].badge}</div>
                <h1>
                  <span>{heroSlides[activeHeroSlide].titleSpan1}</span> <br />
                  <span className="gradient">{heroSlides[activeHeroSlide].titleSpan2}</span>
                </h1>
                <p>{heroSlides[activeHeroSlide].desc}</p>
                <div className="hero-buttons">
                  <button className="btn-primary magnetic-element" onClick={heroSlides[activeHeroSlide].primaryAction}>
                    {heroSlides[activeHeroSlide].primaryBtnText}
                  </button>
                  <button className="btn-secondary" onClick={heroSlides[activeHeroSlide].secondaryAction}>
                    {heroSlides[activeHeroSlide].secondaryBtnText}
                  </button>
                </div>
              </div>
              
              {/* Slider Nav Dots */}
              <div className="hero-slider-nav">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`hero-slider-dot ${activeHeroSlide === idx ? 'active' : ''}`}
                    onClick={() => setActiveHeroSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* Diagonal Scrolling Marquee for dynamic look */}
        <Marquee />

        {/* Coming Soon & Pricing Section */}
        <ComingSoon 
          onPrebook={openPrebookModal} 
          systemConfig={systemConfig}
          referralDiscount={referralDiscount}
          monthlyPrice={getMonthlyPrice()}
          annualPrice={getAnnualPrice()}
        />

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
          <svg className="decor-element decor-left-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <path d="M 15 50 L 40 30 L 70 60 L 85 40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <path d="M 15 50 L 30 70 L 60 40 L 85 40" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="40" y1="30" x2="30" y2="70" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="70" y1="60" x2="60" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <circle cx="15" cy="50" r="3" fill="var(--primary-color)" opacity="0.8" />
            <circle cx="40" cy="30" r="2" fill="var(--accent-blue)" />
            <circle cx="30" cy="70" r="2.5" fill="var(--accent-teal)" />
            <circle cx="70" cy="60" r="3.5" fill="var(--primary-color)" />
            <circle cx="60" cy="40" r="2" fill="var(--accent-blue)" />
            <circle cx="85" cy="40" r="3" fill="var(--accent-teal)" opacity="0.8" />
          </svg>
          <svg className="decor-element decor-right-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="25" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="8" stroke="var(--primary-color)" strokeWidth="1" opacity="0.6" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <path d="M 50 15 L 50 25 M 50 75 L 50 85 M 15 50 L 25 50 M 75 50 L 85 50" stroke="var(--accent-teal)" strokeWidth="1" />
          </svg>
          <svg className="decor-element decor-left-3" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <line x1="20" y1="20" x2="20" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="17" y="35" width="6" height="30" fill="var(--primary-color)" opacity="0.15" stroke="var(--primary-color)" strokeWidth="0.5" />
            <line x1="40" y1="10" x2="40" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="37" y="20" width="6" height="40" fill="var(--accent-teal)" opacity="0.15" stroke="var(--accent-teal)" strokeWidth="0.5" />
            <line x1="60" y1="30" x2="60" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="57" y="45" width="6" height="35" fill="var(--primary-color)" opacity="0.15" stroke="var(--primary-color)" strokeWidth="0.5" />
            <line x1="80" y1="20" x2="80" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="77" y="30" width="6" height="30" fill="var(--accent-blue)" opacity="0.15" stroke="var(--accent-blue)" strokeWidth="0.5" />
            <path d="M 10 50 Q 30 35 50 55 T 90 40" stroke="var(--accent-blue)" strokeWidth="1" fill="none" />
          </svg>
          <svg className="decor-element decor-right-3" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <path d="M 50 15 L 80 32 L 80 67 L 50 85 L 20 67 L 20 32 Z" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <path d="M 50 25 L 72 38 L 72 62 L 50 75 L 28 62 L 28 38 Z" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="15" x2="50" y2="25" stroke="var(--primary-color)" strokeWidth="0.8" />
            <line x1="80" y1="32" x2="72" y2="38" stroke="var(--accent-blue)" strokeWidth="0.8" />
            <line x1="80" y1="67" x2="72" y2="62" stroke="var(--accent-teal)" strokeWidth="0.8" />
            <line x1="50" y1="85" x2="50" y2="75" stroke="var(--primary-color)" strokeWidth="0.8" />
            <line x1="20" y1="67" x2="28" y2="62" stroke="var(--accent-blue)" strokeWidth="0.8" />
            <line x1="20" y1="32" x2="28" y2="38" stroke="var(--accent-teal)" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="4" fill="var(--accent-blue)" opacity="0.7" />
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
                    <svg className="radial-progress-svg" viewBox="0 0 140 140">
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
        <section id="roadmap" className="roadmap-section">
          <svg className="decor-element decor-right-1" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="15" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="5" fill="var(--accent-teal)" opacity="0.4" />
            <path d="M 50 2 L 50 8 M 50 92 L 50 98 M 2 50 L 8 50 M 92 50 L 98 50" stroke="var(--primary-color)" strokeWidth="1.2" />
            <line x1="20" y1="20" x2="25" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="80" y1="80" x2="75" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="20" y1="80" x2="25" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <line x1="80" y1="20" x2="75" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            <circle cx="50" cy="40" r="7" stroke="var(--primary-color)" strokeWidth="0.5" opacity="0.3" />
            <circle cx="40" cy="75" r="6" stroke="var(--accent-blue)" strokeWidth="0.5" opacity="0.3" />
            <circle cx="15" cy="20" r="3" fill="var(--accent-teal)" />
            <circle cx="50" cy="40" r="4.5" fill="var(--primary-color)" />
            <circle cx="85" cy="25" r="3.5" fill="var(--accent-blue)" />
            <circle cx="40" cy="75" r="4" fill="var(--accent-blue)" />
            <circle cx="75" cy="85" r="3" fill="var(--primary-color)" />
          </svg>

          <div className="section-header">
            <span className="card-badge" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#bd00ff' }}>Coming Soon</span>
            <h2>High-Powered Indicators</h2>
            <p>Our upcoming lineup of institutional-grade neural network trading indicators, built to give you the ultimate market edge.</p>
          </div>
          <div className="roadmap-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {indicatorReleaseList.map((indicator, idx) => (
              <div key={idx} className="roadmap-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: indicator.status.includes('Beta') ? 'rgba(0, 172, 172, 0.12)' : indicator.status.includes('Dev') ? 'rgba(0, 87, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: indicator.status.includes('Beta') ? 'var(--primary-color)' : indicator.status.includes('Dev') ? 'var(--accent-blue)' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {indicator.status}
                </div>
                
                {/* SVG Icon container */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(189, 0, 255, 0.1), rgba(0, 87, 255, 0.1))',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.2rem',
                  color: '#bd00ff'
                }}>
                  {indicator.icon}
                </div>
                
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>{indicator.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{indicator.desc}</p>
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
              <li><a href="#roadmap">Indicators</a></li>
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
          <div className={`modal-content ${modalType === 'promo' ? 'promo-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            {modalType === 'promo' ? (
              <div className="promo-container">
                <span className="card-badge coming-soon-badge animate-pulse-glow" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#d866ff', border: '1px solid rgba(189, 0, 255, 0.3)', padding: '2px 8px', fontSize: '0.6rem', marginBottom: '0.4rem', letterSpacing: '1px' }}>COMING SOON</span>
                <h2>Ciper TL: Auto Trend Line Generator</h2>
                <p className="promo-subtitle">Plots high-probability trend vectors and automatically maps out chart patterns in real-time.</p>
                
                <div className="promo-features">
                  <div className="promo-feature-item">
                    <span className="feature-icon">📈</span>
                    <div className="feature-text">
                      <h4>Auto-Trend Lines</h4>
                      <p>Mathematical swing pivots connected automatically on H1, H4, and D1.</p>
                    </div>
                  </div>
                  <div className="promo-feature-item">
                    <span className="feature-icon">🔍</span>
                    <div className="feature-text">
                      <h4>Pattern Recognition</h4>
                      <p>Flags wedges, triangles, and channel consolidations instantly.</p>
                    </div>
                  </div>
                  <div className="promo-feature-item">
                    <span className="feature-icon">⚡</span>
                    <div className="feature-text">
                      <h4>Breakout Signals</h4>
                      <p>Alerts you immediately upon volume-confirmed trend breaches.</p>
                    </div>
                  </div>
                </div>

                <div className="promo-pricing-grid">
                  <div className="promo-price-card" onClick={() => { setModalPlan('monthly'); setModalType('form'); }}>
                    <span className="plan-name">Monthly Special</span>
                    <div className="price-tag">
                      <span className="strike">₹{systemConfig.monthlyStrikePrice}</span>
                      <span className="discount">₹{getMonthlyPrice()}</span>
                    </div>
                    <button className="btn-secondary select-btn" onClick={(e) => { e.stopPropagation(); setModalPlan('monthly'); setModalType('form'); }}>
                      {systemConfig.indicatorMode === 'prebook' ? 'Pre-Book Monthly' : 'Book Monthly'}
                    </button>
                  </div>

                  <div className="promo-price-card highlighted" onClick={() => { setModalPlan('annual'); setModalType('form'); }}>
                    <div className="best-value-badge">Best Value</div>
                    <span className="plan-name">Annual Special</span>
                    <div className="price-tag">
                      <span className="strike">₹{systemConfig.annualStrikePrice}</span>
                      <span className="discount">₹{getAnnualPrice()}</span>
                    </div>
                    <button className="btn-primary select-btn" onClick={(e) => { e.stopPropagation(); setModalPlan('annual'); setModalType('form'); }}>
                      {systemConfig.indicatorMode === 'prebook' ? 'Pre-Book Annual' : 'Book Annual'}
                    </button>
                  </div>
                </div>

                <button className="promo-close-link" onClick={() => setIsModalOpen(false)}>
                  Explore Platform First
                </button>
              </div>
            ) : (
              <PrebookForm 
                defaultPlan={modalPlan}
                systemConfig={systemConfig}
                referralDiscount={referralDiscount}
                monthlyPrice={getMonthlyPrice()}
                annualPrice={getAnnualPrice()}
              />
            )}
          </div>
        </div>
      )}


    </div>
  );
}

export default App;

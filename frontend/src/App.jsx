import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Logo from './components/Logo';
import PrebookForm from './components/PrebookForm';
import AnimatedChart from './components/AnimatedChart';


import NeuralOrb from './components/NeuralOrb';
import RadarScanner from './components/RadarScanner';
import StarField from './components/StarField';
import ComingSoon from './components/ComingSoon';
import AdminPanel from './components/AdminPanel';
import MaintenanceNotice from './components/MaintenanceNotice';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') || 
  window.location.hostname.startsWith('172.')
    ? `http://${window.location.hostname}:5000`
    : window.location.origin
);

gsap.registerPlugin(ScrollTrigger);

const renderIndicatorIcon = (iconName) => {
  switch (iconName) {
    case 'volume':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="4" height="16" rx="1"></rect><rect x="9" y="8" width="8" height="12" rx="1"></rect><rect x="19" y="11" width="2" height="9" rx="1"></rect></svg>;
    case 'liquidity':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
    case 'correlation':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6"></circle><circle cx="15" cy="15" r="6"></circle><path d="M10 4a6 6 0 0 1 0 12"></path></svg>;
    case 'neural':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2"></circle><circle cx="14" cy="7" r="2"></circle><circle cx="14" cy="17" r="2"></circle><circle cx="20" cy="12" r="2"></circle><line x1="8" y1="11" x2="12" y2="8"></line><line x1="8" y1="13" x2="12" y2="16"></line><line x1="16" y1="8" x2="18" y2="11"></line><line x1="16" y1="16" x2="18" y2="13"></line></svg>;
    case 'momentum':
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-9 4 18 3-10 3 1h3"></path></svg>;
    case 'trend':
    default:
      return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="3"></line><circle cx="3" cy="21" r="2"></circle><circle cx="21" cy="3" r="2"></circle></svg>;
  }
};

function IndicatorCard({ indicator, referralDiscount, onPrebook, getMonthlyPrice, getAnnualPrice, triggerCelebration }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!indicator.countdownTargetDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(indicator.countdownTargetDate) - +new Date();
      if (difference <= 0) {
        return { expired: true };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left && left.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [indicator.countdownTargetDate]);

  const calculatedMonthly = getMonthlyPrice(indicator);
  const calculatedAnnual = getAnnualPrice(indicator);

  return (
    <div className="bento-card indicator-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'space-between', padding: '2rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="card-icon-wrapper" style={{ color: 'var(--primary-color)', background: 'rgba(189, 0, 255, 0.08)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderIndicatorIcon(indicator.icon)}
          </div>
          <span className="card-badge" style={{ 
            margin: 0, 
            background: indicator.status.includes('Beta') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', 
            color: indicator.status.includes('Beta') ? '#10b981' : '#f97316',
            border: indicator.status.includes('Beta') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(249, 115, 22, 0.2)'
          }}>
            {indicator.status}
          </span>
        </div>
        
        <h3 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{indicator.title}</h3>
        <p className="card-description" style={{ fontSize: '0.88rem', minHeight: '60px', marginBottom: '1.5rem' }}>{indicator.desc}</p>
        
        {/* Flagship Indicator Details List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#bd00ff', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '0.8rem' }}>Key Capabilities:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> High-Probability Swing Pivot Connections
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Multi-Timeframe Auto-Trend Lines (H1, H4, D1)
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Automatic Chart Pattern Recognition & Vectors
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Real-Time Volume Breakout Validation Signals
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Special</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-light)' }}>₹{indicator.monthlyStrikePrice}</span>
              <span style={{ color: 'var(--success-color)', fontWeight: '800', fontSize: '1.1rem' }}>₹{calculatedMonthly}</span>
            </div>
          </div>
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}></div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>Annual (Best Value)</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-light)' }}>₹{indicator.annualStrikePrice}</span>
              <span style={{ color: '#bd00ff', fontWeight: '800', fontSize: '1.1rem' }}>₹{calculatedAnnual}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    indicatorMode: 'prebook',
    countdownTargetDate: null
  });

  // Dynamic WebContent CMS copy
  const [webContent, setWebContent] = useState({
    heroBadge: "Ciper AI Platform",
    heroTitle1: "Automate",
    heroTitle2: "Your Market Edge",
    heroDesc: "Ciper uses advanced neural networks to map out the market in real-time. Detects support/resistance zones, high-probability convergence areas, and breakouts automatically.",
    
    heroSlide2Badge: "Featured Indicator",
    heroSlide2Title1: "Ciper TL",
    heroSlide2Title2: "Trend Scanner",
    heroSlide2Desc: "Automatically plot high-probability trend lines and identify chart pattern breakout zones in higher timeframes (H1, H4, D1).",

    accuracyValue: 94,
    
    stat1Num: "730K",
    stat1Label: "Calculations/sec",
    stat1Desc: "Real-time compute nodes analyzing micro-structure changes.",
    
    stat2Num: "94%",
    stat2Label: "Model Accuracy",
    stat2Desc: "Historical test results on multi-timeframe breakouts.",
    
    stat3Num: "12K+",
    stat3Label: "Global Backtests",
    stat3Desc: "Simulated market cycles across major tokens and assets.",
    
    faqs: [
      { q: "How does Ciper detect pattern zones?", a: "Ciper scans historical and real-time candlestick data across multiple timeframes, calculating mathematical standard deviations and liquidity imbalances to map pattern zones." },
      { q: "Is Ciper suitable for beginners?", a: "Yes. Ciper takes complex institutional concepts (like support/resistance nodes and multi-indicator convergence) and translates them into simple, clean visual cues on your chart." },
      { q: "Which assets and platforms does Ciper support?", a: "Ciper works across major asset classes including Cryptocurrencies, Forex, and Stocks. It is designed to integrate seamlessly with major charting platforms like TradingView." },
      { q: "What does the early access waitlist include?", a: "Joining the waitlist secures your early access slot, exclusive discounted pricing upon launch, and access to private beta testing groups." }
    ],
    
    reviews: [
      { quote: "Works like absolute magic. The neural pattern scanner marks structural zones in seconds. Completely optimized my entries and exit speeds.", user: "@Mishatrading", avatar: "MT", role: "Pro Crypto Trader" },
      { quote: "The auto support & resistance overlays are incredibly precise. It maps liquidity pools exactly where institutional orders sit. Highly recommend.", user: "@NazarBuch", avatar: "NB", role: "Forex Specialist" },
      { quote: "Ciper's convergence metrics have saved me hours of analysis. Seeing multiple mathematical indicators align in real-time is a complete cheat code.", user: "@CryptoApex", avatar: "CA", role: "Equity Analyst" }
    ]
  });

  // Referral discount tracking
  const [referralDiscount, setReferralDiscount] = useState({
    code: '',
    discountPercent: 0,
    name: ''
  });

  // Dynamic Indicators List
  const [indicatorsList, setIndicatorsList] = useState([]);
  const [allIndicators, setAllIndicators] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

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

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (currentPath === '/adminhetraj') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const gsapTickerUpdate = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(gsapTickerUpdate);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(gsapTickerUpdate);
      lenis.destroy();
    };
  }, [currentPath]);

  // Fetch dynamic WebContent copy config on mount
  useEffect(() => {
    const fetchWebContent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/webcontent`);
        if (res.ok) {
          const data = await res.json();
          setWebContent(data);
        }
      } catch (err) {
        console.error('Error fetching web content copy:', err);
      }
    };
    fetchWebContent();
  }, []);

  // Fetch indicators list from backend on mount
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const res = await fetch(`${API_URL}/api/indicators`);
        if (res.ok) {
          const data = await res.json();
          setAllIndicators(data);
          // Filter to only keep Trend Line indicator on the user side page
          const trendOnly = data.filter(
            (ind) => ind.icon === 'trend' || ind.title.includes('Trend Line') || ind.title.includes('TL')
          );
          setIndicatorsList(trendOnly);
        }
      } catch (err) {
        console.error('Error fetching indicators:', err);
      }
    };
    fetchIndicators();
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

  const getMonthlyPrice = (indicator = null) => {
    const basePrice = indicator ? indicator.monthlyDiscountPrice : systemConfig.monthlyDiscountPrice;
    if (referralDiscount.discountPercent > 0) {
      return Math.round(basePrice * (1 - referralDiscount.discountPercent / 100));
    }
    return basePrice;
  };

  const getAnnualPrice = (indicator = null) => {
    const basePrice = indicator ? indicator.annualDiscountPrice : systemConfig.annualDiscountPrice;
    if (referralDiscount.discountPercent > 0) {
      return Math.round(basePrice * (1 - referralDiscount.discountPercent / 100));
    }
    return basePrice;
  };

  const heroSlides = [
    {
      badge: webContent.heroBadge || "Ciper AI Platform",
      titleSpan1: webContent.heroTitle1 || "Automate",
      titleSpan2: webContent.heroTitle2 || "Your Market Edge",
      desc: webContent.heroDesc || "Ciper uses advanced neural networks to map out the market in real-time. Detects support/resistance zones, high-probability convergence areas, and breakouts automatically.",
      primaryBtnText: "Explore Features",
      primaryAction: () => scrollToSection('features'),
      secondaryBtnText: "Pre-Book Now",
      secondaryAction: () => scrollToSection('prebook')
    },
    {
      badge: webContent.heroSlide2Badge || "Featured Indicator",
      titleSpan1: webContent.heroSlide2Title1 || "Ciper TL",
      titleSpan2: webContent.heroSlide2Title2 || "Trend Scanner",
      desc: webContent.heroSlide2Desc || "Automatically plot high-probability trend lines and identify chart pattern breakout zones in higher timeframes (H1, H4, D1).",
      primaryBtnText: "Pre-Book Now",
      primaryAction: () => scrollToSection('prebook'),
      secondaryBtnText: "Learn More",
      secondaryAction: () => scrollToSection('prebook')
    }
  ];

  const openPrebookModal = (plan, indicator = null) => {
    setModalPlan(plan || 'annual');
    setSelectedIndicator(indicator || indicatorsList[0] || null);
    setModalType('form');
    setIsModalOpen(true);
  };

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
  }, [indicatorsList]);

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

  const triggerCelebration = () => {
    const container = document.querySelector('.hero');
    if (!container) return;
    
    const colors = ['#bd00ff', '#0057ff', '#12b3b3', '#ff007f', '#ffaa00', '#00ffcc'];
    const leftX = '48%';
    const rightX = '52%';
    const centerY = '18%';
    
    const triggerBurst = (xCoord) => {
      for (let i = 0; i < 25; i++) {
        const el = document.createElement('div');
        el.className = 'celebration-spark';
        el.style.position = 'absolute';
        el.style.left = xCoord;
        el.style.top = centerY;
        el.style.width = `${Math.random() * 4 + 3}px`;
        el.style.height = el.style.width;
        el.style.borderRadius = '50%';
        const color = colors[Math.floor(Math.random() * colors.length)];
        el.style.background = color;
        el.style.boxShadow = `0 0 8px ${color}, 0 0 16px ${color}`;
        el.style.pointerEvents = 'none';
        el.style.zIndex = '100';
        container.appendChild(el);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 160 + 60;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        
        gsap.fromTo(el,
          { x: 0, y: 0, scale: 1.2, opacity: 1 },
          {
            x: dx,
            y: dy + 80,
            scale: 0.1,
            opacity: 0,
            duration: Math.random() * 1.0 + 0.8,
            ease: 'power2.out',
            onComplete: () => el.remove()
          }
        );
      }
    };

    triggerBurst(leftX);
    triggerBurst(rightX);
  };

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const targetDate = (indicatorsList && indicatorsList[0] && indicatorsList[0].countdownTargetDate) 
      ? indicatorsList[0].countdownTargetDate 
      : systemConfig.countdownTargetDate;

    if (!targetDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { expired: true };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left && left.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [systemConfig.countdownTargetDate, indicatorsList]);

  // Trigger initial firecracker celebration shortly after load
  useEffect(() => {
    if (currentPath !== '/adminhetraj') {
      const timer = setTimeout(() => {
        triggerCelebration();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentPath]);

  // Route Guard for Admin Panel
  if (currentPath === '/adminhetraj') {
    return <AdminPanel />;
  }

  // Maintenance Mode route guard
  if (systemConfig.maintenanceMode && currentPath !== '/adminhetraj') {
    return <MaintenanceNotice />;
  }


  const reviews = webContent.reviews && webContent.reviews.length > 0 ? webContent.reviews : [
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

  const faqs = webContent.faqs && webContent.faqs.length > 0 ? webContent.faqs : [
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
      val: webContent.accuracyValue || 94,
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
      strokeDashoffset: 408 * (1 - (webContent.accuracyValue || 94) / 100),
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

    // Testimonials elements staggered 3D entrance reveal
    gsap.from('.testimonials-section .testimonial-card:first-child', {
      x: -100,
      opacity: 0,
      duration: 1.4,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: 'top 80%'
      }
    });
    
    gsap.from('.testimonials-section .bull-head-container', {
      scale: 0.3,
      opacity: 0,
      duration: 1.5,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: 'top 80%'
      }
    });

    gsap.from('.testimonials-section .testimonial-card:last-child', {
      x: 100,
      opacity: 0,
      duration: 1.4,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: 'top 80%'
      }
    });

    // Parallax scrolling for background glow orbs as you scroll down
    gsap.to('.glow-orb.orb-1', {
      y: 150,
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5
      }
    });
    gsap.to('.glow-orb.orb-2', {
      y: -180,
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5
      }
    });
    gsap.to('.glow-orb.orb-3', {
      y: 100,
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5
      }
    });

    // Footer entrance scroll reveal
    gsap.from('footer .footer-brand, footer .footer-column', {
      y: 40,
      opacity: 0,
      stagger: 0.12,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: 'footer',
        start: 'top 95%'
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

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (currentPath !== '/' && currentPath !== '') {
      navigateTo('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      scrollToSection(sectionId);
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
              <a href="#features" className="magnetic-element" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
              <a href="#testimonials" className="magnetic-element" onClick={(e) => handleNavClick(e, 'testimonials')}>Reviews</a>
              <a href="/indicators" className="magnetic-element" style={{ color: currentPath === '/indicators' ? 'var(--primary-color)' : '' }} onClick={(e) => { e.preventDefault(); navigateTo('/indicators'); }}>Indicators</a>
              <a href="#prebook" className="magnetic-element" onClick={(e) => handleNavClick(e, 'prebook')}>Pre-Book</a>
            </div>

            <div className="navbar-actions">
              <button className="btn-primary desktop-get-started magnetic-element" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }} onClick={(e) => handleNavClick(e, 'prebook')}>
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
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
              <a href="#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')}>Reviews</a>
              <a href="/indicators" style={{ color: currentPath === '/indicators' ? 'var(--primary-color)' : '' }} onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); navigateTo('/indicators'); }}>Indicators</a>
              <a href="#prebook" onClick={(e) => handleNavClick(e, 'prebook')}>Pre-Book</a>
              <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }} onClick={(e) => handleNavClick(e, 'prebook')}>
                Get Started
              </button>
            </div>
          )}
        </nav>
      </div>

      {currentPath === '/indicators' ? (
        <main style={{ padding: '8rem 5% 4rem', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '4rem' }} className="section-header">
            <span className="card-badge" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#d866ff', border: '1px solid rgba(189,0,255,0.2)' }}>Ciper AI Catalog</span>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.2rem', lineHeight: '1.1', color: '#fff' }}>
              Explore Our <span className="gradient">Indicators</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
              Deploy state-of-the-art algorithmic scanners directly on your TradingView charts. Pre-book or buy active indicators below.
            </p>
          </div>

          <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%', display: 'grid' }}>
            {allIndicators.map((ind) => (
              <div key={ind._id} className="bento-card indicator-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between', padding: '2.5rem', minHeight: '450px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div className="card-icon-wrapper" style={{ color: 'var(--primary-color)', background: 'rgba(189, 0, 255, 0.08)', width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderIndicatorIcon(ind.icon)}
                    </div>
                    <span className="card-badge" style={{ 
                      margin: 0, 
                      background: ind.status.includes('Beta') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', 
                      color: ind.status.includes('Beta') ? '#10b981' : '#f97316',
                      border: ind.status.includes('Beta') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(249, 115, 22, 0.2)'
                    }}>
                      {ind.status}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.8rem', textAlign: 'left', color: '#fff' }}>{ind.title}</h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.6', minHeight: '75px', marginBottom: '1.5rem' }}>{ind.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.2rem', gap: '1rem', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '750', letterSpacing: '0.5px' }}>Monthly Pass</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-light)' }}>₹{ind.monthlyStrikePrice}</span>
                        <span style={{ color: 'var(--success-color)', fontWeight: '800', fontSize: '1.2rem' }}>₹{getMonthlyPrice(ind)}</span>
                      </div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}></div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '750', letterSpacing: '0.5px' }}>Annual Pass</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-light)' }}>₹{ind.annualStrikePrice}</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.2rem' }}>₹{getAnnualPrice(ind)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.8rem', fontSize: '0.85rem', borderRadius: '30px' }}
                    onClick={() => openPrebookModal('monthly', ind)}
                  >
                    Get Monthly
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '0.8rem', fontSize: '0.85rem', borderRadius: '30px', boxShadow: 'none' }}
                    onClick={() => openPrebookModal('annual', ind)}
                  >
                    Buy Annual
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main>
        {/* Hero Section */}
        <section className="hero" style={{ position: 'relative' }}>

          
          {/* Floating SVG Concentric Neural Orb */}
          <NeuralOrb />

          <div className="hero-content-split">
            {/* Left Column: Text Slider */}
            <div className="hero-slider-column">
              <div className="hero-slider-slide" key={activeHeroSlide}>
                {activeHeroSlide === 1 && (
                  timeLeft && !timeLeft.expired ? (
                    /* Active ticking countdown timer */
                    <div 
                      className="hero-countdown-container"
                      style={{
                        display: 'inline-flex',
                        gap: '12px',
                        marginBottom: '1.2rem',
                        background: 'rgba(189, 0, 255, 0.06)',
                        border: '2px dashed rgba(189, 0, 255, 0.35)',
                        padding: '8px 18px',
                        borderRadius: '16px',
                        boxShadow: '0 0 20px rgba(189, 0, 255, 0.15)',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        userSelect: 'none'
                      }}
                      onClick={triggerCelebration}
                      onMouseEnter={triggerCelebration}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#bd00ff', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginRight: '6px' }}>💥 Launching In:</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Days</span>
                      </div>
                      <span style={{ color: '#bd00ff', fontWeight: '900', fontSize: '1.1rem', marginBottom: '8px' }}>:</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Hrs</span>
                      </div>
                      <span style={{ color: '#bd00ff', fontWeight: '900', fontSize: '1.1rem', marginBottom: '8px' }}>:</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Mins</span>
                      </div>
                      <span style={{ color: '#bd00ff', fontWeight: '900', fontSize: '1.1rem', marginBottom: '8px' }}>:</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#bd00ff', fontFamily: 'monospace', textShadow: '0 0 10px rgba(189,0,255,0.4)' }}>
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#bd00ff', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Secs</span>
                      </div>
                    </div>
                  ) : (
                    /* Default Starting Soon Badge when no timer is set or expired */
                    <div 
                      className="hero-badge starting-soon-badge"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(249, 115, 22, 0.12))',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '1rem',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)',
                        transition: 'all 0.3s ease',
                        userSelect: 'none'
                      }}
                      onClick={triggerCelebration}
                      onMouseEnter={triggerCelebration}
                    >
                      <span className="animate-pulse" style={{ color: '#ef4444' }}>🔴</span> Starting Soon
                    </div>
                  )
                )}
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




        {/* Coming Soon & Pricing Section */}
        <ComingSoon 
          onPrebook={openPrebookModal} 
          systemConfig={systemConfig}
          referralDiscount={referralDiscount}
          allIndicators={allIndicators}
          getMonthlyPrice={getMonthlyPrice}
          getAnnualPrice={getAnnualPrice}
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
              <div className="stat-bar-num" style={{ color: '#bd00ff' }}>{webContent.stat2Num || '94%'}</div>
              <div className="stat-bar-label">{webContent.stat2Label || 'Setup Accuracy'}</div>
              <div className="stat-bar-desc">{webContent.stat2Desc || 'Aggregated success rating recorded across validated neural breakout zones.'}</div>
            </div>
            <div className="stat-bar-card">
              <div className="stat-bar-num">{webContent.stat1Num || '53'}</div>
              <div className="stat-bar-label">{webContent.stat1Label || 'Active Scans / Min'}</div>
              <div className="stat-bar-desc">{webContent.stat1Desc || 'Continuous real-time scans across multiple timeframes simultaneously.'}</div>
            </div>
            <div className="stat-bar-card">
              <div className="stat-bar-num" style={{ color: '#ef4444' }}>{webContent.stat3Num || '4%'}</div>
              <div className="stat-bar-label">{webContent.stat3Label || 'Max Drawdown'}</div>
              <div className="stat-bar-desc">{webContent.stat3Desc || 'Minimal risk parameters enforced automatically by overlapping convergence zones.'}</div>
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



        {/* FAQ Section Removed */}

      </main>
      )}

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
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Pre-Book</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Beta Access</a></li>
              <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Documentation</a></li>
              <li><a href="https://t.me/" target="_blank" rel="noreferrer" className="external-link">Telegram Channel</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Risk Warning</a></li>
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Privacy Policy</a></li>
              <li><a href="#prebook" onClick={(e) => { e.preventDefault(); scrollToSection('prebook'); }}>Terms of Service</a></li>
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
                <span className="card-badge coming-soon-badge animate-pulse-glow" style={{ background: 'rgba(189, 0, 255, 0.1)', color: '#d866ff', border: '1px solid rgba(189, 0, 255, 0.3)', padding: '2px 8px', fontSize: '0.6rem', marginBottom: '0.4rem', letterSpacing: '1px' }}>{selectedIndicator ? selectedIndicator.status.toUpperCase() : 'COMING SOON'}</span>
                <h2>{selectedIndicator ? selectedIndicator.title : 'Ciper TL: Auto Trend Line Generator'}</h2>
                <p className="promo-subtitle">{selectedIndicator ? selectedIndicator.desc : 'Plots high-probability trend vectors and automatically maps out chart patterns in real-time.'}</p>
                
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
                      <span className="strike">₹{selectedIndicator ? selectedIndicator.monthlyStrikePrice : systemConfig.monthlyStrikePrice}</span>
                      <span className="discount">₹{getMonthlyPrice(selectedIndicator)}</span>
                    </div>
                    <button className="btn-secondary select-btn" onClick={(e) => { e.stopPropagation(); setModalPlan('monthly'); setModalType('form'); }}>
                      {systemConfig.indicatorMode === 'prebook' ? 'Pre-Book Monthly' : 'Book Monthly'}
                    </button>
                  </div>

                  <div className="promo-price-card highlighted" onClick={() => { setModalPlan('annual'); setModalType('form'); }}>
                    <div className="best-value-badge">Best Value</div>
                    <span className="plan-name">Annual Special</span>
                    <div className="price-tag">
                      <span className="strike">₹{selectedIndicator ? selectedIndicator.annualStrikePrice : systemConfig.annualStrikePrice}</span>
                      <span className="discount">₹{getAnnualPrice(selectedIndicator)}</span>
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
                monthlyPrice={getMonthlyPrice(selectedIndicator)}
                annualPrice={getAnnualPrice(selectedIndicator)}
                selectedIndicator={selectedIndicator}
              />
            )}
          </div>
        </div>
      )}


    </div>
  );
}

export default App;

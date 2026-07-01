import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function PrebookForm({ 
  defaultPlan = '1month',
  systemConfig = {
    monthlyDiscountPrice: 299,
    monthlyStrikePrice: 399,
    annualDiscountPrice: 999,
    annualStrikePrice: 1200,
    indicatorMode: 'prebook'
  },
  referralDiscount = { code: '', discountPercent: 0, name: '' },
  selectedIndicator = null,
  onClose = null
}) {
  const [formData, setFormData] = useState({ name: '', email: '', tradingViewUsername: '', phone: '', plan: defaultPlan });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const formRef = useRef(null);

  const globalDiscount = systemConfig?.globalDiscountPercent || 0;
  const ind = selectedIndicator || {};

  const p1 = ind.price1Month ?? 1749;
  const p3 = ind.price3Months ?? 3999;
  const p6 = ind.price6Months ?? 6999;
  const p1y = ind.price1Year ?? 11499;

  const s1 = ind.strike1Month ?? 3499;
  const s3 = ind.strike3Months ?? 7999;
  const s6 = ind.strike6Months ?? 13999;
  const s1y = ind.strike1Year ?? 22999;

  const applyGD = (p) => globalDiscount > 0 ? Math.round(p * (1 - globalDiscount / 100)) : p;

  const plans = [
    { id: '1month', name: '1 Month', price: applyGD(p1), strike: s1, label: `₹${applyGD(p1).toLocaleString()}/mo` },
    { id: '3months', name: '3 Months', price: applyGD(p3), strike: s3, label: `₹${applyGD(p3).toLocaleString()}/3 mos` },
    { id: '6months', name: '6 Months', price: applyGD(p6), strike: s6, label: `₹${applyGD(p6).toLocaleString()}/6 mos`, isBest: true },
    { id: '1year', name: '1 Year', price: applyGD(p1y), strike: s1y, label: `₹${applyGD(p1y).toLocaleString()}/yr` }
  ];

  useEffect(() => {
    setFormData(prev => ({ ...prev, plan: defaultPlan }));
  }, [defaultPlan]);

  const triggerConfetti = () => {
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      color: ['#bd00ff', '#0057ff', '#12b3b3', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      angle: Math.random() * Math.PI * 2,
      velocity: 80 + Math.random() * 160,
      size: 6 + Math.random() * 12,
      shape: Math.random() > 0.5 ? 'circle' : 'square'
    }));
    setParticles(newParticles);
    
    // Clear particles after animation runs
    setTimeout(() => {
      setParticles([]);
    }, 2000);
  };

  useEffect(() => {
    if (particles.length > 0) {
      gsap.fromTo('.confetti-particle', 
        { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
        {
          x: (i) => Math.cos(particles[i].angle) * particles[i].velocity,
          y: (i) => Math.sin(particles[i].angle) * particles[i].velocity - 60,
          scale: 0.1,
          opacity: 0,
          rotation: () => Math.random() * 360,
          duration: 1.6,
          ease: 'power3.out',
        }
      );
    }
  }, [particles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    // 1. Mandatory fields validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.tradingViewUsername.trim() || !formData.phone.trim()) {
      setStatus({ type: 'error', message: 'All details are mandatory to fill' });
      setIsLoading(false);
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setStatus({ type: 'error', message: 'Invalid email format' });
      setIsLoading(false);
      return;
    }

    // 3. Phone number validation (must be exactly 10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    let finalPhone = phoneDigits;
    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      finalPhone = phoneDigits.slice(2);
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
      finalPhone = phoneDigits.slice(1);
    }

    if (finalPhone.length !== 10) {
      setStatus({ type: 'error', message: 'Phone number must be exactly 10 digits' });
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname.startsWith('192.168.') || 
        window.location.hostname.startsWith('10.') || 
        window.location.hostname.startsWith('172.')
          ? `http://${window.location.hostname}:5000`
          : window.location.origin
      );

      // Verify email and phone duplicate checks on backend
      const checkRes = await fetch(`${API_URL}/api/prebook/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: finalPhone
        })
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Verification failed');
      }

      const refCodeVal = sessionStorage.getItem('ciper_referral_code') || '';
      const selectedPlanObj = plans.find(p => p.id === formData.plan) || plans[0];
      const indicatorTitleVal = selectedIndicator ? selectedIndicator.title : '';

      // 1. If indicatorMode is prebook, turn Razorpay OFF and submit waitlist lead directly
      if (systemConfig?.indicatorMode === 'prebook') {
        const prebookRes = await fetch(`${API_URL}/api/prebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            tradingViewUsername: formData.tradingViewUsername,
            phone: finalPhone,
            plan: formData.plan,
            refCode: refCodeVal,
            indicatorTitle: indicatorTitleVal
          })
        });

        const prebookData = await prebookRes.json();
        if (!prebookRes.ok) {
          throw new Error(prebookData.error || 'Failed to submit pre-ordering waitlist lead. Please try again.');
        }

        setStatus({ type: 'success', message: 'Pre-ordering successful! Your spot on the early access waitlist is secured.' });
        setFormData({ name: '', email: '', tradingViewUsername: '', phone: '', plan: defaultPlan });
        triggerConfetti();
        setIsLoading(false);
        return;
      }

      // 2. Otherwise (Indicator is Live/Paid), run Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please refresh the page or check your internet connection.');
      }

      let amountVal = selectedPlanObj.price;
      if (referralDiscount && referralDiscount.discountPercent > 0) {
        amountVal = Math.round(amountVal * (1 - referralDiscount.discountPercent / 100));
      }

      // Create order on the backend
      const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: formData.plan,
          amount: amountVal,
          currency: "INR"
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initiate order. Please try again.');
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T4k9SB7UQRjnIJ').replace(/['"]/g, ''),
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Cipher Eye',
        description: `Subscribe to ${selectedPlanObj.name} Plan`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setIsLoading(true);
            setStatus({ type: '', message: 'Verifying payment status...' });

            // 3. Verify payment signature on backend
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                name: formData.name,
                email: formData.email,
                tradingViewUsername: formData.tradingViewUsername,
                phone: formData.phone,
                planId: formData.plan,
                amount: amountVal,
                refCode: refCodeVal
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setStatus({ type: 'success', message: 'Payment confirmed! Your subscription is active.' });
            setFormData({ name: '', email: '', tradingViewUsername: '', phone: '', plan: defaultPlan });
            triggerConfetti();
          } catch (err) {
            setStatus({ type: 'error', message: err.message });
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#00D4AA'
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI / QR Code',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: function () {
            setStatus({ type: 'error', message: 'Payment checkout cancelled by user.' });
            setIsLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setStatus({ type: 'error', message: `Payment failed: ${resp.error.description}` });
        setIsLoading(false);
      });
      rzp.open();

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container" ref={formRef} style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      {/* Confetti particles absolute elements */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '3px',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      ))}

      <div className="checkout-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.4rem',
        width: '100%'
      }}>
        <h2 style={{ margin: 0 }}>{systemConfig?.indicatorMode === 'prebook' ? 'Secure Early Access' : 'Checkout & Subscribe'}</h2>
        {onClose && (
          <button 
            type="button" 
            className="checkout-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        )}
      </div>
      <p>
        {systemConfig?.indicatorMode === 'prebook' 
          ? 'Complete the form below to secure your early access spot on the waitlist today. No payment required.' 
          : 'Complete the form below and verify payment to activate your live indicator subscription immediately.'}
      </p>
      <form onSubmit={handleSubmit}>
        {showPlanSelector ? (
          <div className="plan-selection-group select-grid-wrapper" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="group-label" style={{ margin: 0 }}>Select A Subscription Plan</label>
              <button
                type="button"
                onClick={() => setShowPlanSelector(false)}
                className="back-receipt-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  fontSize: '0.72rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Back to Receipt
              </button>
            </div>
            <div className="plan-selector" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              width: '100%',
              marginBottom: '1rem'
            }}>
              {plans.map((p) => {
                const isSelected = formData.plan === p.id;
                let displayPrice = p.price;
                if (referralDiscount && referralDiscount.discountPercent > 0) {
                  displayPrice = Math.round(p.price * (1 - referralDiscount.discountPercent / 100));
                }
                const displayLabel = `₹${displayPrice.toLocaleString()}${p.id === '1month' ? '/mo' : p.id === '3months' ? '/3 mos' : p.id === '6months' ? '/6 mos' : '/yr'}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, plan: p.id });
                      setShowPlanSelector(false);
                    }}
                    className={`prebook-plan-btn ${isSelected ? 'selected' : ''}`}
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.8rem 0.5rem', minHeight: '62px' }}
                  >
                    {p.isBest && (
                      <span style={{
                        position: 'absolute',
                        top: '-6px',
                        background: '#00D4AA',
                        color: '#000',
                        fontSize: '0.55rem',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '8px'
                      }}>
                        BEST
                      </span>
                    )}
                    <span className="plan-name" style={{ fontWeight: '750', fontSize: '0.82rem' }}>{p.name}</span>
                    <span className="plan-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                      {p.strike && p.strike > displayPrice && (
                        <span style={{ fontSize: '0.62rem', textDecoration: 'line-through', opacity: 0.5 }}>
                          ₹{p.strike.toLocaleString()}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isSelected ? '#000' : '#00D4AA' }}>{displayLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="invoice-receipt" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.2rem',
            marginBottom: '1rem',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.6rem' }}>
              <div>
                <span className="active-plan-title" style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Active Plan</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{plans.find(p => p.id === formData.plan)?.name || 'Plan'} Pass</span>
                  {plans.find(p => p.id === formData.plan)?.isBest && (
                    <span className="plan-badge" style={{
                      background: 'linear-gradient(90deg, #bd00ff, #00D4AA)',
                      color: '#000',
                      fontSize: '0.55rem',
                      fontWeight: '900',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      textTransform: 'uppercase'
                    }}>
                      Best Value
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanSelector(true)}
                className="change-plan-btn"
                style={{
                  background: 'rgba(189, 0, 255, 0.1)',
                  border: '1px solid rgba(189, 0, 255, 0.25)',
                  color: '#d866ff',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '750',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Change Plan
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                <span>Standard Mkt Value:</span>
                <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>₹{(formData.plan === '1month' ? s1 : formData.plan === '3months' ? s3 : formData.plan === '6months' ? s6 : s1y).toLocaleString()}</span>
              </div>
              <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                <span>Ciper Base Price:</span>
                <span>₹{(formData.plan === '1month' ? p1 : formData.plan === '3months' ? p3 : formData.plan === '6months' ? p6 : p1y).toLocaleString()}</span>
              </div>

              {(formData.plan === '1month' ? p1 : formData.plan === '3months' ? p3 : formData.plan === '6months' ? p6 : p1y) - (plans.find(p => p.id === formData.plan)?.price || 0) > 0 && (
                <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#00D4AA' }}>
                  <span>Global Discount ({globalDiscount}%):</span>
                  <span>-₹{((formData.plan === '1month' ? p1 : formData.plan === '3months' ? p3 : formData.plan === '6months' ? p6 : p1y) - (plans.find(p => p.id === formData.plan)?.price || 0)).toLocaleString()}</span>
                </div>
              )}

              {referralDiscount && referralDiscount.discountPercent > 0 && (
                <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}>
                  <span>Referral Promo ({referralDiscount.discountPercent}%):</span>
                  <span>-₹{Math.round((plans.find(p => p.id === formData.plan)?.price || 0) * (referralDiscount.discountPercent / 100)).toLocaleString()}</span>
                </div>
              )}

              <div style={{
                marginTop: '0.6rem',
                paddingTop: '0.6rem',
                borderTop: '1px dashed rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className="final-payable-label" style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>Final Payable:</span>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>Includes all platform access taxes</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="final-payable-price" style={{
                    fontSize: '1.6rem',
                    fontWeight: '900',
                    color: '#00D4AA',
                    textShadow: '0 0 10px rgba(0, 212, 170, 0.2)',
                    fontFamily: 'monospace'
                  }}>
                    ₹{(
                      (plans.find(p => p.id === formData.plan)?.price || 0) - 
                      Math.round((plans.find(p => p.id === formData.plan)?.price || 0) * ((referralDiscount?.discountPercent || 0) / 100))
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="John Doe"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="tradingViewUsername">TradingView Username</label>
          <input
            type="text"
            id="tradingViewUsername"
            value={formData.tradingViewUsername}
            onChange={(e) => setFormData({ ...formData, tradingViewUsername: e.target.value })}
            required
            placeholder="e.g. TradingEdge"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
            required
            placeholder="e.g. +91 98765 43210"
          />
        </div>
        <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner-loader"></span>
              <span>Processing...</span>
            </span>
          ) : (systemConfig?.indicatorMode === 'prebook' ? 'Confirm Pre-Order' : 'Subscribe & Verify')}
        </button>
      </form>
      
      {status.message && (
        <div className={`message ${status.type}`} style={{
          marginTop: '1rem',
          padding: '0.8rem',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: status.type === 'success' ? '#10b981' : '#ef4444',
          background: status.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: status.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          textAlign: 'center'
        }}>
          {status.type === 'success' ? '✨' : '⚠️'} {status.message}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function PrebookForm({ 
  defaultPlan = 'annual',
  systemConfig = {
    monthlyDiscountPrice: 299,
    monthlyStrikePrice: 399,
    annualDiscountPrice: 999,
    annualStrikePrice: 1200,
    indicatorMode: 'prebook'
  },
  referralDiscount = { code: '', discountPercent: 0, name: '' },
  monthlyPrice = 299,
  annualPrice = 999,
  selectedIndicator = null
}) {
  const [formData, setFormData] = useState({ name: '', email: '', tradingViewUsername: '', phone: '', plan: defaultPlan });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const formRef = useRef(null);

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

    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please refresh the page or check your internet connection.');
      }

      const API_URL = import.meta.env.VITE_API_URL || (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname.startsWith('192.168.') || 
        window.location.hostname.startsWith('10.') || 
        window.location.hostname.startsWith('172.')
          ? `http://${window.location.hostname}:5000`
          : window.location.origin
      );

      const refCodeVal = sessionStorage.getItem('ciper_referral_code') || '';
      const indicatorTitleVal = selectedIndicator ? selectedIndicator.title : 'General';

      // 1. Create order on the backend
      const orderRes = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.plan,
          indicatorTitle: indicatorTitleVal,
          refCode: refCodeVal
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
        name: 'Ciper AI',
        description: `Pre-book ${indicatorTitleVal}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setIsLoading(true);
            setStatus({ type: '', message: 'Verifying payment status...' });

            // 3. Verify payment signature on backend
            const verifyRes = await fetch(`${API_URL}/api/verify-payment`, {
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
                plan: formData.plan,
                refCode: refCodeVal,
                indicatorTitle: indicatorTitleVal
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setStatus({ type: 'success', message: 'Payment confirmed! Access will be granted in 24 hours.' });
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
          color: '#bd00ff'
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
    <div className="form-container" ref={formRef} style={{ position: 'relative' }}>
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

      <h2>{selectedIndicator ? `Pre-Book ${selectedIndicator.title}` : (systemConfig.indicatorMode === 'prebook' ? 'Pay & Pre-Book Access' : 'Book Ciper Indicator Now')}</h2>
      <p>
        {selectedIndicator 
          ? `Pre-book ${selectedIndicator.title} to lock in early-access discount pricing before the public launch.`
          : (systemConfig.indicatorMode === 'prebook' ? 'Pre-book now to secure early-access discount pricing and get instant setup details.' : 'Complete booking form to activate your live trading indicator license.')}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="plan-selection-group">
          <label className="group-label">Select Discount Plan</label>
          <div className="plan-selector">
            <button
              type="button"
              className={`plan-toggle-btn ${formData.plan === 'monthly' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, plan: 'monthly' })}
            >
              <span className="plan-name">Monthly Special</span>
              <span className="plan-price">₹{monthlyPrice}/mo</span>
              <span className="plan-strike">₹{selectedIndicator ? selectedIndicator.monthlyStrikePrice : systemConfig.monthlyStrikePrice}/mo</span>
            </button>
            <button
              type="button"
              className={`plan-toggle-btn ${formData.plan === 'annual' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, plan: 'annual' })}
            >
              <span className="badge-best-value">Best Value</span>
              <span className="plan-name">Annual Special</span>
              <span className="plan-price">₹{annualPrice}/yr</span>
              <span className="plan-strike">₹{selectedIndicator ? selectedIndicator.annualStrikePrice : systemConfig.annualStrikePrice}/yr</span>
            </button>
          </div>
        </div>

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
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="e.g. +91 98765 43210"
          />
        </div>
        <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? 'Processing...' : (systemConfig.indicatorMode === 'prebook' ? 'Pay & Pre-Book' : 'Pay & Book Access')}
        </button>
      </form>
      
      {status.message && (
        <div className={`message ${status.type}`}>
          {status.type === 'success' ? '✨' : '⚠️'} {status.message}
        </div>
      )}
    </div>
  );
}

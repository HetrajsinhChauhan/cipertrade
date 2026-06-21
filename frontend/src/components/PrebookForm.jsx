import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function PrebookForm({ defaultPlan = 'annual' }) {
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/prebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus({ type: 'success', message: 'Pre-booking successful! We will notify you when Ciper is ready.' });
      setFormData({ name: '', email: '', tradingViewUsername: '', phone: '', plan: defaultPlan });
      triggerConfetti();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
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

      <h2>Secure Early Access</h2>
      <p>Join the waitlist and be the first to experience the future of AI trading.</p>
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
              <span className="plan-price">₹299/mo</span>
              <span className="plan-strike">₹399/mo</span>
            </button>
            <button
              type="button"
              className={`plan-toggle-btn ${formData.plan === 'annual' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, plan: 'annual' })}
            >
              <span className="badge-best-value">Best Value</span>
              <span className="plan-name">Annual Special</span>
              <span className="plan-price">₹999/yr</span>
              <span className="plan-strike">₹1200/yr</span>
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
          {isLoading ? 'Booking...' : 'Join Waitlist'}
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

import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import NeuralOrb from './NeuralOrb';

export default function ComingSoonOverlay() {
  const [step, setStep] = useState('landing'); // landing, form, success
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState('...');

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 800);
    return () => clearInterval(dotsInterval);
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'phone') {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 15);
      setFormData(prev => ({ ...prev, [id]: cleanDigits }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handlePreorderSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    // Client-side validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setStatus({ type: 'error', message: 'All details are mandatory to fill' });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setStatus({ type: 'error', message: 'Invalid email format' });
      setIsLoading(false);
      return;
    }

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

      // Pre-check for duplicate email/phone
      const checkRes = await fetch(`${API_URL}/api/comingsoon-preorder/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phone: finalPhone })
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Verification failed');
      }

      // Submit pre-order
      const response = await fetch(`${API_URL}/api/comingsoon-preorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: finalPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit pre-order');
      }

      setStep('success');
      // Trigger confetti/animations using GSAP if elements exist
      setTimeout(() => {
        gsap.fromTo('.success-check-circle', 
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
        );
      }, 100);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPreorder = () => {
    setStep('form');
  };

  return (
    <div className="coming-soon-overlay-container">
      {/* Background glow elements */}
      <div className="coming-soon-glow-backdrop">
        <div className="coming-soon-glow-orb orb-purple" />
        <div className="coming-soon-glow-orb orb-teal" />
      </div>

      <div className="coming-soon-overlay-card">
        {/* Floating Neural Orb */}
        <div className="coming-soon-orb-wrapper">
          <NeuralOrb />
        </div>

        {step === 'landing' && (
          <div className="coming-soon-landing-step">
            <div className="coming-soon-badge-wrapper">
              <span className="coming-soon-live-dot" />
              <span className="coming-soon-badge-text">LAUNCHING SOON {dots}</span>
            </div>
            
            <h1 className="coming-soon-main-title">
              CIPER AI <br />
              <span className="highlight-gradient">PLATFORM</span>
            </h1>

            <p className="coming-soon-desc">
              We are finalizing the release of the ultimate quantitative signal indicator suite and algorithmic automated pattern scanners. Secure your early access spot today.
            </p>

            <button type="button" className="btn-primary coming-soon-action-btn" onClick={handleStartPreorder}>
              Pre-Order Access Pass
            </button>
            
            <div className="coming-soon-features-small">
              <span>✓ 94% Setup Accuracy</span>
              <span>✓ No-Repaint Signals</span>
              <span>✓ Multi-TF Confirmation</span>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="coming-soon-form-step">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 className="coming-soon-form-title">Secure Pre-Order Spot</h2>
              <button type="button" className="coming-soon-back-btn" onClick={() => setStep('landing')}>
                Back
              </button>
            </div>

            <p className="coming-soon-form-desc">
              Complete details below to pre-book early waitlist access. No payment is required right now.
            </p>

            <form onSubmit={handlePreorderSubmit} className="coming-soon-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 98765 43210"
                  required
                />
              </div>

              <button type="submit" className="btn-primary coming-soon-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="coming-soon-loading-spinner-wrapper">
                    <span className="spinner-loader" />
                    <span>Verifying spot...</span>
                  </span>
                ) : (
                  'Confirm Pre-Order'
                )}
              </button>
            </form>

            {status.message && (
              <div className={`coming-soon-status-msg ${status.type}`}>
                {status.type === 'success' ? '✨' : '⚠️'} {status.message}
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="coming-soon-success-step">
            <div className="success-check-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <h2 className="coming-soon-success-title">Spot Secured!</h2>
            <p className="coming-soon-success-desc">
              Congratulations! Your pre-order was registered successfully. We have dispatched a confirmation email to <strong>{formData.email}</strong>.
            </p>
            <p className="coming-soon-success-subdesc">
              We will contact you directly on WhatsApp at <strong>{formData.phone}</strong> as soon as the platform goes live.
            </p>

            <button type="button" className="btn-secondary coming-soon-ok-btn" onClick={() => setStep('landing')}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

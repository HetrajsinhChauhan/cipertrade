import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin
);

const decodeJwt = (t) => {
  try {
    if (!t) return null;
    const base64Url = t.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

export default function AdminPanel() {
  const [authStep, setAuthStep] = useState('login'); // login, otp, dashboard
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(localStorage.getItem('ciper_admin_token') || '');
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard state data
  const [prebookings, setPrebookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [newIndicator, setNewIndicator] = useState({
    title: '',
    desc: '',
    status: 'Coming Soon',
    monthlyStrikePrice: 399,
    monthlyDiscountPrice: 299,
    annualStrikePrice: 1200,
    annualDiscountPrice: 999,
    countdownTargetDate: '',
    icon: 'trend'
  });
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [config, setConfig] = useState({
    monthlyDiscountPrice: 299,
    monthlyStrikePrice: 399,
    annualDiscountPrice: 999,
    annualStrikePrice: 1200,
    indicatorMode: 'prebook',
    countdownTargetDate: ''
  });

  // Editor states
  const [newPricing, setNewPricing] = useState({ ...config });
  const [newReferral, setNewReferral] = useState({ code: '', name: '', discountPercent: 10 });
  const [activeTab, setActiveTab] = useState('leads'); // leads, referrals, config

  // Profile update states
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [profileOtp, setProfileOtp] = useState('');
  const [profileOtpRequested, setProfileOtpRequested] = useState(false);
  const [profileOtpLoading, setProfileOtpLoading] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
  // PIN verification authentication states
  const [preAuthToken, setPreAuthToken] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Header menu states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const decodedToken = decodeJwt(token);
  const currentAdminEmail = decodedToken ? decodedToken.email : 'admin@cipertrade.com';

  // Check if already logged in on mount
  useEffect(() => {
    if (token) {
      setAuthStep('dashboard');
      fetchDashboardData();
    }
  }, [token]);

  // Set pricing editor when config loads
  useEffect(() => {
    setNewPricing({ ...config });
  }, [config]);

  // Auto-refresh/polling dashboard data every 8 seconds for live updates
  useEffect(() => {
    if (token && authStep === 'dashboard') {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 8000); // 8 seconds polling interval
      return () => clearInterval(interval);
    }
  }, [token, authStep]);

  // Auto-logout after 3 minutes of inactivity
  useEffect(() => {
    if (authStep !== 'dashboard' || !token) return;

    const INACTIVITY_TIME = 3 * 60 * 1000; // 3 minutes in ms
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[SESSION] Auto logging out due to 3-minute inactivity.');
        handleLogout();
        alert('You have been logged out automatically due to 3 minutes of inactivity.');
      }, INACTIVITY_TIME);
    };

    // Track user interaction events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Bind events
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initial start
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [authStep, token]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Leads & Notifications
      const leadsRes = await fetch(`${API_URL}/api/admin/leads`, { headers });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setPrebookings(data.prebookings || []);
        setNotifications(data.notifications || []);
      }

      // Fetch Config
      const configRes = await fetch(`${API_URL}/api/config`);
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      // Fetch Referrals
      const refRes = await fetch(`${API_URL}/api/admin/referrals`, { headers });
      if (refRes.ok) {
        const refData = await refRes.json();
        setReferrals(refData || []);
      }

      // Fetch Indicators
      const indRes = await fetch(`${API_URL}/api/admin/indicators`, { headers });
      if (indRes.ok) {
        const indData = await indRes.json();
        setIndicators(indData || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setAuthStep('otp');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the backend server. Please verify "npm run start-backend" (or node backend/server.js) is running on port 5000.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      
      if (data.step === 'pin') {
        setPreAuthToken(data.token);
        setAuthStep('pin');
        setOtp('');
      } else {
        localStorage.setItem('ciper_admin_token', data.token);
        setToken(data.token);
        setAuthStep('dashboard');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the backend server. Please verify "npm run start-backend" (or node backend/server.js) is running on port 5000.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/verify-pin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${preAuthToken}`
        },
        body: JSON.stringify({ pin: pinCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PIN verification failed');
      
      localStorage.setItem('ciper_admin_token', data.token);
      setToken(data.token);
      setAuthStep('dashboard');
      setPinCode('');
      setPreAuthToken('');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the backend server. Please verify "npm run start-backend" (or node backend/server.js) is running on port 5000.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ciper_admin_token');
    setToken('');
    setAuthStep('login');
    setCredentials({ email: '', password: '' });
    setOtp('');
    setIsNotificationsOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleRequestProfileOtp = async () => {
    setProfileOtpLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/profile/request-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
      setProfileOtpRequested(true);
      setSuccess('Profile update Security OTP sent to your current registered email!');
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileOtpLoading(false);
    }
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileOtp) {
      setError('Please enter the OTP sent to your registered email.');
      return;
    }
    setProfileUpdateLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newEmail: newAdminEmail,
          newPassword: newAdminPassword,
          newPin: newAdminPin,
          otp: profileOtp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      localStorage.setItem('ciper_admin_token', data.token);
      setToken(data.token);
      setSuccess('Admin credentials updated successfully! Active session renewed.');
      
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPin('');
      setProfileOtp('');
      setProfileOtpRequested(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // Admin Actions
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPricing)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save config');
      setConfig(data.config);
      setSuccess('Pricing and indicator configurations updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReferral)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create referral');
      setReferrals([data.referral, ...referrals]);
      setNewReferral({ code: '', name: '', discountPercent: 10 });
      setSuccess(`Influencer code "${data.referral.code}" generated successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAccess = async (leadId) => {
    setActionLoading(leadId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/leads/${leadId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve lead');
      
      setSuccess(`Access approved! Confirmation email dispatched to ${data.lead.email}.`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateExpiry = async (leadId) => {
    setActionLoading(leadId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/leads/${leadId}/simulate-expiry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate expiry');
      setSuccess(`Simulation complete! Subscription for ${data.lead.name} set to expire in 23 hours. Expiration warning email logs sent.`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const copyReferralLink = (code) => {
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert(`Copied link to clipboard:\n${link}`);
  };

  const handleCreateIndicator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/indicators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newIndicator)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create indicator');
      setIndicators([data.indicator, ...indicators]);
      setNewIndicator({
        title: '',
        desc: '',
        status: 'Coming Soon',
        monthlyStrikePrice: 399,
        monthlyDiscountPrice: 299,
        annualStrikePrice: 1200,
        annualDiscountPrice: 999,
        countdownTargetDate: '',
        icon: 'trend'
      });
      setSuccess(`Indicator "${data.indicator.title}" created successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIndicator = async (e) => {
    e.preventDefault();
    if (!editingIndicator) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/indicators/${editingIndicator._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingIndicator)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update indicator');
      setIndicators(indicators.map(ind => ind._id === data.indicator._id ? data.indicator : ind));
      setEditingIndicator(null);
      setSuccess(`Indicator "${data.indicator.title}" settings updated successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndicator = async (id) => {
    if (!window.confirm("Are you sure you want to delete this indicator?")) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/indicators/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete indicator');
      setIndicators(indicators.filter(ind => ind._id !== id));
      setSuccess('Indicator deleted successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rendering
  return (
    <div className="admin-theme-light" style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      {authStep === 'login' && (
        <div className="modal-overlay" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div className="form-container" style={{ maxWidth: '380px', position: 'relative', zIndex: 10 }}>
            <div className="brand-text" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#bd00ff', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>Ciper AI</div>
            <h2>Host Login</h2>
            <p>Provide admin credentials to access the master dashboard.</p>
            {error && <div className="message error" style={{ margin: '0 0 1rem 0', padding: '0.6rem', fontSize: '0.75rem', borderRadius: '8px' }}>⚠️ {error}</div>}
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@cipertrade.ai"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Authenticate'}
              </button>
            </form>
            <a href="/" style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1.2rem', display: 'inline-block', textDecoration: 'underline' }}>Back to site</a>
          </div>
        </div>
      )}

      {authStep === 'otp' && (
        <div className="modal-overlay" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div className="form-container" style={{ maxWidth: '360px', position: 'relative', zIndex: 10 }}>
            <div className="brand-text" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#bd00ff', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>Ciper AI</div>
            <h2>OTP Security Code</h2>
            <p>A verification code was dispatched to your email. Check your inbox (or backend logs).</p>
            {error && <div className="message error" style={{ margin: '0 0 1rem 0', padding: '0.6rem', fontSize: '0.75rem', borderRadius: '8px' }}>⚠️ {error}</div>}
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="123456"
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '8px' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>
            </form>
            <button onClick={() => setAuthStep('login')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', marginTop: '1.2rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Back to login
            </button>
          </div>
        </div>
      )}

      {authStep === 'pin' && (
        <div className="modal-overlay" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div className="form-container" style={{ maxWidth: '360px', position: 'relative', zIndex: 10 }}>
            <div className="brand-text" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#bd00ff', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' }}>Ciper AI</div>
            <h2>Security PIN Code</h2>
            <p>Please enter the 10-digit master security PIN to complete admin verification.</p>
            {error && <div className="message error" style={{ margin: '0 0 1rem 0', padding: '0.6rem', fontSize: '0.75rem', borderRadius: '8px' }}>⚠️ {error}</div>}
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Enter 10-Digit PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••"
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '8px' }}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Verifying PIN...' : 'Verify Security PIN'}
              </button>
            </form>
            <button onClick={() => { setAuthStep('login'); setPreAuthToken(''); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', marginTop: '1.2rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Back to login
            </button>
          </div>
        </div>
      )}

      {authStep === 'dashboard' && (
        <div className="admin-layout">
          {/* Mobile Overlay backdrop */}
          <div 
            className={`admin-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Vertical Sidebar */}
          <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            {/* Sidebar Brand/Logo */}
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #bd00ff, #0057ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>C</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', lineHeight: 1.2 }}>Ciper AI</div>
                <div style={{ fontSize: '0.65rem', color: '#bd00ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Host Panel</div>
              </div>
            </div>

            {/* Sidebar Links */}
            <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setActiveTab('leads'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'leads' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span style={{ flex: 1 }}>Waitlist Leads</span>
                <span style={{ fontSize: '0.72rem', background: activeTab === 'leads' ? 'rgba(189, 0, 255, 0.25)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 600 }}>
                  {prebookings.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('referrals'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'referrals' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                <span style={{ flex: 1 }}>Referral Program</span>
                <span style={{ fontSize: '0.72rem', background: activeTab === 'referrals' ? 'rgba(189, 0, 255, 0.25)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 600 }}>
                  {referrals.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('indicators'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'indicators' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span style={{ flex: 1 }}>Manage Indicators</span>
                <span style={{ fontSize: '0.72rem', background: activeTab === 'indicators' ? 'rgba(189, 0, 255, 0.25)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 600 }}>
                  {indicators.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('config'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'config' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span style={{ flex: 1 }}>Web Config</span>
              </button>

              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span style={{ flex: 1 }}>Admin Profile</span>
              </button>
            </nav>

            {/* Sidebar Logout bottom section */}
            <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Logout Panel</span>
              </button>
            </div>
          </aside>

          {/* Main Container Area */}
          <div className="admin-main-container" onClick={() => { setIsNotificationsOpen(false); setIsProfileMenuOpen(false); }}>
            {/* Top Navigation Header */}
            <header className="admin-header" onClick={(e) => e.stopPropagation()}>
              <div className="admin-header-left">
                {/* Mobile Menu Trigger */}
                <button
                  className="admin-header-menu-btn"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div className="admin-header-title">
                  {activeTab === 'leads' && 'Waitlist Leads'}
                  {activeTab === 'referrals' && 'Referral Program'}
                  {activeTab === 'indicators' && 'Manage Indicators'}
                  {activeTab === 'config' && 'Web Configuration'}
                  {activeTab === 'profile' && 'Admin Profile'}
                </div>
              </div>

              <div className="admin-header-right">
                {/* Notification Dropdown Container */}
                <div className="bell-container">
                  <button 
                    className={`bell-btn ${isNotificationsOpen ? 'active' : ''}`}
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsProfileMenuOpen(false);
                    }}
                    aria-label="Notifications"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    {notifications.length > 0 && (
                      <span className="bell-badge">{notifications.length}</span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="bell-dropdown">
                      <div className="bell-dropdown-header">
                        <span>Alert Notifications</span>
                        <span style={{ fontSize: '0.72rem', color: '#bd00ff', cursor: 'pointer' }} onClick={() => setIsNotificationsOpen(false)}>Close</span>
                      </div>
                      <div className="bell-dropdown-list">
                        {notifications.length === 0 ? (
                          <div className="bell-dropdown-empty">No active expiration alerts</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="bell-dropdown-item" onClick={() => { setActiveTab('leads'); setIsNotificationsOpen(false); }}>
                              <span className="bell-dropdown-msg">{notif.message}</span>
                              <span className="bell-dropdown-date">Expires: {new Date(notif.endDate).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar Dropdown */}
                <div className="profile-container">
                  <button 
                    className="profile-avatar-btn"
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationsOpen(false);
                    }}
                    aria-label="Admin Profile Menu"
                  >
                    {currentAdminEmail ? currentAdminEmail.charAt(0).toUpperCase() : 'A'}
                  </button>

                  {isProfileMenuOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-info">
                        <span className="profile-dropdown-name">{currentAdminEmail}</span>
                        <span className="profile-dropdown-role">Host Administrator</span>
                      </div>
                      <button 
                        className="profile-dropdown-btn"
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileMenuOpen(false);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Edit Profile
                      </button>
                      <button 
                        className="profile-dropdown-btn danger"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="admin-content" style={{ padding: '2rem 3rem', flexGrow: 1 }}>
              {/* Header subtitle area inside page (cleaner) */}
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.2rem', marginBottom: '2rem' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                  {activeTab === 'leads' && 'Approve early-access waitlist members and dispatch confirmation keys.'}
                  {activeTab === 'referrals' && 'Generate and monitor tracking links for influencers.'}
                  {activeTab === 'indicators' && 'Introduce new indicator offerings, configure discount pricing and timers, and view bookings.'}
                  {activeTab === 'config' && 'Configure product pricing plans and booking status.'}
                  {activeTab === 'profile' && 'Update your administrator email and password securely with OTP confirmation.'}
                </p>
              </div>

              {/* Global Message Alerts */}
              {success && <div className="message success" style={{ marginBottom: '1.5rem', borderRadius: '12px', padding: '0.8rem 1.2rem', fontSize: '0.85rem' }}>✨ {success}</div>}
              {error && <div className="message error" style={{ marginBottom: '1.5rem', borderRadius: '12px', padding: '0.8rem 1.2rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}

              {/* Dynamic Alerts Banner */}
              {notifications && notifications.length > 0 && activeTab !== 'profile' && (
                <div style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h4 style={{ color: '#f97316', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 800 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    System Alert: Plan Expiration Approaching
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map((notif) => (
                      <div key={notif.id} style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '8px' }}>
                        <span>{notif.message}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Expires: {new Date(notif.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI Overview row */}
              {activeTab !== 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1.2rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Waitlist Leads</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '5px' }}>{prebookings.length}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1.2rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Indicators</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '5px' }}>{indicators.length}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1.2rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approvals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '5px' }}>{prebookings.filter(p => !p.approved).length}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1.2rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Influencer Links</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '5px' }}>{referrals.length}</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1.2rem', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Indicator mode</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '12px', color: '#bd00ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {config.indicatorMode === 'prebook' ? '📅 PRE-BOOKING' : '⚡ LIVE BOOK NOW'}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Leads */}
              {activeTab === 'leads' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>Early Access Waitlist Members</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(189, 0, 255, 0.08)', color: '#bd00ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(189, 0, 255, 0.2)', fontWeight: 700 }}>
                      {prebookings.length} Total
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700 }}>
                      {prebookings.filter(p => !p.approved).length} Pending
                    </span>
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                        <th style={{ padding: '0.8rem' }}>Name</th>
                        <th style={{ padding: '0.8rem' }}>Email</th>
                        <th style={{ padding: '0.8rem' }}>TradingView</th>
                        <th style={{ padding: '0.8rem' }}>Phone</th>
                        <th style={{ padding: '0.8rem' }}>Plan</th>
                        <th style={{ padding: '0.8rem' }}>Ref</th>
                        <th style={{ padding: '0.8rem' }}>Status</th>
                        <th style={{ padding: '0.8rem' }}>Expiry Date</th>
                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prebookings.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No waitlist entries found yet.</td>
                        </tr>
                      ) : (
                        prebookings.map((lead) => (
                          <tr key={lead._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.3s' }}>
                            <td style={{ padding: '0.8rem', fontWeight: 600 }}>{lead.name}</td>
                            <td style={{ padding: '0.8rem', color: '#94a3b8' }}>{lead.email}</td>
                            <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{lead.tradingView || '-'}</td>
                            <td style={{ padding: '0.8rem', color: '#94a3b8' }}>{lead.phone || '-'}</td>
                            <td style={{ padding: '0.8rem', textTransform: 'capitalize' }}>{lead.plan}</td>
                            <td style={{ padding: '0.8rem', color: '#bd00ff', fontWeight: 600 }}>{lead.refCode || '-'}</td>
                            <td style={{ padding: '0.8rem' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                                background: lead.approved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: lead.approved ? '#10b981' : '#ef4444'
                              }}>
                                {lead.approved ? 'APPROVED' : 'PENDING'}
                              </span>
                            </td>
                            <td style={{ padding: '0.8rem', color: '#94a3b8' }}>
                              {lead.subscriptionEndDate ? new Date(lead.subscriptionEndDate).toLocaleDateString() : '-'}
                            </td>
                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                              {!lead.approved ? (
                                <button
                                  onClick={() => handleConfirmAccess(lead._id)}
                                  className="btn-primary"
                                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.72rem', borderRadius: '6px' }}
                                  disabled={actionLoading === lead._id}
                                >
                                  {actionLoading === lead._id ? 'Sending...' : 'Confirm Access'}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Emailed ✓</span>
                                  {lead.plan === 'monthly' && (
                                    <button
                                      onClick={() => handleSimulateExpiry(lead._id)}
                                      className="btn-secondary"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#f97316', cursor: 'pointer' }}
                                      disabled={actionLoading === lead._id}
                                    >
                                      {actionLoading === lead._id ? 'Simulating...' : 'Simulate Expiry (23h)'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Referrals */}
              {activeTab === 'referrals' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }} className="admin-referrals-grid">
                  
                  {/* Active links list */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto', backdropFilter: 'blur(10px)' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>Active Influencer Links</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                          <th style={{ padding: '0.8rem' }}>Code</th>
                          <th style={{ padding: '0.8rem' }}>Influencer</th>
                          <th style={{ padding: '0.8rem' }}>Discount</th>
                          <th style={{ padding: '0.8rem', textAlign: 'center' }}>Clicks</th>
                          <th style={{ padding: '0.8rem', textAlign: 'center' }}>Bookings</th>
                          <th style={{ padding: '0.8rem', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No influencer codes generated yet. Use the manager panel to create one.</td>
                          </tr>
                        ) : (
                          referrals.map((ref) => (
                            <tr key={ref._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                              <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#0057ff' }}>{ref.code}</td>
                              <td style={{ padding: '0.8rem' }}>{ref.name}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 600 }}>{ref.discountPercent}% OFF</td>
                              <td style={{ padding: '0.8rem', textAlign: 'center', color: '#94a3b8' }}>{ref.clicks}</td>
                              <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{ref.bookingsCount}</td>
                              <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                <button
                                  onClick={() => copyReferralLink(ref.code)}
                                  className="btn-secondary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', borderRadius: '6px' }}
                                >
                                  Copy Link
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Referral Creator */}
                  <div className="form-container" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1.5rem', width: '100%', textAlign: 'left', backdropFilter: 'blur(10px)' }}>
                    <h3 style={{ fontSize: '1.10rem', color: '#fff', marginBottom: '0.4rem', fontWeight: 800 }}>Create Referral Link</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.2rem', lineHeight: '1.3' }}>Enter details below to generate a trackable referral code link for an influencer.</p>
                    <form onSubmit={handleCreateReferral} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Influencer Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Finance Youtuber"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                          value={newReferral.name}
                          onChange={(e) => setNewReferral({ ...newReferral, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Referral Code (Caps/Unique)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. YOUTUBE15"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                          value={newReferral.code}
                          onChange={(e) => setNewReferral({ ...newReferral, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Discount Percentage (%)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          placeholder="10"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                          value={newReferral.discountPercent}
                          onChange={(e) => setNewReferral({ ...newReferral, discountPercent: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                        Generate Link Code
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* Tab: Indicators management */}
              {activeTab === 'indicators' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                  
                  {/* Indicators Table List */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '1.5rem', overflowX: 'auto', backdropFilter: 'blur(10px)', gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>Active Indicators List</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                          <th style={{ padding: '0.8rem' }}>Title</th>
                          <th style={{ padding: '0.8rem' }}>Status</th>
                          <th style={{ padding: '0.8rem', textAlign: 'center' }}>Bookings</th>
                          <th style={{ padding: '0.8rem' }}>Monthly (Strike/Disc)</th>
                          <th style={{ padding: '0.8rem' }}>Annual (Strike/Disc)</th>
                          <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indicators.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No indicators registered yet.</td>
                          </tr>
                        ) : (
                          indicators.map((ind) => (
                            <tr key={ind._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                              <td style={{ padding: '0.8rem', fontWeight: 700 }}>{ind.title}</td>
                              <td style={{ padding: '0.8rem' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800,
                                  background: ind.status.includes('Beta') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: ind.status.includes('Beta') ? '#10b981' : '#ef4444'
                                }}>
                                  {ind.status}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 800, color: '#bd00ff' }}>{ind.bookingsCount}</td>
                              <td style={{ padding: '0.8rem' }}>₹{ind.monthlyStrikePrice} / <strong style={{ color: '#10b981' }}>₹{ind.monthlyDiscountPrice}</strong></td>
                              <td style={{ padding: '0.8rem' }}>₹{ind.annualStrikePrice} / <strong style={{ color: '#10b981' }}>₹{ind.annualDiscountPrice}</strong></td>
                              <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => setEditingIndicator(ind)}
                                    className="btn-secondary"
                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem', borderRadius: '6px' }}
                                  >
                                    Settings
                                  </button>
                                  <button
                                    onClick={() => handleDeleteIndicator(ind._id)}
                                    className="btn-secondary"
                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Indicator Settings Editor (if active) OR Creator Form */}
                  <div className="form-container" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1.5rem', width: '100%', textAlign: 'left', backdropFilter: 'blur(10px)' }}>
                    {editingIndicator ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <h3 style={{ fontSize: '1.10rem', color: '#fff', fontWeight: 800, margin: 0 }}>Edit Indicator</h3>
                          <button onClick={() => setEditingIndicator(null)} style={{ background: 'none', border: 'none', color: '#bd00ff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Cancel</button>
                        </div>
                        <form onSubmit={handleUpdateIndicator} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Indicator Title</label>
                            <input
                              type="text"
                              required
                              value={editingIndicator.title}
                              onChange={(e) => setEditingIndicator({ ...editingIndicator, title: e.target.value })}
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Description</label>
                            <textarea
                              required
                              rows="3"
                              value={editingIndicator.desc}
                              onChange={(e) => setEditingIndicator({ ...editingIndicator, desc: e.target.value })}
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Status Tag</label>
                              <select
                                value={editingIndicator.status}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, status: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff' }}
                              >
                                <option value="Beta Testing">Beta Testing</option>
                                <option value="Coming Soon">Coming Soon</option>
                                <option value="Under Dev">Under Dev</option>
                                <option value="R&D Phase">R&D Phase</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Icon Template</label>
                              <select
                                value={editingIndicator.icon}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, icon: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff' }}
                              >
                                <option value="trend">Trend Line (TL)</option>
                                <option value="volume">Volume Profile</option>
                                <option value="liquidity">Liquidity Grab</option>
                                <option value="correlation">Multi-Correlation</option>
                                <option value="neural">Neural Predictor</option>
                                <option value="momentum">Momentum Osc</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Monthly Strike (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.monthlyStrikePrice}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, monthlyStrikePrice: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Monthly Discounted (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.monthlyDiscountPrice}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, monthlyDiscountPrice: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Annual Strike (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.annualStrikePrice}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, annualStrikePrice: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Annual Discounted (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.annualDiscountPrice}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, annualDiscountPrice: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Discount Target Date (Timer)</label>
                            <input
                              type="datetime-local"
                              value={formatDateTimeLocal(editingIndicator.countdownTargetDate)}
                              onChange={(e) => setEditingIndicator({ ...editingIndicator, countdownTargetDate: e.target.value })}
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%', boxSizing: 'border-box' }}
                            />
                            <span style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '3px', display: 'block' }}>Set target date to trigger countdown timer on landing page, or clear it.</span>
                          </div>

                          <button type="submit" className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                            Save Indicator Settings
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ fontSize: '1.10rem', color: '#fff', marginBottom: '0.4rem', fontWeight: 800 }}>Introduce New Indicator</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.2rem', lineHeight: '1.3' }}>Enter details below to launch a new indicator offering on the waitlist page.</p>
                        <form onSubmit={handleCreateIndicator} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Indicator Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ciper Trend Index"
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              value={newIndicator.title}
                              onChange={(e) => setNewIndicator({ ...newIndicator, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Description</label>
                            <textarea
                              required
                              rows="3"
                              placeholder="Describe indicator capabilities..."
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                              value={newIndicator.desc}
                              onChange={(e) => setNewIndicator({ ...newIndicator, desc: e.target.value })}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Status Tag</label>
                              <select
                                value={newIndicator.status}
                                onChange={(e) => setNewIndicator({ ...newIndicator, status: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff' }}
                              >
                                <option value="Beta Testing">Beta Testing</option>
                                <option value="Coming Soon">Coming Soon</option>
                                <option value="Under Dev">Under Dev</option>
                                <option value="R&D Phase">R&D Phase</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Icon Template</label>
                              <select
                                value={newIndicator.icon}
                                onChange={(e) => setNewIndicator({ ...newIndicator, icon: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff' }}
                              >
                                <option value="trend">Trend Line (TL)</option>
                                <option value="volume">Volume Profile</option>
                                <option value="liquidity">Liquidity Grab</option>
                                <option value="correlation">Multi-Correlation</option>
                                <option value="neural">Neural Predictor</option>
                                <option value="momentum">Momentum Osc</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Monthly Strike (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.monthlyStrikePrice}
                                onChange={(e) => setNewIndicator({ ...newIndicator, monthlyStrikePrice: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Monthly Discounted (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.monthlyDiscountPrice}
                                onChange={(e) => setNewIndicator({ ...newIndicator, monthlyDiscountPrice: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Annual Strike (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.annualStrikePrice}
                                onChange={(e) => setNewIndicator({ ...newIndicator, annualStrikePrice: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>Annual Discounted (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.annualDiscountPrice}
                                onChange={(e) => setNewIndicator({ ...newIndicator, annualDiscountPrice: e.target.value })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.7rem' }}>Discount Target Date (Timer)</label>
                            <input
                              type="datetime-local"
                              value={newIndicator.countdownTargetDate}
                              onChange={(e) => setNewIndicator({ ...newIndicator, countdownTargetDate: e.target.value })}
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>

                          <button type="submit" className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                            Introduce Indicator
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab: Web config settings */}
              {activeTab === 'config' && (
                <div style={{ maxWidth: '560px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>Manage Pricing & Indicator Access</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.8rem' }}>Modify system configurations below. These instantly update prices and checkout text across the website.</p>
                  
                  <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Monthly Strike Price (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="399"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.monthlyStrikePrice}
                          onChange={(e) => setNewPricing({ ...newPricing, monthlyStrikePrice: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Monthly Discounted (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="299"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.monthlyDiscountPrice}
                          onChange={(e) => setNewPricing({ ...newPricing, monthlyDiscountPrice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Annual Strike Price (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="1200"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.annualStrikePrice}
                          onChange={(e) => setNewPricing({ ...newPricing, annualStrikePrice: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Annual Discounted (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="999"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.annualDiscountPrice}
                          onChange={(e) => setNewPricing({ ...newPricing, annualDiscountPrice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>Indicator Access Mode</label>
                      <select
                        value={newPricing.indicatorMode}
                        onChange={(e) => setNewPricing({ ...newPricing, indicatorMode: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="prebook" style={{ background: '#0a0a0c', color: '#fff' }}>Pre-Booking Active (Default Waitlist Mode)</option>
                        <option value="booknow" style={{ background: '#0a0a0c', color: '#fff' }}>Book Now Active (Live Sales Mode)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>Launch Countdown Target Date (Optional)</label>
                      <input
                        type="datetime-local"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff'
                        }}
                        value={formatDateTimeLocal(newPricing.countdownTargetDate)}
                        onChange={(e) => setNewPricing({ ...newPricing, countdownTargetDate: e.target.value })}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Leave blank (or clear it) to show "Starting Soon" on the landing page slider timer.
                      </span>
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                      {loading ? 'Saving configuration...' : 'Save Configuration settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div style={{ maxWidth: '560px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>Update Admin Credentials</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.8rem' }}>
                    Modify your primary administrator login credentials below. A dynamic security verification code (OTP) will be dispatched to your current email address (<strong>{currentAdminEmail}</strong>) to confirm the changes.
                  </p>
                  
                  <form onSubmit={handleUpdateProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>Current Email Address</label>
                      <input
                        type="text"
                        disabled
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', opacity: 0.5, cursor: 'not-allowed' }}
                        value={currentAdminEmail}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>New Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="Enter new email (e.g. admin@cipertrade.com)"
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>New Secure Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Enter new admin password"
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>New Security PIN (Optional)</label>
                      <input
                        type="password"
                        placeholder="Enter new 10-digit security PIN"
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                      />
                    </div>

                    {!profileOtpRequested ? (
                      <button 
                        type="button" 
                        onClick={handleRequestProfileOtp} 
                        className="btn-primary" 
                        style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '8px', marginTop: '0.5rem' }} 
                        disabled={profileOtpLoading || (!newAdminEmail.trim() && !newAdminPassword.trim() && !newAdminPin.trim())}
                      >
                        {profileOtpLoading ? 'Generating Security OTP...' : 'Send OTP to Current Email'}
                      </button>
                    ) : (
                      <>
                        <div className="form-group" style={{ marginBottom: 0, border: '1px solid rgba(189, 0, 255, 0.25)', padding: '1rem', borderRadius: '12px', background: 'rgba(189, 0, 255, 0.02)' }}>
                          <label style={{ fontSize: '0.7rem', color: '#bd00ff' }}>Security OTP Code</label>
                          <input
                            type="text"
                            required
                            maxLength="6"
                            placeholder="Enter 6-digit OTP code"
                            style={{ padding: '0.5rem 0.8rem', fontSize: '0.9rem', borderRadius: '8px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                            value={profileOtp}
                            onChange={(e) => setProfileOtp(e.target.value)}
                          />
                          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', display: 'inline-block' }}>
                            Check your current inbox for the verification key.
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginTop: '0.5rem' }}>
                          <button 
                            type="button" 
                            onClick={() => setProfileOtpRequested(false)} 
                            className="btn-secondary" 
                            style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            Cancel Changes
                          </button>
                          <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '8px' }} 
                            disabled={profileUpdateLoading}
                          >
                            {profileUpdateLoading ? 'Updating credentials...' : 'Verify & Save Profile'}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') || 
  window.location.hostname.startsWith('172.')
    ? `http://${window.location.hostname}:5000`
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
  const [token, setToken] = useState('');
  
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
    monthlyStrikePrice: 199,
    monthlyDiscountPrice: 149,
    annualStrikePrice: 599,
    annualDiscountPrice: 499,
    price1Month: 1749,
    strike1Month: 3499,
    price3Months: 3999,
    strike3Months: 7999,
    price6Months: 6999,
    strike6Months: 13999,
    price1Year: 11499,
    strike1Year: 22999,
    countdownTargetDate: '',
    icon: 'trend'
  });
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [config, setConfig] = useState({
    monthlyDiscountPrice: 149,
    monthlyStrikePrice: 199,
    annualDiscountPrice: 499,
    annualStrikePrice: 599,
    indicatorMode: 'prebook',
    countdownTargetDate: '',
    maintenanceMode: false,
    globalDiscountPercent: 0
  });

  // Editor states
  const [newPricing, setNewPricing] = useState({ ...config });
  const [newReferral, setNewReferral] = useState({ code: '', name: '', discountPercent: 10 });
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, leads, referrals, indicators, config, profile, cms

  // Subscriptions management states
  const [subscriptions, setSubscriptions] = useState([]);
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateDesc');

  // Web CMS Copy State
  const [cmsContent, setCmsContent] = useState({
    heroBadge: "Ciper AI Platform",
    heroTitle1: "Automate",
    heroTitle2: "Your Market Edge",
    heroDesc: "Ciper uses advanced neural networks to map out the market in real-time. Detects support/resistance zones, high-probability convergence areas, and breakouts automatically.",
    heroSlide2Badge: "Featured Indicator",
    heroSlide2Title1: "Ciper Eye",
    heroSlide2Title2: "Signal Engine",
    heroSlide2Desc: "Generates high-probability buy/sell signals. Integrate it with your existing strategy to get precise entry, take profit (TP), and stop loss (SL) levels.",
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
    faqs: [],
    reviews: []
  });

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

  // Check session on mount via silent refresh
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            setToken(data.token);
            setAuthStep('dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to restore admin session:', err);
      }
    };
    restoreSession();
  }, []);

  // Fetch dashboard data when token or authStep changes
  useEffect(() => {
    if (token && authStep === 'dashboard') {
      fetchDashboardData();
    }
  }, [token, authStep]);

  // Silent refresh interval every 14 minutes
  useEffect(() => {
    if (authStep !== 'dashboard' || !token) return;

    const FOURTEEN_MINUTES = 14 * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            console.log('[SESSION] Silent refresh successful.');
            setToken(data.token);
          }
        } else {
          console.warn('[SESSION] Silent refresh failed, logging out.');
          handleLogout();
        }
      } catch (err) {
        console.error('[SESSION] Error during silent refresh:', err);
      }
    }, FOURTEEN_MINUTES);

    return () => clearInterval(interval);
  }, [authStep, token]);

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

      // Fetch WebContent Copy (CMS)
      const webcontentRes = await fetch(`${API_URL}/api/webcontent`);
      if (webcontentRes.ok) {
        const webcontentData = await webcontentRes.json();
        setCmsContent(webcontentData);
      }

      // Fetch Subscriptions
      const subRes = await fetch(`${API_URL}/api/admin/subscriptions`, { headers });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptions(subData || []);
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

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to logout from backend:', err);
    }
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

  const handleSaveCmsContent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/webcontent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cmsContent)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save CMS settings');
      setCmsContent(data.content);
      setSuccess('Website landing page CMS settings updated successfully! Changes are live.');
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

  const getSubscriptionStatus = (sub) => {
    if (sub.status === 'revoked') return 'expired';
    const now = new Date();
    const end = new Date(sub.endDate);
    if (end <= now) return 'expired';
    
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'expiring_soon';
    
    return 'active';
  };

  const handleExtendSubscription = async (id) => {
    if (!window.confirm("Are you sure you want to extend this subscription by 30 days?")) return;
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/extend`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend subscription');
      setSuccess('Subscription extended by 30 days successfully!');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeSubscription = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this subscription access?")) return;
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke subscription');
      setSuccess('Subscription access revoked successfully!');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredSubscriptions = () => {
    let list = [...subscriptions];
    
    if (subSearchQuery.trim()) {
      const q = subSearchQuery.toLowerCase().trim();
      list = list.filter(sub => {
        const email = sub.userId?.email || '';
        return email.toLowerCase().includes(q);
      });
    }
    
    if (subPlanFilter !== 'all') {
      list = list.filter(sub => sub.planId === subPlanFilter);
    }
    
    if (subStatusFilter !== 'all') {
      list = list.filter(sub => {
        const status = getSubscriptionStatus(sub);
        return status === subStatusFilter;
      });
    }
    
    return list;
  };

  const exportToCSV = () => {
    const filtered = getFilteredSubscriptions();
    const headers = ['User Email', 'Plan ID', 'Plan Name', 'Amount', 'Start Date', 'End Date', 'Status'];
    const rows = filtered.map(sub => [
      sub.userId?.email || '',
      sub.planId,
      sub.planName,
      sub.amount,
      new Date(sub.startDate).toLocaleDateString(),
      new Date(sub.endDate).toLocaleDateString(),
      getSubscriptionStatus(sub).toUpperCase()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscriptions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        monthlyStrikePrice: 199,
        monthlyDiscountPrice: 149,
        annualStrikePrice: 599,
        annualDiscountPrice: 499,
        price1Month: 1749,
        strike1Month: 3499,
        price3Months: 3999,
        strike3Months: 7999,
        price6Months: 6999,
        strike6Months: 13999,
        price1Year: 11499,
        strike1Year: 22999,
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

  // Get filtered and sorted waitlist leads
  const getFilteredAndSortedLeads = () => {
    let list = [...prebookings];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.email && p.email.toLowerCase().includes(q)) || 
        (p.refCode && p.refCode.toLowerCase().includes(q)) || 
        (p.tradingView && p.tradingView.toLowerCase().includes(q))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const isApproved = statusFilter === 'approved';
      list = list.filter(p => p.approved === isApproved);
    }
    
    // Plan filter
    if (planFilter !== 'all') {
      list = list.filter(p => p.plan === planFilter);
    }
    
    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'dateDesc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'dateAsc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'nameAsc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'planValDesc') {
        const valA = a.plan === 'annual' ? 2 : (a.plan === 'monthly' ? 1 : 0);
        const valB = b.plan === 'annual' ? 2 : (b.plan === 'monthly' ? 1 : 0);
        return valB - valA;
      }
      return 0;
    });
    
    return list;
  };

  const getDiscountPercent = (strike, discount) => {
    const s = Number(strike) || 0;
    const d = Number(discount) || 0;
    if (s <= 0) return 0;
    return Math.round(((s - d) / s) * 100);
  };

  const renderSavingsLabel = (strike, discount) => {
    const s = Number(strike) || 0;
    const d = Number(discount) || 0;
    if (s <= 0 || d >= s) return null;
    const savings = s - d;
    const pct = Math.round((savings / s) * 100);
    return (
      <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'block', marginTop: '4px', fontWeight: 600 }}>
        Save ₹{savings} ({pct}% off)
      </span>
    );
  };

  // Rendering
  return (
    <div className="admin-theme-dark" style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', backgroundColor: '#09090b', color: '#f4f4f5' }}>
      {authStep === 'login' && (
        <div className="modal-overlay" style={{ background: '#09090b', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
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
                  autocomplete="off"
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
        <div className="modal-overlay" style={{ background: '#09090b', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
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
                  autocomplete="off"
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
        <div className="modal-overlay" style={{ background: '#09090b', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
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
                  autocomplete="off"
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
                onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                <span style={{ flex: 1 }}>Analytics Dashboard</span>
              </button>

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
                onClick={() => { setActiveTab('subscriptions'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'subscriptions' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span style={{ flex: 1 }}>Subscriptions</span>
                <span style={{ fontSize: '0.72rem', background: activeTab === 'subscriptions' ? 'rgba(189, 0, 255, 0.25)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 600 }}>
                  {subscriptions.length}
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
                onClick={() => { setActiveTab('cms'); setIsSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'cms' ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span style={{ flex: 1 }}>Website CMS</span>
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
                  {activeTab === 'analytics' && 'Analytics Dashboard'}
                  {activeTab === 'leads' && 'Waitlist Leads'}
                  {activeTab === 'subscriptions' && 'User Subscriptions'}
                  {activeTab === 'referrals' && 'Referral Program'}
                  {activeTab === 'indicators' && 'Manage Indicators'}
                  {activeTab === 'config' && 'Web Configuration'}
                  {activeTab === 'cms' && 'Website CMS Settings'}
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
                  {activeTab === 'analytics' && 'Visualize platform metrics, plan preferences, and conversion rates.'}
                  {activeTab === 'leads' && 'Approve early-access waitlist members and dispatch confirmation keys.'}
                  {activeTab === 'subscriptions' && 'Manage active, expired, and expiring user subscriptions, extend access, or revoke license.'}
                  {activeTab === 'referrals' && 'Generate and monitor tracking links for influencers.'}
                  {activeTab === 'indicators' && 'Introduce new indicator offerings, configure discount pricing and timers, and view bookings.'}
                  {activeTab === 'config' && 'Configure product pricing plans and booking status.'}
                  {activeTab === 'profile' && 'Update your administrator email and password securely with OTP confirmation.'}
                  {activeTab === 'cms' && 'Customize copy, statistics numbers, FAQs, and subscriber reviews shown on the landing page.'}
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
              {activeTab === 'analytics' && (
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

              {/* Tab: Analytics */}
              {activeTab === 'analytics' && (() => {
                const totalLeads = prebookings.length;
                const approvedCount = prebookings.filter(p => p.approved).length;
                const pendingCount = totalLeads - approvedCount;
                const convRate = totalLeads > 0 ? Math.round((approvedCount / totalLeads) * 100) : 0;
                
                const monthlyCount = prebookings.filter(p => p.plan === 'monthly').length;
                const annualCount = prebookings.filter(p => p.plan === 'annual').length;
                const unspecifiedCount = totalLeads - (monthlyCount + annualCount);
                
                const monthlyApproved = prebookings.filter(p => p.approved && p.plan === 'monthly').length;
                const annualApproved = prebookings.filter(p => p.approved && p.plan === 'annual').length;
                
                // Calculate projected monthly recurring revenue (MRR)
                const estMRR = (monthlyApproved * config.monthlyDiscountPrice) + Math.round((annualApproved * config.annualDiscountPrice) / 12);
                const totalRevenue = (monthlyApproved * config.monthlyDiscountPrice) + (annualApproved * config.annualDiscountPrice);
                
                // Calculate total clicks on referral links
                const totalRefClicks = referrals.reduce((sum, r) => sum + (r.clicks || 0), 0);
                const totalRefBookings = referrals.reduce((sum, r) => sum + (r.bookingsCount || 0), 0);
                const refConvRate = totalRefClicks > 0 ? ((totalRefBookings / totalRefClicks) * 100).toFixed(1) : '0';

                // Sort influencers by performance
                const sortedReferrals = [...referrals].sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0)).slice(0, 5);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Analytics Overview Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                      <div className="form-container" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Plan Conversion Rate</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981' }}>{convRate}%</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({approvedCount} of {totalLeads} approved)</span>
                        </div>
                        {/* CSS Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ width: `${convRate}%`, height: '100%', background: '#10b981', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                        </div>
                      </div>

                      <div className="form-container" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Projected MRR</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#bd00ff' }}>₹{estMRR.toLocaleString()}</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ month</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Based on active approvals (Annual pass amortized monthly)</span>
                      </div>

                      <div className="form-container" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Total Realized Revenue</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0057ff' }}>₹{totalRevenue.toLocaleString()}</span>
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>Cash Received</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Gross earnings from approved monthly and annual billing passes</span>
                      </div>
                    </div>

                    {/* Mid Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
                      {/* Subscription breakdown card */}
                      <div className="form-container" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Pass Selection Breakdown</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {/* Annual bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                              <span style={{ color: '#bd00ff', fontWeight: '600' }}>Annual Pass (Best Value)</span>
                              <span style={{ fontWeight: '800' }}>{annualCount} ({totalLeads > 0 ? Math.round((annualCount / totalLeads) * 100) : 0}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${totalLeads > 0 ? (annualCount / totalLeads) * 100 : 0}%`, height: '100%', background: '#bd00ff' }}></div>
                            </div>
                          </div>

                          {/* Monthly bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                              <span style={{ color: '#0057ff', fontWeight: '600' }}>Monthly Pass</span>
                              <span style={{ fontWeight: '800' }}>{monthlyCount} ({totalLeads > 0 ? Math.round((monthlyCount / totalLeads) * 100) : 0}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${totalLeads > 0 ? (monthlyCount / totalLeads) * 100 : 0}%`, height: '100%', background: '#0057ff' }}></div>
                            </div>
                          </div>

                          {/* Unspecified bar */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                              <span style={{ color: '#94a3b8', fontWeight: '600' }}>Unspecified</span>
                              <span style={{ fontWeight: '800' }}>{unspecifiedCount} ({totalLeads > 0 ? Math.round((unspecifiedCount / totalLeads) * 100) : 0}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${totalLeads > 0 ? (unspecifiedCount / totalLeads) * 100 : 0}%`, height: '100%', background: '#94a3b8' }}></div>
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ color: '#64748b', display: 'block' }}>Monthly Approvals</span>
                            <strong style={{ fontSize: '1rem', color: '#fff' }}>{monthlyApproved} active</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', display: 'block' }}>Annual Approvals</span>
                            <strong style={{ fontSize: '1rem', color: '#fff' }}>{annualApproved} active</strong>
                          </div>
                        </div>
                      </div>

                      {/* Top Influencers Card */}
                      <div className="form-container" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Top Referral Codes</h4>
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '750' }}>{refConvRate}% Avg Conv</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sortedReferrals.length === 0 ? (
                            <div style={{ color: '#64748b', fontSize: '0.82rem', padding: '2rem 0', textAlign: 'center' }}>No referral statistics logged.</div>
                          ) : (
                            sortedReferrals.map((ref) => {
                              const conversion = ref.clicks > 0 ? Math.round((ref.bookingsCount / ref.clicks) * 100) : 0;
                              return (
                                <div key={ref._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: '700', fontFamily: 'monospace', color: '#0057ff' }}>{ref.code} ({ref.name})</span>
                                    <span style={{ color: '#94a3b8' }}>
                                      <strong>{ref.bookingsCount}</strong> bookings / {ref.clicks} clicks ({conversion}%)
                                    </span>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(conversion, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #0057ff, #bd00ff)', borderRadius: '3px' }}></div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tab: Leads */}
              {activeTab === 'leads' && (
                <div className="admin-card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>Early Access Waitlist Members</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(189, 0, 255, 0.08)', color: '#bd00ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(189, 0, 255, 0.2)', fontWeight: 700 }}>
                      {prebookings.length} Total
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700 }}>
                      {prebookings.filter(p => !p.approved).length} Pending
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(0, 87, 255, 0.08)', color: '#0057ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0, 87, 255, 0.2)', fontWeight: 700 }}>
                      {getFilteredAndSortedLeads().length} Filtered
                    </span>
                  </h3>

                  {/* Leads search, filters and sort controls */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '1.5rem',
                    padding: '1.2rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '16px'
                  }}>
                    <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Leads</label>
                      <input
                        type="text"
                        placeholder="Search by name, email, TradingView user, or ref code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          width: '100%'
                        }}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Filter</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved Only</option>
                        <option value="pending">Pending Only</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Filter</label>
                      <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Plans</option>
                        <option value="monthly">Monthly Pass</option>
                        <option value="annual">Annual Pass</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="dateDesc">Newest First</option>
                        <option value="dateAsc">Oldest First</option>
                        <option value="nameAsc">Name A-Z</option>
                        <option value="planValDesc">Plan Value</option>
                      </select>
                    </div>
                  </div>

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
                      {getFilteredAndSortedLeads().length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No waitlist entries found matching filters.</td>
                        </tr>
                      ) : (
                        getFilteredAndSortedLeads().map((lead) => (
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

              {/* Tab: Subscriptions */}
              {activeTab === 'subscriptions' && (
                <div className="admin-card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>Active Member Subscriptions</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(189, 0, 255, 0.08)', color: '#bd00ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(189, 0, 255, 0.2)', fontWeight: 700 }}>
                      {subscriptions.length} Total
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 700 }}>
                      {subscriptions.filter(s => getSubscriptionStatus(s) === 'active').length} Active
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(0, 87, 255, 0.08)', color: '#0057ff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0, 87, 255, 0.2)', fontWeight: 700 }}>
                      {getFilteredSubscriptions().length} Filtered
                    </span>
                  </h3>

                  {/* Subscriptions search, filters, and export */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '1.5rem',
                    padding: '1.2rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '16px',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Email</label>
                      <input
                        type="text"
                        placeholder="Search by subscriber email..."
                        value={subSearchQuery}
                        onChange={(e) => setSubSearchQuery(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          width: '100%'
                        }}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Filter</label>
                      <select
                        value={subPlanFilter}
                        onChange={(e) => setSubPlanFilter(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Plans</option>
                        <option value="1month">1 Month</option>
                        <option value="3months">3 Months</option>
                        <option value="6months">6 Months</option>
                        <option value="1year">1 Year</option>
                      </select>
                    </div>
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Filter</label>
                      <select
                        value={subStatusFilter}
                        onChange={(e) => setSubStatusFilter(e.target.value)}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="expiring_soon">Expiring Soon</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <button
                      onClick={exportToCSV}
                      className="btn-primary"
                      style={{
                        padding: '0.55rem 1.2rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        height: 'fit-content',
                        border: 'none',
                        fontWeight: 600
                      }}
                    >
                      Export CSV
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                        <th style={{ padding: '0.8rem' }}>Subscriber</th>
                        <th style={{ padding: '0.8rem' }}>TradingView</th>
                        <th style={{ padding: '0.8rem' }}>Phone</th>
                        <th style={{ padding: '0.8rem' }}>Plan</th>
                        <th style={{ padding: '0.8rem' }}>Amount</th>
                        <th style={{ padding: '0.8rem' }}>Start Date</th>
                        <th style={{ padding: '0.8rem' }}>End Date</th>
                        <th style={{ padding: '0.8rem' }}>Status</th>
                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredSubscriptions().length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No subscriptions found matching filters.</td>
                        </tr>
                      ) : (
                        getFilteredSubscriptions().map((sub) => {
                          const status = getSubscriptionStatus(sub);
                          let badgeBg = 'rgba(16, 185, 129, 0.12)';
                          let badgeColor = '#10b981';
                          let badgeText = 'Active';

                          if (status === 'expiring_soon') {
                            badgeBg = 'rgba(249, 115, 22, 0.12)';
                            badgeColor = '#f97316';
                            badgeText = 'Expiring Soon';
                          } else if (status === 'expired') {
                            badgeBg = 'rgba(239, 68, 68, 0.12)';
                            badgeColor = '#ef4444';
                            badgeText = 'Expired';
                          }

                          return (
                            <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.3s' }}>
                              <td style={{ padding: '0.8rem' }}>
                                <div style={{ fontWeight: 600, color: '#fff' }}>{sub.userId?.name || 'N/A'}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{sub.userId?.email || 'N/A'}</div>
                              </td>
                              <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{sub.userId?.tradingViewUsername || '-'}</td>
                              <td style={{ padding: '0.8rem', color: '#94a3b8' }}>{sub.userId?.phone || '-'}</td>
                              <td style={{ padding: '0.8rem', fontWeight: 600 }}>{sub.planName}</td>
                              <td style={{ padding: '0.8rem', color: '#bd00ff', fontWeight: 700 }}>₹{sub.amount}</td>
                              <td style={{ padding: '0.8rem', color: '#94a3b8' }}>{new Date(sub.startDate).toLocaleDateString()}</td>
                              <td style={{ padding: '0.8rem', color: '#94a3b8' }}>{new Date(sub.endDate).toLocaleDateString()}</td>
                              <td style={{ padding: '0.8rem' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                                  background: badgeBg,
                                  color: badgeColor
                                }}>
                                  {badgeText.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => handleExtendSubscription(sub._id)}
                                    className="btn-secondary"
                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer' }}
                                    disabled={actionLoading === sub._id}
                                  >
                                    Extend 30d
                                  </button>
                                  {status !== 'expired' && (
                                    <button
                                      onClick={() => handleRevokeSubscription(sub._id)}
                                      className="btn-secondary"
                                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                                      disabled={actionLoading === sub._id}
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Referrals */}
              {activeTab === 'referrals' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }} className="admin-referrals-grid">
                  
                  {/* Active links list */}
                  <div className="admin-card" style={{ overflowX: 'auto' }}>
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
                  <div className="admin-card" style={{ width: '100%', textAlign: 'left' }}>
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
                  <div className="admin-card" style={{ overflowX: 'auto', gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>Active Indicators List</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                          <th style={{ padding: '0.8rem' }}>Title</th>
                          <th style={{ padding: '0.8rem' }}>Status</th>
                          <th style={{ padding: '0.8rem', textAlign: 'center' }}>Bookings</th>
                          <th style={{ padding: '0.8rem' }}>1 Month</th>
                          <th style={{ padding: '0.8rem' }}>3 Months</th>
                          <th style={{ padding: '0.8rem' }}>6 Months</th>
                          <th style={{ padding: '0.8rem' }}>1 Year</th>
                          <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indicators.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No indicators registered yet.</td>
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
                              <td style={{ padding: '0.8rem' }}>₹{ind.strike1Month ?? 3499} / <strong style={{ color: '#10b981' }}>₹{ind.price1Month ?? 1749}</strong></td>
                              <td style={{ padding: '0.8rem' }}>₹{ind.strike3Months ?? 7999} / <strong style={{ color: '#10b981' }}>₹{ind.price3Months ?? 3999}</strong></td>
                              <td style={{ padding: '0.8rem' }}>₹{ind.strike6Months ?? 13999} / <strong style={{ color: '#10b981' }}>₹{ind.price6Months ?? 6999}</strong></td>
                              <td style={{ padding: '0.8rem' }}>₹{ind.strike1Year ?? 22999} / <strong style={{ color: '#10b981' }}>₹{ind.price1Year ?? 11499}</strong></td>
                              <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => setEditingIndicator({
                                      ...ind,
                                      price1Month: ind.price1Month ?? 1749,
                                      strike1Month: ind.strike1Month ?? 3499,
                                      price3Months: ind.price3Months ?? 3999,
                                      strike3Months: ind.strike3Months ?? 7999,
                                      price6Months: ind.price6Months ?? 6999,
                                      strike6Months: ind.strike6Months ?? 13999,
                                      price1Year: ind.price1Year ?? 11499,
                                      strike1Year: ind.strike1Year ?? 22999
                                    })}
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
                  <div className="admin-card" style={{ width: '100%', textAlign: 'left' }}>
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

                          {/* 1 Month Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.strike1Month ?? 3499}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, strike1Month: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(editingIndicator.strike1Month ?? 3499, editingIndicator.price1Month ?? 1749)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(editingIndicator.strike1Month ?? 3499) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setEditingIndicator({ ...editingIndicator, price1Month: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.price1Month ?? 1749}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, price1Month: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(editingIndicator.strike1Month ?? 3499, editingIndicator.price1Month ?? 1749)}
                            </div>
                          </div>

                          {/* 3 Months Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.strike3Months ?? 7999}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, strike3Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(editingIndicator.strike3Months ?? 7999, editingIndicator.price3Months ?? 3999)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(editingIndicator.strike3Months ?? 7999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setEditingIndicator({ ...editingIndicator, price3Months: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.price3Months ?? 3999}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, price3Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(editingIndicator.strike3Months ?? 7999, editingIndicator.price3Months ?? 3999)}
                            </div>
                          </div>

                          {/* 6 Months Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.strike6Months ?? 13999}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, strike6Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(editingIndicator.strike6Months ?? 13999, editingIndicator.price6Months ?? 6999)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(editingIndicator.strike6Months ?? 13999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setEditingIndicator({ ...editingIndicator, price6Months: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.price6Months ?? 6999}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, price6Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(editingIndicator.strike6Months ?? 13999, editingIndicator.price6Months ?? 6999)}
                            </div>
                          </div>

                          {/* 1 Year Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.strike1Year ?? 22999}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, strike1Year: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(editingIndicator.strike1Year ?? 22999, editingIndicator.price1Year ?? 11499)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(editingIndicator.strike1Year ?? 22999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setEditingIndicator({ ...editingIndicator, price1Year: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={editingIndicator.price1Year ?? 11499}
                                onChange={(e) => setEditingIndicator({ ...editingIndicator, price1Year: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(editingIndicator.strike1Year ?? 22999, editingIndicator.price1Year ?? 11499)}
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

                          {/* 1 Month Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.strike1Month ?? 3499}
                                onChange={(e) => setNewIndicator({ ...newIndicator, strike1Month: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(newIndicator.strike1Month ?? 3499, newIndicator.price1Month ?? 1749)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(newIndicator.strike1Month ?? 3499) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setNewIndicator({ ...newIndicator, price1Month: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Month Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.price1Month ?? 1749}
                                onChange={(e) => setNewIndicator({ ...newIndicator, price1Month: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(newIndicator.strike1Month ?? 3499, newIndicator.price1Month ?? 1749)}
                            </div>
                          </div>

                          {/* 3 Months Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.strike3Months ?? 7999}
                                onChange={(e) => setNewIndicator({ ...newIndicator, strike3Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(newIndicator.strike3Months ?? 7999, newIndicator.price3Months ?? 3999)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(newIndicator.strike3Months ?? 7999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setNewIndicator({ ...newIndicator, price3Months: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>3 Months Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.price3Months ?? 3999}
                                onChange={(e) => setNewIndicator({ ...newIndicator, price3Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(newIndicator.strike3Months ?? 7999, newIndicator.price3Months ?? 3999)}
                            </div>
                          </div>

                          {/* 6 Months Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.strike6Months ?? 13999}
                                onChange={(e) => setNewIndicator({ ...newIndicator, strike6Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(newIndicator.strike6Months ?? 13999, newIndicator.price6Months ?? 6999)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(newIndicator.strike6Months ?? 13999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setNewIndicator({ ...newIndicator, price6Months: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>6 Months Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.price6Months ?? 6999}
                                onChange={(e) => setNewIndicator({ ...newIndicator, price6Months: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(newIndicator.strike6Months ?? 13999, newIndicator.price6Months ?? 6999)}
                            </div>
                          </div>

                          {/* 1 Year Plan */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Strike Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.strike1Year ?? 22999}
                                onChange={(e) => setNewIndicator({ ...newIndicator, strike1Year: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Discount %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getDiscountPercent(newIndicator.strike1Year ?? 22999, newIndicator.price1Year ?? 11499)}
                                onChange={(e) => {
                                  const pct = Number(e.target.value) || 0;
                                  const strike = Number(newIndicator.strike1Year ?? 22999) || 0;
                                  const disc = strike - Math.round(strike * (pct / 100));
                                  setNewIndicator({ ...newIndicator, price1Year: disc });
                                }}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.7rem' }}>1 Year Discounted Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={newIndicator.price1Year ?? 11499}
                                onChange={(e) => setNewIndicator({ ...newIndicator, price1Year: Number(e.target.value) })}
                                style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              />
                              {renderSavingsLabel(newIndicator.strike1Year ?? 22999, newIndicator.price1Year ?? 11499)}
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
                <div className="admin-card" style={{ maxWidth: '560px' }}>
                  <h3 style={{ marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>Manage Pricing & Indicator Access</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.8rem' }}>Modify system configurations below. These instantly update prices and checkout text across the website.</p>
                  
                  <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Monthly Strike Price (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="399"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.monthlyStrikePrice}
                          onChange={(e) => setNewPricing({ ...newPricing, monthlyStrikePrice: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Monthly Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={getDiscountPercent(newPricing.monthlyStrikePrice, newPricing.monthlyDiscountPrice)}
                          onChange={(e) => {
                            const pct = Number(e.target.value) || 0;
                            const strike = Number(newPricing.monthlyStrikePrice) || 0;
                            const disc = strike - Math.round(strike * (pct / 100));
                            setNewPricing({ ...newPricing, monthlyDiscountPrice: disc });
                          }}
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
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
                          onChange={(e) => setNewPricing({ ...newPricing, monthlyDiscountPrice: Number(e.target.value) })}
                        />
                        {renderSavingsLabel(newPricing.monthlyStrikePrice, newPricing.monthlyDiscountPrice)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Annual Strike Price (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="1200"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
                          value={newPricing.annualStrikePrice}
                          onChange={(e) => setNewPricing({ ...newPricing, annualStrikePrice: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Annual Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={getDiscountPercent(newPricing.annualStrikePrice, newPricing.annualDiscountPrice)}
                          onChange={(e) => {
                            const pct = Number(e.target.value) || 0;
                            const strike = Number(newPricing.annualStrikePrice) || 0;
                            const disc = strike - Math.round(strike * (pct / 100));
                            setNewPricing({ ...newPricing, annualDiscountPrice: disc });
                          }}
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(189, 0, 255, 0.05)', borderColor: 'rgba(189,0,255,0.2)' }}
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
                          onChange={(e) => setNewPricing({ ...newPricing, annualDiscountPrice: Number(e.target.value) })}
                        />
                        {renderSavingsLabel(newPricing.annualStrikePrice, newPricing.annualDiscountPrice)}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem' }}>Global Discount Percent (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="e.g. 10"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '2px solid rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          boxSizing: 'border-box'
                        }}
                        value={newPricing.globalDiscountPercent ?? 0}
                        onChange={(e) => setNewPricing({ ...newPricing, globalDiscountPercent: Number(e.target.value) })}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#00D4AA', marginTop: '4px', display: 'block', fontWeight: '800' }}>
                        Applied globally to discount all pricing plans for all indicators. Set to 0 to disable.
                      </span>
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

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <span>⚠️ System Maintenance Mode</span>
                        <span style={{
                          fontSize: '0.65rem',
                          background: newPricing.maintenanceMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: newPricing.maintenanceMode ? '#ef4444' : '#10b981',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700
                        }}>
                          {newPricing.maintenanceMode ? 'ACTIVE (BLOCKING ACCESS)' : 'INACTIVE (NORMAL ACCESS)'}
                        </span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          id="maintenanceMode"
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#bd00ff'
                          }}
                          checked={newPricing.maintenanceMode || false}
                          onChange={(e) => setNewPricing({ ...newPricing, maintenanceMode: e.target.checked })}
                        />
                        <label htmlFor="maintenanceMode" style={{ fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 'normal', userSelect: 'none' }}>
                          Enable maintenance mode to block user access to the website and display a maintenance notice screen.
                        </label>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.75rem', fontSize: '0.85rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                      {loading ? 'Saving configuration...' : 'Save Configuration settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Website CMS Settings */}
              {activeTab === 'cms' && (
                <div className="admin-card">
                  <h3 style={{ marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>Website CMS Copy Settings</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.8rem' }}>Modify any text copy, stats numbers, FAQs, or reviews shown on the landing page.</p>
                  
                  <form onSubmit={handleSaveCmsContent} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Section: Hero Slide 1 */}
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ color: '#bd00ff', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>Hero Slide 1 Copy</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Badge Label</label>
                          <input type="text" value={cmsContent.heroBadge || ''} onChange={(e) => setCmsContent({...cmsContent, heroBadge: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Title Highlight (Purple)</label>
                          <input type="text" value={cmsContent.heroTitle1 || ''} onChange={(e) => setCmsContent({...cmsContent, heroTitle1: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Title Rest (White)</label>
                          <input type="text" value={cmsContent.heroTitle2 || ''} onChange={(e) => setCmsContent({...cmsContent, heroTitle2: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Slide 1 Description</label>
                        <textarea rows="3" value={cmsContent.heroDesc || ''} onChange={(e) => setCmsContent({...cmsContent, heroDesc: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>

                    {/* Section: Hero Slide 2 */}
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ color: '#bd00ff', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>Hero Slide 2 Copy (Featured Indicator Slide)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Badge Label</label>
                          <input type="text" value={cmsContent.heroSlide2Badge || ''} onChange={(e) => setCmsContent({...cmsContent, heroSlide2Badge: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Title Highlight (Purple)</label>
                          <input type="text" value={cmsContent.heroSlide2Title1 || ''} onChange={(e) => setCmsContent({...cmsContent, heroSlide2Title1: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Title Rest (White)</label>
                          <input type="text" value={cmsContent.heroSlide2Title2 || ''} onChange={(e) => setCmsContent({...cmsContent, heroSlide2Title2: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Slide 2 Description</label>
                        <textarea rows="3" value={cmsContent.heroSlide2Desc || ''} onChange={(e) => setCmsContent({...cmsContent, heroSlide2Desc: e.target.value})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%' }} />
                      </div>
                    </div>

                    {/* Section: Platform Metrics */}
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ color: '#bd00ff', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>Model Accuracy & Statistics</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Model Accuracy Radial Value (%)</label>
                          <input type="number" min="0" max="100" value={cmsContent.accuracyValue || 0} onChange={(e) => setCmsContent({...cmsContent, accuracyValue: Number(e.target.value)})} style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 1 Metric (e.g. 730K)</label>
                          <input type="text" value={cmsContent.stat1Num || ''} onChange={(e) => setCmsContent({...cmsContent, stat1Num: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 1 Label</label>
                          <input type="text" value={cmsContent.stat1Label || ''} onChange={(e) => setCmsContent({...cmsContent, stat1Label: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 1 Description</label>
                          <input type="text" value={cmsContent.stat1Desc || ''} onChange={(e) => setCmsContent({...cmsContent, stat1Desc: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 2 Metric (e.g. 94%)</label>
                          <input type="text" value={cmsContent.stat2Num || ''} onChange={(e) => setCmsContent({...cmsContent, stat2Num: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 2 Label</label>
                          <input type="text" value={cmsContent.stat2Label || ''} onChange={(e) => setCmsContent({...cmsContent, stat2Label: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 2 Description</label>
                          <input type="text" value={cmsContent.stat2Desc || ''} onChange={(e) => setCmsContent({...cmsContent, stat2Desc: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 3 Metric (e.g. 12K+)</label>
                          <input type="text" value={cmsContent.stat3Num || ''} onChange={(e) => setCmsContent({...cmsContent, stat3Num: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 3 Label</label>
                          <input type="text" value={cmsContent.stat3Label || ''} onChange={(e) => setCmsContent({...cmsContent, stat3Label: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.65rem' }}>Stat 3 Description</label>
                          <input type="text" value={cmsContent.stat3Desc || ''} onChange={(e) => setCmsContent({...cmsContent, stat3Desc: e.target.value})} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '8px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Section: FAQs Manager */}
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ color: '#bd00ff', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>Frequently Asked Questions</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                        {cmsContent.faqs && cmsContent.faqs.map((faq, index) => (
                          <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>FAQ #{index + 1}</span>
                              <button type="button" onClick={() => {
                                const list = [...cmsContent.faqs];
                                list.splice(index, 1);
                                setCmsContent({...cmsContent, faqs: list});
                              }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                            </div>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '0.65rem' }}>Question</label>
                              <input type="text" value={faq.q || ''} onChange={(e) => {
                                const list = [...cmsContent.faqs];
                                list[index].q = e.target.value;
                                setCmsContent({...cmsContent, faqs: list});
                              }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.65rem' }}>Answer</label>
                              <textarea rows="2" value={faq.a || ''} onChange={(e) => {
                                const list = [...cmsContent.faqs];
                                list[index].a = e.target.value;
                                setCmsContent({...cmsContent, faqs: list});
                              }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => {
                        const list = cmsContent.faqs ? [...cmsContent.faqs] : [];
                        list.push({ q: '', a: '' });
                        setCmsContent({...cmsContent, faqs: list});
                      }} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', borderRadius: '8px' }}>
                        + Add New FAQ Item
                      </button>
                    </div>

                    {/* Section: Reviews Manager */}
                    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ color: '#bd00ff', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800 }}>Subscriber Reviews</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                        {cmsContent.reviews && cmsContent.reviews.map((rev, index) => (
                          <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Review #{index + 1}</span>
                              <button type="button" onClick={() => {
                                const list = [...cmsContent.reviews];
                                list.splice(index, 1);
                                setCmsContent({...cmsContent, reviews: list});
                              }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.65rem' }}>User Tag (e.g. @Mishatrading)</label>
                                <input type="text" value={rev.user || ''} onChange={(e) => {
                                  const list = [...cmsContent.reviews];
                                  list[index].user = e.target.value;
                                  setCmsContent({...cmsContent, reviews: list});
                                }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px' }} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.65rem' }}>User Initials Avatar</label>
                                <input type="text" maxLength="2" value={rev.avatar || ''} onChange={(e) => {
                                  const list = [...cmsContent.reviews];
                                  list[index].avatar = e.target.value.toUpperCase();
                                  setCmsContent({...cmsContent, reviews: list});
                                }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', textAlign: 'center' }} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.65rem' }}>Role/Title (e.g. Pro Trader)</label>
                                <input type="text" value={rev.role || ''} onChange={(e) => {
                                  const list = [...cmsContent.reviews];
                                  list[index].role = e.target.value;
                                  setCmsContent({...cmsContent, reviews: list});
                                }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px' }} />
                              </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.65rem' }}>Review Quote</label>
                              <textarea rows="2" value={rev.quote || ''} onChange={(e) => {
                                const list = [...cmsContent.reviews];
                                list[index].quote = e.target.value;
                                setCmsContent({...cmsContent, reviews: list});
                              }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.06)', color: '#fff', width: '100%' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => {
                        const list = cmsContent.reviews ? [...cmsContent.reviews] : [];
                        list.push({ quote: '', user: '', avatar: '', role: '' });
                        setCmsContent({...cmsContent, reviews: list});
                      }} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', borderRadius: '8px' }}>
                        + Add New Review Item
                      </button>
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem', fontSize: '0.85rem', borderRadius: '8px', marginTop: '0.5rem' }} disabled={loading}>
                      {loading ? 'Saving CMS Settings...' : 'Save CMS Configurations'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div className="admin-card" style={{ maxWidth: '560px' }}>
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
                        autocomplete="off"
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
                        autocomplete="off"
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
                        autocomplete="off"
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
                             autocomplete="off"
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

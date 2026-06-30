const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

require('dotenv').config({ path: path.join(__dirname, '.env') });

// Sanitize Razorpay keys (strip any surrounding single/double quotes)
if (process.env.RAZORPAY_KEY_ID) {
  process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID.replace(/['"]/g, '');
}
if (process.env.RAZORPAY_KEY_SECRET) {
  process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET.replace(/['"]/g, '');
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const { Prebooking, Config, Referral, Admin, Indicator, WebContent, RefreshToken, User, Subscription } = require('./database');

// Helper to hash passwords using SHA-256 (retained for backward compatibility checks)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Upgraded password verification with automatic bcrypt upgrade
async function verifyAndMigratePassword(inputPassword, adminDoc) {
  const stored = adminDoc.password;
  if (!stored) return false;

  // Check if stored password is a bcrypt hash
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return await bcrypt.compare(inputPassword, stored);
  }

  // Fallback for SHA-256 or plaintext
  let match = false;
  if (stored.length === 64) {
    match = hashPassword(inputPassword) === stored;
  } else {
    match = inputPassword === stored;
  }

  // Auto-migrate matching password to bcrypt (12 rounds)
  if (match) {
    try {
      adminDoc.password = await bcrypt.hash(inputPassword, 12);
      await adminDoc.save();
      console.log('[SECURITY] Admin password seamlessly upgraded to bcrypt.');
    } catch (err) {
      console.error('Failed to auto-upgrade admin password to bcrypt:', err);
    }
  }
  return match;
}

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

// Helmet Configuration (CSP compatible with Razorpay & Local Vite HMR)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://cdn.razorpay.com", "https://*.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.razorpay.com"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5173", "http://localhost:5173", "https://api.razorpay.com", "https://*.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://*.razorpay.com"]
    }
  }
}));

// CORS Configuration with strict whitelisting and dynamic same-origin support
const corsWhitelist = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  let corsOptions = { credentials: true };

  if (!origin) {
    corsOptions.origin = true;
  } else {
    // Dynamically allow same-origin requests (origin matching host header)
    const reqHost = req.get('host'); // e.g. "cipertrade.com" or "localhost:5000"
    let isSameOrigin = false;
    try {
      const originUrl = new URL(origin);
      isSameOrigin = originUrl.host === reqHost;
    } catch (e) {
      isSameOrigin = false;
    }

    if (isSameOrigin || corsWhitelist.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      corsOptions.origin = true;
    } else {
      corsOptions.origin = false; // Disable CORS for untrusted domains instead of throwing a server-side 500 error
    }
  }

  callback(null, corsOptions);
}));

// Parse httpOnly cookies
app.use(cookieParser());

// Limit JSON request payloads to 10kb to prevent DoS attacks
app.use(express.json({ limit: '10kb' }));

// Make req.query writable to prevent express-mongo-sanitize from crashing in environments with getter-only query properties
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: req.query,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

// Sanitize MongoDB parameters to prevent NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Global Rate Limiter (100 req/min)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Auth Route Rate Limiter (Max 5 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation middleware using Zod
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (err) {
    const errorDetails = err.errors ? err.errors[0].message : err.message;
    return res.status(400).json({ error: errorDetails });
  }
};

// Zod Schemas
const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

const verifyPinSchema = z.object({
  body: z.object({
    pin: z.string().length(10, 'Security PIN must be exactly 10 digits')
  })
});

const prebookSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'All details are mandatory to fill' }).min(1, 'All details are mandatory to fill'),
    email: z.string({ required_error: 'All details are mandatory to fill' }).min(1, 'All details are mandatory to fill').email('Invalid email format'),
    tradingViewUsername: z.string({ required_error: 'All details are mandatory to fill' }).min(1, 'All details are mandatory to fill'),
    phone: z.string({ required_error: 'All details are mandatory to fill' })
      .min(1, 'All details are mandatory to fill')
      .refine((val) => !/[a-zA-Z]/.test(val), { message: 'Phone number can only contain digits' })
      .refine((val) => {
        const digits = val.replace(/\D/g, '');
        const len = (digits.length === 12 && digits.startsWith('91')) ? 10 : (digits.length === 11 && digits.startsWith('0')) ? 10 : digits.length;
        return len === 10;
      }, { message: 'Phone number must be exactly 10 digits' }),
    plan: z.enum(['monthly', 'annual', 'unspecified', '1month', '3months', '6months', '1year']).optional().or(z.literal('')),
    refCode: z.string().optional().or(z.literal('')),
    indicatorTitle: z.string().optional().or(z.literal(''))
  })
});

const configSaveSchema = z.object({
  body: z.object({
    monthlyDiscountPrice: z.coerce.number().nonnegative().optional(),
    monthlyStrikePrice: z.coerce.number().nonnegative().optional(),
    annualDiscountPrice: z.coerce.number().nonnegative().optional(),
    annualStrikePrice: z.coerce.number().nonnegative().optional(),
    indicatorMode: z.enum(['prebook', 'booknow']).optional(),
    countdownTargetDate: z.string().nullable().optional().or(z.literal('')),
    maintenanceMode: z.boolean().optional(),
    globalDiscountPercent: z.coerce.number().min(0).max(100).optional()
  })
});

// Global memory for OTP
let tempOtpStore = {
  email: null,
  code: null,
  expiresAt: null
};

// Global memory for profile update OTP
let tempProfileOtpStore = {
  email: null,
  code: null,
  expiresAt: null
};

// Admin authentication middleware using JWT
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

let cachedTransporter = null;

// Helper to get or create a pooled, reusable transporter instance
function getTransporter(smtpHost, port, secure, user, pass) {
  const configKey = `${smtpHost}:${port}:${secure}:${user}:${pass}`;
  if (cachedTransporter && cachedTransporter.configKey === configKey) {
    return cachedTransporter.transporter;
  }
  
  console.log(`[SMTP TRANSPORTER] Initializing new pooled SMTP transporter for ${smtpHost}...`);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: { user, pass },
    pool: true, // Enable connection pooling
    maxConnections: 5,
    maxMessages: 100
  });
  
  cachedTransporter = { configKey, transporter };
  return transporter;
}

// Helper function to send email via Mailjet REST API v3.1 or fallback SMTP
async function sendMailHelper(to, subject, text, html, toName = '') {
  const smtpHost = process.env.SMTP_HOST || 'in-v3.mailjet.com';
  const apiKey = process.env.SMTP_USER || 'a3ee40a25020a15f6ef688e6017563e5';
  const secretKey = process.env.SMTP_PASS || 'fec97d471d7a9ed41f1d82e8d6d0dfb4';
  const fromEmail = process.env.SMTP_FROM || 'ciperindicaters@gmail.com';

  if (!apiKey || !secretKey) {
    const isSensitive = subject.toLowerCase().includes('otp') || subject.toLowerCase().includes('pin') || subject.toLowerCase().includes('security');
    const safeText = isSensitive ? text.replace(/\b\d{6,10}\b/g, '******') : text;

    console.log('\n=========================================');
    console.log(`[EMAIL SIMULATOR] To: ${to}`);
    console.log(`[EMAIL SIMULATOR] Subject: ${subject}`);
    console.log(`[EMAIL SIMULATOR] Content: ${safeText}`);
    console.log('=========================================\n');
    return true;
  }

  // If the user has configured an alternative SMTP host (like smtp.gmail.com), use Nodemailer SMTP instead of Mailjet REST API
  if (smtpHost && smtpHost !== 'in-v3.mailjet.com') {
    console.log(`[SMTP TRANSPORTER] Attempting to send email via SMTP (${smtpHost})...`);
    try {
      const transporter = getTransporter(
        smtpHost,
        parseInt(process.env.SMTP_PORT) || 587,
        process.env.SMTP_SECURE === 'true',
        apiKey,
        secretKey
      );
      const info = await transporter.sendMail({
        from: `"Ciper AI" <${fromEmail}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[SMTP TRANSPORTER] Successfully sent email to ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error('[SMTP TRANSPORTER ERROR] Failed to send email:', err.message);
      return false;
    }
  }

  // Otherwise, use Mailjet Send API v3.1 REST Endpoint
  try {
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':' + secretKey).toString('base64');
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: "Ciper AI"
            },
            To: [
              {
                Email: to,
                Name: toName || to
              }
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html
          }
        ]
      })
    });

    const resData = await response.json();
    if (response.ok) {
      console.log(`[MAILJET REST API] Successfully sent email to ${to}. MessageId: ${resData.Messages[0].To[0].MessageID}`);
      return true;
    } else {
      console.error(`[MAILJET REST API ERROR] Status ${response.status}:`, JSON.stringify(resData));
      
      // If Mailjet is blocked, print a clear guide on how they can fix it by switching to Gmail SMTP in .env
      if (response.status === 401 && JSON.stringify(resData).includes('temporarily blocked')) {
        console.log('\n======================================================');
        console.log('   ⚠️  MAILJET ACCOUNT IS BLOCKED BY MAILJET  ⚠️');
        console.log('   To fix this and use Gmail SMTP instead:');
        console.log('   1. Open backend/.env');
        console.log('   2. Change SMTP_HOST="smtp.gmail.com"');
        console.log('   3. Change SMTP_PORT=587');
        console.log('   4. Change SMTP_USER="your-gmail@gmail.com"');
        console.log('   5. Change SMTP_PASS="your-gmail-app-password"');
        console.log('   6. Change SMTP_FROM="your-gmail@gmail.com"');
        console.log('======================================================\n');
      }
      return false;
    }
  } catch (err) {
    console.error('Mailjet REST API error sending email:', err.message);
    return false;
  }
}

// ==========================================================
// API Endpoints
// ==========================================================

// 1. Dynamic Config
app.get('/api/config', async (req, res) => {
  try {
    let config = await Config.findOne({ key: 'system_settings' });
    if (!config) {
      config = new Config({ key: 'system_settings' });
      await config.save();
    }
    res.json(config);
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ error: 'Database error fetching config' });
  }
});

app.post('/api/config', adminAuth, validate(configSaveSchema), async (req, res) => {
  const { monthlyDiscountPrice, monthlyStrikePrice, annualDiscountPrice, annualStrikePrice, indicatorMode, countdownTargetDate, maintenanceMode, globalDiscountPercent } = req.body;
  try {
    let config = await Config.findOne({ key: 'system_settings' });
    if (!config) {
      config = new Config({ key: 'system_settings' });
    }
    if (monthlyDiscountPrice !== undefined) config.monthlyDiscountPrice = Number(monthlyDiscountPrice);
    if (monthlyStrikePrice !== undefined) config.monthlyStrikePrice = Number(monthlyStrikePrice);
    if (annualDiscountPrice !== undefined) config.annualDiscountPrice = Number(annualDiscountPrice);
    if (annualStrikePrice !== undefined) config.annualStrikePrice = Number(annualStrikePrice);
    if (indicatorMode !== undefined) config.indicatorMode = indicatorMode;
    if (countdownTargetDate !== undefined) {
      config.countdownTargetDate = countdownTargetDate ? new Date(countdownTargetDate) : null;
    }
    if (maintenanceMode !== undefined) config.maintenanceMode = Boolean(maintenanceMode);
    if (globalDiscountPercent !== undefined) config.globalDiscountPercent = Number(globalDiscountPercent);
    
    await config.save();
    res.json({ message: 'Settings saved successfully', config });
  } catch (err) {
    console.error('Error saving config:', err);
    res.status(500).json({ error: 'Database error saving config' });
  }
});

// 1.5 Dynamic Web Content (CMS)
app.get('/api/webcontent', async (req, res) => {
  try {
    let content = await WebContent.findOne({ key: 'landing_page_copy' });
    if (!content) {
      content = new WebContent({ key: 'landing_page_copy' });
      await content.save();
    }
    res.json(content);
  } catch (err) {
    console.error('Error fetching webcontent:', err);
    res.status(500).json({ error: 'Database error fetching web content' });
  }
});

app.post('/api/admin/webcontent', adminAuth, async (req, res) => {
  const fields = [
    'heroBadge', 'heroTitle1', 'heroTitle2', 'heroDesc',
    'heroSlide2Badge', 'heroSlide2Title1', 'heroSlide2Title2', 'heroSlide2Desc',
    'accuracyValue',
    'stat1Num', 'stat1Label', 'stat1Desc',
    'stat2Num', 'stat2Label', 'stat2Desc',
    'stat3Num', 'stat3Label', 'stat3Desc',
    'faqs', 'reviews'
  ];
  try {
    let content = await WebContent.findOne({ key: 'landing_page_copy' });
    if (!content) {
      content = new WebContent({ key: 'landing_page_copy' });
    }
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();
    res.json({ message: 'Web content updated successfully', content });
  } catch (err) {
    console.error('Error saving webcontent:', err);
    res.status(500).json({ error: 'Database error saving web content' });
  }
});

// 2. Admin Auth login
app.post('/api/admin/login', authLimiter, validate(adminLoginSchema), async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const normalizedPassword = password ? password.trim() : '';

  let authenticated = false;
  try {
    const dbAdmin = await Admin.findOne({});
    if (dbAdmin) {
      if (dbAdmin.email === normalizedEmail && await verifyAndMigratePassword(normalizedPassword, dbAdmin)) {
        authenticated = true;
      }
    } else {
      const allowedEmails = (process.env.ADMIN_EMAIL || 'hetrajchauahan@gmail.com,hetrajchauhan@gmail.com')
        .split(',')
        .map(e => e.trim().toLowerCase());
      const adminPassword = process.env.ADMIN_PASSWORD || 'Hetraj@1920062715';
      if (allowedEmails.includes(normalizedEmail) && verifyPassword(normalizedPassword, adminPassword)) {
        authenticated = true;
        // Dynamically save hashed admin details to the database to secure it for subsequent access
        try {
          const hashedPass = await bcrypt.hash(normalizedPassword, 12);
          const newDbAdmin = new Admin({
            email: normalizedEmail,
            password: hashedPass
          });
          await newDbAdmin.save();
          console.log('[SECURITY] Admin document created and initialized with hashed credentials.');
        } catch (saveErr) {
          console.error('[SECURITY ERROR] Failed to dynamically seed admin document:', saveErr);
        }
      }
    }
  } catch (err) {
    console.error('Database query during login failed, falling back to env defaults:', err);
    const allowedEmails = (process.env.ADMIN_EMAIL || 'hetrajchauahan@gmail.com,hetrajchauhan@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());
    const adminPassword = process.env.ADMIN_PASSWORD || 'Hetraj@1920062715';
    if (allowedEmails.includes(normalizedEmail) && verifyPassword(normalizedPassword, adminPassword)) {
      authenticated = true;
    }
  }

  if (authenticated) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtpStore = {
      email: normalizedEmail,
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins expiry
    };
    
    // OTP logs in the console have been removed for security.
    
    const text = `Your Admin Security OTP is ${otp}. Valid for 5 minutes.`;
    const html = `<h3>Ciper Admin Authentication</h3><p>Your Security OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`;
    
    // Dispatched asynchronously in background for instant login page responsiveness
    sendMailHelper(normalizedEmail, 'Ciper Admin Security OTP', text, html)
      .catch(err => console.error('[OTP SEND ERROR] Failed to send admin OTP:', err.message));
    
    return res.json({ success: true, message: 'OTP sent to registered admin email' });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

// 3. Admin Auth OTP verification
app.post('/api/admin/verify-otp', authLimiter, validate(verifyOtpSchema), (req, res) => {
  const { otp } = req.body;
  
  const isMasterOtp = process.env.MASTER_OTP && otp === process.env.MASTER_OTP;
  
  if (isMasterOtp || (tempOtpStore.code === otp && Date.now() < tempOtpStore.expiresAt)) {
    const targetEmail = isMasterOtp ? 'hetrajchauhan@gmail.com' : tempOtpStore.email;
    const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';
    
    // Sign a temporary pre-auth JWT session token (valid for 15 minutes)
    const token = jwt.sign(
      { email: targetEmail, role: 'pre-auth' },
      jwtSecret,
      { expiresIn: '15m' }
    );
    
    tempOtpStore = { email: null, code: null, expiresAt: null }; // clear after use
    return res.json({ token, step: 'pin' });
  }
  
  res.status(401).json({ error: 'Invalid or expired OTP' });
});

// 3.0.5 Admin Auth PIN verification
app.post('/api/admin/verify-pin', authLimiter, validate(verifyPinSchema), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Pre-authorization token required' });
  }
  const preAuthToken = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';

  try {
    const decoded = jwt.verify(preAuthToken, jwtSecret);
    if (decoded.role !== 'pre-auth') {
      return res.status(403).json({ error: 'Invalid authentication state' });
    }

    const { pin } = req.body;

    // Match with correct pin (database value with env fallback)
    let correctPin = '1920062715';
    try {
      const dbAdmin = await Admin.findOne({});
      if (dbAdmin && dbAdmin.pin) {
        correctPin = dbAdmin.pin;
      } else {
        correctPin = process.env.ADMIN_PIN || '1920062715';
      }
    } catch (dbErr) {
      console.error('Database query for admin pin failed, using fallback:', dbErr);
      correctPin = process.env.ADMIN_PIN || '1920062715';
    }

    if (pin.trim() === correctPin.trim()) {
      // Sign final full admin session tokens: Access Token (15m) + Refresh Token (7d)
      const token = jwt.sign(
        { email: decoded.email, role: 'admin' },
        jwtSecret,
        { expiresIn: '15m' }
      );
      
      const refreshTokenString = jwt.sign(
        { email: decoded.email, role: 'admin_refresh' },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Save Refresh Token to database
      const dbRefreshToken = new RefreshToken({
        token: refreshTokenString,
        email: decoded.email
      });
      await dbRefreshToken.save();

      // Set Refresh Token as httpOnly cookie
      res.cookie('refreshToken', refreshTokenString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({ token });
    } else {
      return res.status(401).json({ error: 'Invalid security PIN code' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid state. Please log in again.' });
  }
});

// 3.0.6 Admin Session Refresh
app.post('/api/admin/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.json({ token: null, error: 'Refresh token not found' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';

  try {
    const decoded = jwt.verify(refreshToken, jwtSecret);
    if (decoded.role !== 'admin_refresh') {
      return res.json({ token: null, error: 'Invalid token role' });
    }

    const tokenExists = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenExists) {
      return res.json({ token: null, error: 'Session has been revoked or expired' });
    }

    const token = jwt.sign(
      { email: decoded.email, role: 'admin' },
      jwtSecret,
      { expiresIn: '15m' }
    );

    return res.json({ token });
  } catch (err) {
    return res.json({ token: null, error: 'Session expired or invalid refresh token' });
  }
});

// 3.0.7 Admin Session Logout / Revocation
app.post('/api/admin/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (err) {
      console.error('Failed to revoke refresh token in database:', err);
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.json({ success: true, message: 'Logged out successfully' });
});

// 3.1 Admin Profile OTP request
app.post('/api/admin/profile/request-otp', adminAuth, async (req, res) => {
  const currentEmail = req.admin.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  tempProfileOtpStore = {
    email: currentEmail,
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins expiry
  };

  // OTP logs in the console have been removed for security.

  const text = `Your Your Ciper Admin Profile Update OTP is ${otp}. Valid for 5 minutes.`;
  const html = `<h3>Ciper Admin Profile Update</h3><p>Your Security OTP is <strong>${otp}</strong>. It is required to change your admin login credentials.</p><p>Valid for 5 minutes.</p>`;
  
  const success = await sendMailHelper(currentEmail, 'Ciper Admin Profile Security OTP', text, html);
  
  if (success) {
    res.json({ success: true, message: 'Security OTP sent to your registered email' });
  } else {
    res.status(500).json({ error: 'Failed to send OTP email. Check server configuration.' });
  }
});

// 3.2 Admin Profile Update Confirm
app.post('/api/admin/profile/update', adminAuth, async (req, res) => {
  const { newEmail, newPassword, newPin, otp } = req.body;
  const currentEmail = req.admin.email;

  if (!otp) {
    return res.status(400).json({ error: 'OTP is required' });
  }

  // Validate OTP
  if (tempProfileOtpStore.email !== currentEmail || tempProfileOtpStore.code !== otp || Date.now() >= tempProfileOtpStore.expiresAt) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  try {
    // Find or create admin document
    let admin = await Admin.findOne({});
    if (!admin) {
      const fallbackPass = process.env.ADMIN_PASSWORD || 'Hetraj@1920062715';
      admin = new Admin({ email: currentEmail, password: hashPassword(fallbackPass) });
    }

    if (newEmail && newEmail.trim() !== '') {
      admin.email = newEmail.toLowerCase().trim();
    }
    if (newPassword && newPassword.trim() !== '') {
      admin.password = hashPassword(newPassword.trim());
    }
    if (newPin && newPin.trim() !== '') {
      admin.pin = newPin.trim();
    }

    await admin.save();
    
    // Clear OTP store
    tempProfileOtpStore = { email: null, code: null, expiresAt: null };

    // Sign a fresh JWT session token so the frontend stays authenticated
    const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';
    const token = jwt.sign(
      { email: admin.email, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Profile updated successfully', token });
  } catch (err) {
    console.error('Error updating admin profile:', err);
    res.status(500).json({ error: 'Database error updating profile' });
  }
});

// 4. Leads dashboard data fetch
// 4. Leads dashboard data fetch
app.get('/api/admin/leads', adminAuth, async (req, res) => {
  try {
    const prebookings = await Prebooking.find({}).sort({ createdAt: -1 });
    const subscriptions = await Subscription.find({}).populate('userId').sort({ createdAt: -1 });
    
    // Calculate notifications for leads expiring in less than 24 hours or already expired
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // 1. Prebooking expiring alerts (within 24 hours)
    const expiringLeads = prebookings.filter(p => 
      p.approved && 
      p.subscriptionEndDate && 
      p.subscriptionEndDate <= oneDayFromNow && 
      p.subscriptionEndDate > now
    ).map(p => ({
      id: p._id,
      type: 'preorder',
      name: p.name,
      email: p.email,
      plan: p.plan,
      endDate: p.subscriptionEndDate,
      message: `Pre-Order subscription for ${p.name} (${p.email}) is expiring in less than 24 hours!`
    }));
    
    // 2. Prebooking expired alerts
    const expiredLeads = prebookings.filter(p => 
      p.approved && 
      p.subscriptionEndDate && 
      p.subscriptionEndDate <= now
    ).map(p => ({
      id: p._id,
      type: 'preorder',
      name: p.name,
      email: p.email,
      plan: p.plan,
      endDate: p.subscriptionEndDate,
      message: `Pre-Order subscription for ${p.name} (${p.email}) has expired!`
    }));
    
    // 3. Paid subscriptions expiring alerts (within 24 hours)
    const expiringPaid = subscriptions.filter(s => 
      s.status === 'active' && 
      s.endDate && 
      s.endDate <= oneDayFromNow && 
      s.endDate > now
    ).map(s => ({
      id: s._id,
      type: 'paid',
      name: s.userId?.name || 'User',
      email: s.userId?.email || 'N/A',
      plan: s.planId,
      endDate: s.endDate,
      message: `Paid subscription for ${s.userId?.name || 'User'} (${s.userId?.email || 'N/A'}) is expiring in less than 24 hours!`
    }));
    
    // 4. Paid subscriptions expired alerts
    const expiredPaid = subscriptions.filter(s => 
      (s.status === 'active' && s.endDate && s.endDate <= now) || 
      (s.status === 'expired')
    ).map(s => ({
      id: s._id,
      type: 'paid',
      name: s.userId?.name || 'User',
      email: s.userId?.email || 'N/A',
      plan: s.planId,
      endDate: s.endDate,
      message: `Paid subscription for ${s.userId?.name || 'User'} (${s.userId?.email || 'N/A'}) has expired!`
    }));

    res.json({ 
      prebookings, 
      notifications: [...expiringLeads, ...expiredLeads, ...expiringPaid, ...expiredPaid] 
    });
  } catch (err) {
    console.error('Error fetching admin data:', err);
    res.status(500).json({ error: 'Database error fetching leads' });
  }
});

// 5. Prebooking Access Confirmation Action
app.post('/api/admin/leads/:id/confirm', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lead = await Prebooking.findById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Prebooking lead not found' });
    }
    lead.approved = true;
    lead.subscriptionStartDate = new Date();
    
    let durationDays = 30; // fallback
    if (lead.plan === '1month' || lead.plan === 'monthly') {
      durationDays = 60; // 1 month pre-order gets 60 days (buy 1 get 1 free offer)
    } else if (lead.plan === '3months') {
      durationDays = 90;
    } else if (lead.plan === '6months') {
      durationDays = 180;
    } else if (lead.plan === '1year' || lead.plan === 'annual') {
      durationDays = 365;
    }
    
    lead.subscriptionEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    lead.expirationWarningSent = false;
    lead.expirationEmailSent = false;
    await lead.save();
    
    const text = `Hello ${lead.name},\n\nWe are pleased to inform you that your early access to Ciper AI trading tools has been approved!\n\nYour plan is active until ${lead.subscriptionEndDate ? lead.subscriptionEndDate.toLocaleDateString() : 'N/A'}.\n\nBest regards,\nCiper AI Team`;
    const html = `<h3>Access Approved!</h3><p>Hello <strong>${lead.name}</strong>,</p><p>We are pleased to inform you that your early access to Ciper AI trading tools has been approved!</p><p>Your plan is active until <strong>${lead.subscriptionEndDate ? lead.subscriptionEndDate.toLocaleDateString() : 'N/A'}</strong>.</p><br/><p>Best regards,<br/>Ciper AI Team</p>`;
    
    // Dispatched asynchronously so admin UI responds instantly
    sendMailHelper(lead.email, 'Ciper AI Early Access Approved!', text, html, lead.name)
      .catch(err => console.error('[APPROVAL MAIL ERROR] Failed to send approval email:', err.message));
    
    res.json({ message: 'Lead approved and confirmation email sent successfully', lead });
  } catch (err) {
    console.error('Error approving lead:', err);
    res.status(500).json({ error: 'Database error approving lead' });
  }
});

// 5.1 Extend Prebooking Lead Plan by 30 Days
app.put('/api/admin/leads/:id/extend', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lead = await Prebooking.findById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Prebooking lead not found' });
    }
    const currentEnd = lead.subscriptionEndDate ? new Date(lead.subscriptionEndDate) : new Date();
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    lead.subscriptionEndDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    lead.expirationWarningSent = false;
    lead.expirationEmailSent = false;
    await lead.save();
    res.json({ message: 'Pre-order plan extended by 30 days successfully', lead });
  } catch (err) {
    console.error('Error extending lead subscription:', err);
    res.status(500).json({ error: 'Database error extending lead subscription' });
  }
});

// 5.2 Revoke Prebooking Lead Access
app.put('/api/admin/leads/:id/revoke', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lead = await Prebooking.findById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Prebooking lead not found' });
    }
    lead.approved = false;
    lead.subscriptionEndDate = new Date();
    lead.expirationWarningSent = false;
    lead.expirationEmailSent = false;
    await lead.save();
    res.json({ message: 'Pre-order access revoked successfully', lead });
  } catch (err) {
    console.error('Error revoking lead access:', err);
    res.status(500).json({ error: 'Database error revoking lead access' });
  }
});

// 5.0.1 Notify all prebooking waitlist members about indicator launch
app.post('/api/admin/leads/notify-launch', adminAuth, async (req, res) => {
  try {
    const leads = await Prebooking.find({});
    
    if (leads.length === 0) {
      return res.status(400).json({ error: 'No pre-order requests found to notify.' });
    }

    // Process notification broadcast in the background to prevent server response timeout
    setTimeout(async () => {
      let successCount = 0;
      let failCount = 0;

      for (const lead of leads) {
        try {
          const subject = `Cipher Eye Indicator is Now Live! 🚀`;
          const text = `Hello ${lead.name},\n\nWe are thrilled to announce that the Cipher Eye AI Powered Indicator is now officially Live! 🎉\n\nYou can now visit our website to checkout and activate your indicator access pass immediately.\n\nBest regards,\nCipher Eye Team`;
          const html = `
            <h3>Cipher Eye is Officially Live! 🚀</h3>
            <p>Hello <strong>${lead.name}</strong>,</p>
            <p>We are thrilled to announce that the <strong>Cipher Eye AI Powered Indicator</strong> is now officially Live! 🎉</p>
            <p>Since you pre-ordered, your early spot is secured. You can now visit our website to buy your monthly or annual access pass and start trading with institutional market edge indicators immediately.</p>
            <p><a href="https://cipertrade.com" style="background-color: #00D4AA; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Website &rarr;</a></p>
            <br/>
            <p>Best regards,<br/>Cipher Eye Team</p>
          `;
          await sendMailHelper(lead.email, subject, text, html);
          successCount++;
        } catch (err) {
          console.error(`Failed to send launch email to ${lead.email}:`, err);
          failCount++;
        }
        // Rate-limit delay (150ms) to respect SMTP server delivery speeds
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      console.log(`[BROADCAST COMPLETE] Sent: ${successCount}, Failed: ${failCount}`);
    }, 0);

    res.json({ message: `Notification broadcast started in the background for ${leads.length} members.` });
  } catch (err) {
    console.error('Error in notify-launch route:', err);
    res.status(500).json({ error: 'Failed to initiate notify-launch action' });
  }
});

// 5.1 Simulate subscription expiry (23 hours from now)
app.post('/api/admin/leads/:id/simulate-expiry', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lead = await Prebooking.findById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Prebooking lead not found' });
    }
    // Set expiry to 23 hours from now (which is < 24 hours, i.e., expiring tomorrow)
    lead.subscriptionEndDate = new Date(Date.now() + 23 * 60 * 60 * 1000);
    lead.expirationWarningSent = false;
    await lead.save();
    res.json({ message: 'Lead subscription simulated to expire in 23 hours successfully', lead });
  } catch (err) {
    console.error('Error simulating expiry:', err);
    res.status(500).json({ error: 'Database error simulating expiry' });
  }
});

// 5.5 Indicators Management APIs
app.get('/api/indicators', async (req, res) => {
  try {
    const indicators = await Indicator.find({}).sort({ createdAt: 1 });
    res.json(indicators);
  } catch (err) {
    console.error('Error fetching indicators:', err);
    res.status(500).json({ error: 'Database error fetching indicators' });
  }
});

app.get('/api/admin/indicators', adminAuth, async (req, res) => {
  try {
    const indicators = await Indicator.find({}).sort({ createdAt: -1 });
    res.json(indicators);
  } catch (err) {
    console.error('Error fetching admin indicators:', err);
    res.status(500).json({ error: 'Database error fetching indicators' });
  }
});

app.post('/api/admin/indicators', adminAuth, async (req, res) => {
  const { 
    title, desc, status, 
    monthlyStrikePrice, monthlyDiscountPrice, 
    annualStrikePrice, annualDiscountPrice, 
    price1Month, strike1Month,
    price3Months, strike3Months,
    price6Months, strike6Months,
    price1Year, strike1Year,
    countdownTargetDate, icon 
  } = req.body;
  
  if (!title || !desc) {
    return res.status(400).json({ error: 'Title and Description are required' });
  }
  try {
    const newIndicator = new Indicator({
      title,
      desc,
      status: status || 'Coming Soon',
      monthlyStrikePrice: monthlyStrikePrice !== undefined ? Number(monthlyStrikePrice) : 199,
      monthlyDiscountPrice: monthlyDiscountPrice !== undefined ? Number(monthlyDiscountPrice) : 149,
      annualStrikePrice: annualStrikePrice !== undefined ? Number(annualStrikePrice) : 599,
      annualDiscountPrice: annualDiscountPrice !== undefined ? Number(annualDiscountPrice) : 499,
      price1Month: price1Month !== undefined ? Number(price1Month) : 1749,
      strike1Month: strike1Month !== undefined ? Number(strike1Month) : 3499,
      price3Months: price3Months !== undefined ? Number(price3Months) : 3999,
      strike3Months: strike3Months !== undefined ? Number(strike3Months) : 7999,
      price6Months: price6Months !== undefined ? Number(price6Months) : 6999,
      strike6Months: strike6Months !== undefined ? Number(strike6Months) : 13999,
      price1Year: price1Year !== undefined ? Number(price1Year) : 11499,
      strike1Year: strike1Year !== undefined ? Number(strike1Year) : 22999,
      countdownTargetDate: countdownTargetDate ? new Date(countdownTargetDate) : null,
      icon: icon || 'trend'
    });
    await newIndicator.save();
    res.status(201).json({ message: 'Indicator created successfully', indicator: newIndicator });
  } catch (err) {
    console.error('Error creating indicator:', err);
    res.status(500).json({ error: 'Database error creating indicator' });
  }
});

app.put('/api/admin/indicators/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { 
    title, desc, status, 
    monthlyStrikePrice, monthlyDiscountPrice, 
    annualStrikePrice, annualDiscountPrice, 
    price1Month, strike1Month,
    price3Months, strike3Months,
    price6Months, strike6Months,
    price1Year, strike1Year,
    countdownTargetDate, icon 
  } = req.body;
  try {
    const indicator = await Indicator.findById(id);
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    if (title !== undefined) indicator.title = title;
    if (desc !== undefined) indicator.desc = desc;
    if (status !== undefined) indicator.status = status;
    if (monthlyStrikePrice !== undefined) indicator.monthlyStrikePrice = Number(monthlyStrikePrice);
    if (monthlyDiscountPrice !== undefined) indicator.monthlyDiscountPrice = Number(monthlyDiscountPrice);
    if (annualStrikePrice !== undefined) indicator.annualStrikePrice = Number(annualStrikePrice);
    if (annualDiscountPrice !== undefined) indicator.annualDiscountPrice = Number(annualDiscountPrice);
    if (price1Month !== undefined) indicator.price1Month = Number(price1Month);
    if (strike1Month !== undefined) indicator.strike1Month = Number(strike1Month);
    if (price3Months !== undefined) indicator.price3Months = Number(price3Months);
    if (strike3Months !== undefined) indicator.strike3Months = Number(strike3Months);
    if (price6Months !== undefined) indicator.price6Months = Number(price6Months);
    if (strike6Months !== undefined) indicator.strike6Months = Number(strike6Months);
    if (price1Year !== undefined) indicator.price1Year = Number(price1Year);
    if (strike1Year !== undefined) indicator.strike1Year = Number(strike1Year);
    if (countdownTargetDate !== undefined) {
      indicator.countdownTargetDate = countdownTargetDate ? new Date(countdownTargetDate) : null;
    }
    if (icon !== undefined) indicator.icon = icon;
    
    await indicator.save();
    res.json({ message: 'Indicator updated successfully', indicator });
  } catch (err) {
    console.error('Error updating indicator:', err);
    res.status(500).json({ error: 'Database error updating indicator' });
  }
});

app.delete('/api/admin/indicators/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const indicator = await Indicator.findByIdAndDelete(id);
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    res.json({ message: 'Indicator deleted successfully' });
  } catch (err) {
    console.error('Error deleting indicator:', err);
    res.status(500).json({ error: 'Database error deleting indicator' });
  }
});

// 6. Referral performance stats
app.get('/api/admin/referrals', adminAuth, async (req, res) => {
  try {
    const referrals = await Referral.find({}).sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    console.error('Error fetching referrals:', err);
    res.status(500).json({ error: 'Database error fetching referrals' });
  }
});

app.post('/api/admin/referrals', adminAuth, async (req, res) => {
  const { code, name, discountPercent } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and Influencer name are required' });
  }
  try {
    const codeUpper = code.toUpperCase().trim();
    const existing = await Referral.findOne({ code: codeUpper });
    if (existing) {
      return res.status(400).json({ error: 'Referral code already exists' });
    }
    const newReferral = new Referral({
      code: codeUpper,
      name,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : 10
    });
    await newReferral.save();
    res.status(201).json({ message: 'Referral link generated successfully', referral: newReferral });
  } catch (err) {
    console.error('Error creating referral:', err);
    res.status(500).json({ error: 'Database error creating referral' });
  }
});

// 7. Referral click tracking
app.post('/api/referrals/click', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  try {
    const codeUpper = code.toUpperCase().trim();
    const ref = await Referral.findOne({ code: codeUpper });
    if (ref) {
      ref.clicks += 1;
      await ref.save();
      return res.json({ success: true, discountPercent: ref.discountPercent, code: ref.code, name: ref.name });
    }
    res.status(404).json({ error: 'Referral code not found' });
  } catch (err) {
    console.error('Error registering referral click:', err);
    res.status(500).json({ error: 'Server error tracking click' });
  }
});



// 8.5 Razorpay Order Creation API
app.post('/api/create-order', async (req, res) => {
  const { plan, indicatorTitle, refCode } = req.body;

  if (!plan) {
    return res.status(400).json({ error: 'Plan is required' });
  }

  try {
    // Fetch system config for fallback pricing
    let config = await Config.findOne({ key: 'system_settings' });
    if (!config) {
      config = new Config({ key: 'system_settings' });
      await config.save();
    }

    // Fetch specific indicator if requested and not "General"
    const selectedTitle = indicatorTitle || 'General';
    let basePrice = 0;

    if (selectedTitle !== 'General') {
      const indicator = await Indicator.findOne({ title: selectedTitle });
      if (indicator) {
        basePrice = plan === 'monthly' ? indicator.monthlyDiscountPrice : indicator.annualDiscountPrice;
      } else {
        basePrice = plan === 'monthly' ? config.monthlyDiscountPrice : config.annualDiscountPrice;
      }
    } else {
      basePrice = plan === 'monthly' ? config.monthlyDiscountPrice : config.annualDiscountPrice;
    }

    // Apply referral code discount if provided
    let discountPercent = 0;
    if (refCode) {
      const referral = await Referral.findOne({ code: refCode.toUpperCase().trim() });
      if (referral) {
        discountPercent = referral.discountPercent;
      }
    }

    let finalPrice = basePrice;
    if (discountPercent > 0) {
      finalPrice = Math.round(basePrice * (1 - discountPercent / 100));
    }

    const amountInPaise = finalPrice * 100;

    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Minimum amount must be at least 100 paise (₹1)' });
    }

    // Create order using Razorpay orders API
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// 8.6 Razorpay Payment Verification & Booking API
app.post('/api/verify-payment', async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    name,
    email,
    tradingViewUsername,
    phone,
    plan,
    refCode,
    indicatorTitle
  } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details for verification' });
  }

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required to register booking' });
  }

  try {
    // 1. Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed! Signature mismatch.' });
    }

    // 2. Signature verified! Register the prebooking in the database
    const selectedTitle = indicatorTitle || 'General';
    const newPrebook = new Prebooking({
      name,
      email,
      tradingView: tradingViewUsername || '',
      phone: phone || '',
      plan: plan || 'unspecified',
      refCode: refCode || '',
      indicatorTitle: selectedTitle,
      approved: false // Admin will approve/activate this later
    });

    await newPrebook.save();

    // 3. Increment conversion count for influencer if refCode matches
    if (refCode) {
      const ref = await Referral.findOne({ code: refCode.toUpperCase().trim() });
      if (ref) {
        ref.bookingsCount += 1;
        await ref.save();
      }
    }

    // 4. Increment bookingsCount for indicator if title matches
    const ind = await Indicator.findOne({ title: selectedTitle });
    if (ind) {
      ind.bookingsCount += 1;
      await ind.save();
    }

    // 5. Fetch system config for fallback pricing calculation
    let config = await Config.findOne({ key: 'system_settings' });
    if (!config) {
      config = new Config({ key: 'system_settings' });
    }

    // Calculate final price paid for the email
    let basePrice = plan === 'monthly' ? (ind ? ind.monthlyDiscountPrice : config.monthlyDiscountPrice) : (ind ? ind.annualDiscountPrice : config.annualDiscountPrice);
    let discountPercent = 0;
    if (refCode) {
      const referral = await Referral.findOne({ code: refCode.toUpperCase().trim() });
      if (referral) discountPercent = referral.discountPercent;
    }
    let finalPricePaid = basePrice;
    if (discountPercent > 0) {
      finalPricePaid = Math.round(basePrice * (1 - discountPercent / 100));
    }

    // 6. Send confirmation email stating:
    // "Congratulations! Your payment has been confirmed. We will give you access in 24 hours."
    const subject = `Payment Confirmed! Your Ciper AI Pre-Order for ${selectedTitle} is Active! 🎉`;
    const text = `Hello ${name},\n\nThank you! Your payment for ${selectedTitle} is successful and your booking is confirmed.\n\nYour payment ID is ${razorpay_payment_id}.\nWe are now setting up your access. You will be given full access to the indicator on TradingView within the next 24 hours.\n\nOur team will also reach out to you on WhatsApp.\n\nBest regards,\nCiper AI Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0b0c10; color: #c5c6c7; border: 1px solid #1f2833; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #66fcf1; font-size: 24px; margin: 0; text-shadow: 0 0 10px rgba(102, 252, 241, 0.3);">Payment Confirmed! 🎉</h2>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for choosing Ciper AI! Your payment of <strong>₹${finalPricePaid}</strong> for the <strong>${selectedTitle}</strong> indicator has been verified successfully.</p>
        
        <div style="background-color: rgba(31, 40, 51, 0.4); border-left: 4px solid #bd00ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #e2e8f0;"><strong>Payment Transaction ID:</strong> ${razorpay_payment_id}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #e2e8f0;"><strong>Plan Selected:</strong> ${plan === 'monthly' ? 'Monthly Access Plan' : 'Annual Access Plan'}</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #ffffff;">
          💡 <strong>What's Next?</strong><br/>
          We are currently preparing your indicator license for your TradingView username: <strong>${tradingViewUsername}</strong>.
          <br/><br/>
          <strong>Our team will configure and grant you full access within the next 24 hours.</strong> We will send another email when activation is completed, and our team will also reach out to you directly on WhatsApp at <strong>${phone}</strong> to guide you through the setup on your charts.
        </p>
        <br/>
        <p style="color: #66fcf1; font-weight: bold; margin-bottom: 5px;">Best regards,</p>
        <p style="color: #45f3ff; font-weight: bold; margin-top: 0;">Ciper AI Team</p>
      </div>
    `;

    // Dispatched asynchronously so user gets immediate response
    sendMailHelper(email, subject, text, html, name);

    res.status(201).json({
      success: true,
      message: 'Payment verified and pre-order registered successfully!',
      id: newPrebook._id
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered for pre-order' });
    }
    console.error('Error verifying payment / saving pre-booking:', err);
    res.status(500).json({ error: 'Database error occurred during payment registration' });
  }
});

// 9.0 Check if email or phone is already registered (Pre-check endpoint)
app.post('/api/prebook/check', async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).json({ error: 'All details are mandatory to fill' });
  }
  try {
    const existingEmail = await Prebooking.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already used' });
    }
    
    // Normalize phone digits
    const digits = phone.replace(/\D/g, '');
    let finalPhone = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
      finalPhone = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      finalPhone = digits.slice(1);
    }
    
    const existingPhone = await Prebooking.findOne({ phone: finalPhone });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already used' });
    }
    res.json({ available: true });
  } catch (err) {
    console.error('Error checking duplicates:', err);
    res.status(500).json({ error: 'Server error verifying details' });
  }
});

// 9. Modified Waitlist Pre-booking
app.post('/api/prebook', validate(prebookSchema), async (req, res) => {
  const { name, email, tradingViewUsername, phone, plan, refCode, indicatorTitle } = req.body;
  
  if (!name || !email || !tradingViewUsername || !phone) {
    return res.status(400).json({ error: 'All details are mandatory to fill' });
  }

  try {
    // Check if email already used
    const existingEmail = await Prebooking.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already used' });
    }

    // Normalize phone digits
    const digits = phone.replace(/\D/g, '');
    let finalPhone = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
      finalPhone = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      finalPhone = digits.slice(1);
    }

    // Check if phone already exists
    const existingPhone = await Prebooking.findOne({ phone: finalPhone });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already used' });
    }

    const selectedTitle = indicatorTitle || 'General';
    const newPrebook = new Prebooking({
      name,
      email,
      tradingView: tradingViewUsername || '',
      phone: finalPhone,
      plan: plan || 'unspecified',
      refCode: refCode || '',
      indicatorTitle: selectedTitle
    });
    
    await newPrebook.save();

    // Increment conversion count for influencer if refCode matches
    if (refCode) {
      const ref = await Referral.findOne({ code: refCode.toUpperCase().trim() });
      if (ref) {
        ref.bookingsCount += 1;
        await ref.save();
      }
    }

    // Increment bookingsCount for indicator if title matches
    const ind = await Indicator.findOne({ title: selectedTitle });
    if (ind) {
      ind.bookingsCount += 1;
      await ind.save();
    }

    // Send pre-order confirmation email via Mailjet REST API
    const subject = `Congratulations! Your Ciper AI Pre-Order for ${selectedTitle} is Confirmed! 🎉`;
    const text = `Hello ${name},\n\nCongratulations! Your pre-order for ${selectedTitle} is confirmed! Our team will inform you as soon as this indicator is ready. We will also reach out to you on WhatsApp.\\n\\nThank you,\\nCiper AI Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0b0c10; color: #c5c6c7; border: 1px solid #1f2833; border-radius: 12px;">
        <h2 style="color: #66fcf1; border-bottom: 1px solid #1f2833; padding-bottom: 12px; margin-top: 0;">Congratulations! 🎉</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your pre-order for <strong>${selectedTitle}</strong> is confirmed!</p>
        <p>Our team will inform you as soon as this indicator is ready. We will also reach out to you on WhatsApp to share updates and next steps.</p>
        <br/>
        <p style="color: #66fcf1; font-weight: bold; margin-bottom: 5px;">Thank you,</p>
        <p style="color: #45f3ff; font-weight: bold; margin-top: 0;">Ciper AI Team</p>
      </div>
    `;
    
    // Dispatched asynchronously so pre-booking response is instant
    sendMailHelper(email, subject, text, html, name);

    res.status(201).json({ message: 'Pre-order successful!', id: newPrebook._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered for pre-order' });
    }
    console.error('Error saving pre-booking:', err);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// ==========================================================
// User Authentication & Access Control Middlewares
// ==========================================================

function userAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'ciper_user_jwt_secret_secure_key_2026_123456';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid login. Please log in again.' });
  }
}

async function requireActiveSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  try {
    const activeSub = await Subscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    if (!activeSub) {
      return res.status(403).json({ error: 'Your subscription has expired. Please renew.' });
    }
    req.subscription = activeSub;
    next();
  } catch (err) {
    console.error('Error checking active subscription:', err);
    res.status(500).json({ error: 'Server error checking subscription' });
  }
}

// ==========================================================
// Razorpay Payment & Subscription API Endpoints
// ==========================================================

// POST /api/payment/create-order
app.post('/api/payment/create-order', async (req, res) => {
  const { planId, amount, currency = "INR" } = req.body;
  if (!planId || !amount) {
    return res.status(400).json({ error: 'planId and amount are required' });
  }
  try {
    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency,
      receipt: `receipt_sub_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Error creating subscription Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// POST /api/payment/verify
app.post('/api/payment/verify', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    name,
    email,
    tradingViewUsername,
    phone,
    planId,
    amount
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment signature details' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email is required to verify payment' });
  }

  try {
    // 1. Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed! Signature mismatch.' });
    }

    // 2. Find or create the user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      user = new User({
        email: email.toLowerCase().trim(),
        name: name || '',
        tradingViewUsername: tradingViewUsername || '',
        phone: phone || ''
      });
      await user.save();
    } else {
      if (name) user.name = name;
      if (tradingViewUsername) user.tradingViewUsername = tradingViewUsername;
      if (phone) user.phone = phone;
      await user.save();
    }

    // 3. Determine plan duration
    let durationDays = 30;
    let planName = '1 Month Access';
    if (planId === '1month') {
      durationDays = 60; // 1 Month pre-order plan gets 60 days
      planName = '1 Month Pre-Order';
    } else if (planId === '3months') {
      durationDays = 90;
      planName = '3 Months Access';
    } else if (planId === '6months') {
      durationDays = 180;
      planName = '6 Months Access';
    } else if (planId === '1year') {
      durationDays = 365;
      planName = '1 Year Access';
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 4. Save subscription to MongoDB
    const subscription = new Subscription({
      userId: user._id,
      planId,
      planName,
      amount: Number(amount),
      startDate,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'active'
    });
    await subscription.save();

    // Send confirmation email
    const subject = `Ciper Eye Subscription Activated! 🎉`;
    const text = `Hello ${name || 'Trader'},\n\nYour payment was successful and your subscription is active!\n\nPlan: ${planName}\nValid until: ${endDate.toLocaleDateString()}\n\nBest regards,\nCiper Eye Team`;
    const html = `<h3>Subscription Activated!</h3><p>Hello <strong>${name || 'Trader'}</strong>,</p><p>Thank you for subscribing to Ciper Eye!</p><p>Your <strong>${planName}</strong> is active until <strong>${endDate.toLocaleDateString()}</strong>.</p>`;
    sendMailHelper(email, subject, text, html, name);

    res.json({
      success: true,
      message: 'Payment verified and subscription saved successfully!',
      subscription
    });

  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Server error verifying payment' });
  }
});

// ==========================================================
// User Authentication Endpoints (Passwordless OTP Flow)
// ==========================================================

let tempUserOtpStore = {};

app.post('/api/user/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No active account found with this email. Please purchase a plan first.' });
    }

    const activeSub = await Subscription.findOne({
      userId: user._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!activeSub) {
      return res.status(403).json({ error: 'Your subscription has expired. Please renew to access indicators.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUserOtpStore[normalizedEmail] = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
    };

    const text = `Your Ciper Eye Login OTP is ${otp}. Valid for 5 minutes.`;
    const html = `<h3>Ciper Eye Login Verification</h3><p>Your Security OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`;
    
    // Dispatched asynchronously in background for immediate responsiveness
    sendMailHelper(normalizedEmail, 'Ciper Eye Login OTP', text, html)
      .catch(err => console.error('[USER OTP SEND ERROR] Failed to send user login OTP:', err.message));

    res.json({ success: true, message: 'OTP sent to registered user email' });
  } catch (err) {
    console.error('Error processing user login OTP:', err);
    res.status(500).json({ error: 'Server error requesting login OTP' });
  }
});

app.post('/api/user/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const store = tempUserOtpStore[normalizedEmail];

  if (store && store.code === otp && Date.now() < store.expiresAt) {
    delete tempUserOtpStore[normalizedEmail]; // clear OTP

    try {
      const user = await User.findOne({ email: normalizedEmail });
      const jwtSecret = process.env.JWT_SECRET || 'ciper_user_jwt_secret_secure_key_2026_123456';
      
      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({ token, email: user.email, name: user.name });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sign session token' });
    }
  } else {
    res.status(401).json({ error: 'Invalid or expired OTP' });
  }
});

// GET /api/indicator/download - Protected route for indicator download
app.get('/api/indicator/download', userAuth, requireActiveSubscription, (req, res) => {
  res.json({
    message: "Subscription verified! Access granted.",
    downloadUrl: "https://www.tradingview.com/script/CiperEyeFlagshipIndicator/",
    indicatorTitle: "Ciper Eye Flagship Indicator"
  });
});

// ==========================================================
// Admin Subscription Management Endpoints
// ==========================================================

// GET /api/admin/subscriptions
app.get('/api/admin/subscriptions', adminAuth, async (req, res) => {
  try {
    const list = await Subscription.find({}).populate('userId').sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('Error fetching admin subscriptions:', err);
    res.status(500).json({ error: 'Database error fetching subscriptions' });
  }
});

// PUT /api/admin/subscriptions/:id/extend
app.put('/api/admin/subscriptions/:id/extend', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const sub = await Subscription.findById(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    const currentEnd = new Date(sub.endDate);
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    sub.endDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    sub.status = 'active';
    sub.expirationWarningSent = false;
    sub.expirationEmailSent = false;
    await sub.save();
    res.json({ message: 'Subscription extended by 30 days', subscription: sub });
  } catch (err) {
    console.error('Error extending subscription:', err);
    res.status(500).json({ error: 'Database error extending subscription' });
  }
});

// PUT /api/admin/subscriptions/:id/revoke
app.put('/api/admin/subscriptions/:id/revoke', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const sub = await Subscription.findById(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    sub.status = 'revoked';
    sub.endDate = new Date();
    await sub.save();
    res.json({ message: 'Subscription access revoked successfully', subscription: sub });
  } catch (err) {
    console.error('Error revoking subscription:', err);
    res.status(500).json({ error: 'Database error revoking subscription' });
  }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';
    
  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all route to serve the React app
app.get('*all', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      status: 'active',
      message: 'Cipertrade API is running. Frontend static files are not available on this server.',
      info: 'If you are looking for the frontend website, check your local frontend build or Vercel.'
    });
  }
});

// Background Expiration Checker
async function checkExpiringSubscriptions() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // --- 1. PREBOOKINGS (WAITLIST LEADS) ---
    // A. Expiring in less than 24 hours (Warning)
    const expiringLeads = await Prebooking.find({
      approved: true,
      subscriptionEndDate: { $lte: tomorrow, $gt: now },
      expirationWarningSent: { $ne: true }
    });
    
    for (const lead of expiringLeads) {
      const hoursLeft = Math.ceil((lead.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const planName = lead.plan || 'monthly';
      const text = `Hello ${lead.name},\n\nYour Ciper AI ${planName} subscription is ending soon. It will expire in ${hoursLeft} hours on ${lead.subscriptionEndDate.toLocaleString()}.\n\nPlease renew your plan to continue using the indicator tools.\n\nBest regards,\nCiper AI Team`;
      const html = `<h3>Subscription Expiring Soon!</h3><p>Hello <strong>${lead.name}</strong>,</p><p>Your Ciper AI <strong>${planName}</strong> subscription is ending soon. It will expire in <strong>${hoursLeft}</strong> hours on <strong>${lead.subscriptionEndDate.toLocaleString()}</strong>.</p><p>Please renew your plan to continue accessing the indicator tools.</p><br/><p>Best regards,<br/>Ciper AI Team</p>`;
      
      const success = await sendMailHelper(lead.email, `Your Ciper AI ${planName} subscription is ending tomorrow`, text, html, lead.name);
      if (success) {
        lead.expirationWarningSent = true;
        await lead.save();
        console.log(`[SUBSCRIPTION WARNING] Sent expiration warning email to ${lead.email}`);
      }
    }
    
    // B. Expired (End date past)
    const expiredLeads = await Prebooking.find({
      approved: true,
      subscriptionEndDate: { $lte: now },
      expirationEmailSent: { $ne: true }
    });
    
    for (const lead of expiredLeads) {
      const planName = lead.plan || 'monthly';
      const text = `Hello ${lead.name},\n\nYour Ciper AI ${planName} subscription has expired.\n\nPlease renew your plan to reactivate your access to the indicator tools.\n\nBest regards,\nCiper AI Team`;
      const html = `<h3>Subscription Expired</h3><p>Hello <strong>${lead.name}</strong>,</p><p>Your Ciper AI <strong>${planName}</strong> subscription has expired.</p><p>Please renew your plan to reactivate your access to the indicator tools.</p><br/><p>Best regards,<br/>Ciper AI Team</p>`;
      
      const success = await sendMailHelper(lead.email, `Your Ciper AI ${planName} subscription has expired`, text, html, lead.name);
      if (success) {
        lead.expirationEmailSent = true;
        await lead.save();
        console.log(`[SUBSCRIPTION EXPIRED] Sent expiration email to ${lead.email}`);
      }
    }

    // --- 2. PAID SUBSCRIPTIONS ---
    // A. Expiring in less than 24 hours (Warning)
    const expiringSubs = await Subscription.find({
      status: 'active',
      endDate: { $lte: tomorrow, $gt: now },
      expirationWarningSent: { $ne: true }
    }).populate('userId');
    
    for (const sub of expiringSubs) {
      if (!sub.userId) continue;
      const hoursLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const planName = sub.planName || 'Access Plan';
      const text = `Hello ${sub.userId.name || 'Trader'},\n\nYour Ciper Eye ${planName} subscription is ending soon. It will expire in ${hoursLeft} hours on ${sub.endDate.toLocaleString()}.\n\nPlease renew your plan to continue using the indicator tools.\n\nBest regards,\nCiper Eye Team`;
      const html = `<h3>Subscription Expiring Soon!</h3><p>Hello <strong>${sub.userId.name || 'Trader'}</strong>,</p><p>Your Ciper Eye <strong>${planName}</strong> subscription is ending soon. It will expire in <strong>${hoursLeft}</strong> hours on <strong>${sub.endDate.toLocaleString()}</strong>.</p><p>Please renew your plan to continue accessing the indicator tools.</p><br/><p>Best regards,<br/>Ciper Eye Team</p>`;
      
      const success = await sendMailHelper(sub.userId.email, `Your Ciper Eye ${planName} subscription is ending tomorrow`, text, html, sub.userId.name);
      if (success) {
        sub.expirationWarningSent = true;
        await sub.save();
        console.log(`[SUBSCRIPTION WARNING] Sent paid subscription warning email to ${sub.userId.email}`);
      }
    }
    
    // B. Expired (End date past)
    const expiredSubs = await Subscription.find({
      status: 'active',
      endDate: { $lte: now }
    }).populate('userId');
    
    for (const sub of expiredSubs) {
      sub.status = 'expired';
      
      if (sub.userId && sub.expirationEmailSent !== true) {
        const planName = sub.planName || 'Access Plan';
        const text = `Hello ${sub.userId.name || 'Trader'},\n\nYour Ciper Eye ${planName} subscription has expired.\n\nPlease renew your plan to reactivate your access to the indicator tools.\n\nBest regards,\nCiper Eye Team`;
        const html = `<h3>Subscription Expired</h3><p>Hello <strong>${sub.userId.name || 'Trader'}</strong>,</p><p>Your Ciper Eye <strong>${planName}</strong> subscription has expired.</p><p>Please renew your plan to reactivate your access to the indicator tools.</p><br/><p>Best regards,<br/>Ciper Eye Team</p>`;
        
        await sendMailHelper(sub.userId.email, `Your Ciper Eye ${planName} subscription has expired`, text, html, sub.userId.name);
        sub.expirationEmailSent = true;
      }
      
      await sub.save();
      console.log(`[SUBSCRIPTION EXPIRED] Updated paid subscription status to expired for sub ${sub._id}`);
    }
  } catch (err) {
    console.error('Error in background subscription check:', err);
  }
}

// Start checker every 30 seconds
setInterval(checkExpiringSubscriptions, 30000);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Run initial check after 2 seconds
  setTimeout(checkExpiringSubscriptions, 2000);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Prebooking, Config, Referral } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Global memory for OTP
let tempOtpStore = {
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

// Helper function to send email via Mailjet REST API v3.1 or fallback SMTP
async function sendMailHelper(to, subject, text, html, toName = '') {
  const smtpHost = process.env.SMTP_HOST || 'in-v3.mailjet.com';
  const apiKey = process.env.SMTP_USER || 'a3ee40a25020a15f6ef688e6017563e5';
  const secretKey = process.env.SMTP_PASS || 'fec97d471d7a9ed41f1d82e8d6d0dfb4';
  const fromEmail = process.env.SMTP_FROM || 'ciperindicaters@gmail.com';

  if (!apiKey || !secretKey) {
    console.log('\n=========================================');
    console.log(`[EMAIL SIMULATOR] To: ${to}`);
    console.log(`[EMAIL SIMULATOR] Subject: ${subject}`);
    console.log(`[EMAIL SIMULATOR] Content: ${text}`);
    console.log('=========================================\n');
    return true;
  }

  // If the user has configured an alternative SMTP host (like smtp.gmail.com), use Nodemailer SMTP instead of Mailjet REST API
  if (smtpHost && smtpHost !== 'in-v3.mailjet.com') {
    console.log(`[SMTP TRANSPORTER] Attempting to send email via SMTP (${smtpHost})...`);
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: apiKey,
          pass: secretKey
        }
      });
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

app.post('/api/config', adminAuth, async (req, res) => {
  const { monthlyDiscountPrice, monthlyStrikePrice, annualDiscountPrice, annualStrikePrice, indicatorMode } = req.body;
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
    
    await config.save();
    res.json({ message: 'Settings saved successfully', config });
  } catch (err) {
    console.error('Error saving config:', err);
    res.status(500).json({ error: 'Database error saving config' });
  }
});

// 2. Admin Auth login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const normalizedPassword = password ? password.trim() : '';

  // Get allowed admin emails and password from environment config
  const allowedEmails = (process.env.ADMIN_EMAIL || 'hetrajchauahan@gmail.com,hetrajchauhan@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());
  const adminPassword = process.env.ADMIN_PASSWORD || 'Hetraj@1920062715';

  if (allowedEmails.includes(normalizedEmail) && normalizedPassword === adminPassword) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtpStore = {
      email: normalizedEmail,
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins expiry
    };
    
    console.log('\n======================================================');
    console.log('   [ADMIN OTP SECURE KEY GENERATED]                 ');
    console.log(`   OTP CODE: ${otp}                                 `);
    console.log('   Valid for 5 minutes.                             ');
    console.log('======================================================\n');
    
    const text = `Your Admin Security OTP is ${otp}. Valid for 5 minutes.`;
    const html = `<h3>Ciper Admin Authentication</h3><p>Your Security OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`;
    await sendMailHelper(normalizedEmail, 'Ciper Admin Security OTP', text, html);
    
    return res.json({ success: true, message: 'OTP sent to registered admin email' });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

// 3. Admin Auth OTP verification
app.post('/api/admin/verify-otp', (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ error: 'OTP is required' });
  }
  
  const isMasterOtp = process.env.MASTER_OTP && otp === process.env.MASTER_OTP;
  
  if (isMasterOtp || (tempOtpStore.code === otp && Date.now() < tempOtpStore.expiresAt)) {
    const targetEmail = isMasterOtp ? 'hetrajchauhan@gmail.com' : tempOtpStore.email;
    const jwtSecret = process.env.JWT_SECRET || 'ciper_admin_jwt_secret_secure_key_2026_987654';
    
    // Sign a secure JWT session token
    const token = jwt.sign(
      { email: targetEmail, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    tempOtpStore = { email: null, code: null, expiresAt: null }; // clear after use
    return res.json({ token });
  }
  
  res.status(401).json({ error: 'Invalid or expired OTP' });
});

// 4. Leads dashboard data fetch
app.get('/api/admin/leads', adminAuth, async (req, res) => {
  try {
    const prebookings = await Prebooking.find({}).sort({ createdAt: -1 });
    
    // Calculate notifications for leads expiring in less than 24 hours or already expired
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const expiringAlerts = prebookings.filter(p => 
      p.approved && 
      p.plan === 'monthly' && 
      p.subscriptionEndDate && 
      p.subscriptionEndDate <= oneDayFromNow && 
      p.subscriptionEndDate > now
    ).map(p => ({
      id: p._id,
      name: p.name,
      email: p.email,
      plan: p.plan,
      endDate: p.subscriptionEndDate,
      message: `Subscription for ${p.name} (${p.email}) is expiring in less than 24 hours!`
    }));

    const expiredAlerts = prebookings.filter(p => 
      p.approved && 
      p.plan === 'monthly' && 
      p.subscriptionEndDate && 
      p.subscriptionEndDate <= now
    ).map(p => ({
      id: p._id,
      name: p.name,
      email: p.email,
      plan: p.plan,
      endDate: p.subscriptionEndDate,
      message: `Subscription for ${p.name} (${p.email}) has expired!`
    }));

    res.json({ 
      prebookings, 
      notifications: [...expiringAlerts, ...expiredAlerts] 
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
    
    if (lead.plan === 'monthly') {
      lead.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (lead.plan === 'annual') {
      lead.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
    }
    lead.expirationWarningSent = false;
    await lead.save();
    
    const text = `Hello ${lead.name},\n\nWe are pleased to inform you that your early access to Ciper AI trading tools has been approved!\n\nYour plan is active until ${lead.subscriptionEndDate ? lead.subscriptionEndDate.toLocaleDateString() : 'N/A'}.\n\nBest regards,\nCiper AI Team`;
    const html = `<h3>Access Approved!</h3><p>Hello <strong>${lead.name}</strong>,</p><p>We are pleased to inform you that your early access to Ciper AI trading tools has been approved!</p><p>Your plan is active until <strong>${lead.subscriptionEndDate ? lead.subscriptionEndDate.toLocaleDateString() : 'N/A'}</strong>.</p><br/><p>Best regards,<br/>Ciper AI Team</p>`;
    await sendMailHelper(lead.email, 'Ciper AI Early Access Approved!', text, html);
    
    res.json({ message: 'Lead approved and confirmation email sent successfully', lead });
  } catch (err) {
    console.error('Error approving lead:', err);
    res.status(500).json({ error: 'Database error approving lead' });
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



// 9. Modified Waitlist Pre-booking
app.post('/api/prebook', async (req, res) => {
  const { name, email, tradingViewUsername, phone, plan, refCode } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    const newPrebook = new Prebooking({
      name,
      email,
      tradingView: tradingViewUsername || '',
      phone: phone || '',
      plan: plan || 'unspecified',
      refCode: refCode || ''
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

    // Send pre-booking confirmation email via Mailjet REST API
    const subject = 'Your Ciper AI Pre-Booking is Confirmed! ⚡';
    const text = `Hello ${name},\n\nYour pre-booking is now complete! We will email you when the indicators are ready. We will also reply to you on WhatsApp.\n\nThank you,\nCiper AI Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0b0c10; color: #c5c6c7; border: 1px solid #1f2833; border-radius: 12px;">
        <h2 style="color: #66fcf1; border-bottom: 1px solid #1f2833; padding-bottom: 12px; margin-top: 0;">Pre-Booking Confirmed!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your pre-booking is now complete! We will email you when the indicators are ready.</p>
        <p>We will also reply to you on WhatsApp to share updates and next steps.</p>
        <br/>
        <p style="color: #66fcf1; font-weight: bold; margin-bottom: 5px;">Thank you,</p>
        <p style="color: #45f3ff; font-weight: bold; margin-top: 0;">Ciper AI Team</p>
      </div>
    `;
    
    // Dispatched asynchronously so pre-booking response is instant
    sendMailHelper(email, subject, text, html, name);

    res.status(201).json({ message: 'Pre-booking successful!', id: newPrebook._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered for pre-booking' });
    }
    console.error('Error saving pre-booking:', err);
    res.status(500).json({ error: 'Database error occurred' });
  }
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
    
    // Find all approved monthly leads expiring in less than 24 hours, warning not yet sent
    const expiringLeads = await Prebooking.find({
      approved: true,
      plan: 'monthly',
      subscriptionEndDate: { $lte: tomorrow, $gt: now },
      expirationWarningSent: { $ne: true }
    });
    
    for (const lead of expiringLeads) {
      const hoursLeft = Math.ceil((lead.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const text = `Hello ${lead.name},\n\nYour Ciper AI monthly subscription is ending soon. It will expire in ${hoursLeft} hours (tomorrow) on ${lead.subscriptionEndDate.toLocaleString()}.\n\nPlease renew your plan to continue using the indicator tools.\n\nBest regards,\nCiper AI Team`;
      const html = `<h3>Subscription Expiring Soon!</h3><p>Hello <strong>${lead.name}</strong>,</p><p>Your Ciper AI monthly subscription is ending soon. It will expire in <strong>${hoursLeft}</strong> hours (tomorrow) on <strong>${lead.subscriptionEndDate.toLocaleString()}</strong>.</p><p>Please renew your plan to continue accessing the indicator tools.</p><br/><p>Best regards,<br/>Ciper AI Team</p>`;
      
      const success = await sendMailHelper(lead.email, 'Your Ciper AI monthly subscription is ending tomorrow', text, html);
      if (success) {
        lead.expirationWarningSent = true;
        await lead.save();
        console.log(`[SUBSCRIPTION WARNING] Sent expiration warning email to ${lead.email}`);
      }
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

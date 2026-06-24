const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: MONGODB_URI environment variable is not defined!');
  console.error('Please set the MONGODB_URI in your Render environment variables or .env file.');
} else {
  mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB successfully.'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

const prebookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  tradingView: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual', 'unspecified'],
    default: 'unspecified'
  },
  refCode: {
    type: String,
    trim: true,
    default: ''
  },
  approved: {
    type: Boolean,
    default: false
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  expirationWarningSent: {
    type: Boolean,
    default: false
  },
  indicatorTitle: {
    type: String,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: true });

// Dynamic configuration schema (prices, discounts, and indicator mode)
const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'system_settings'
  },
  monthlyDiscountPrice: {
    type: Number,
    default: 299
  },
  monthlyStrikePrice: {
    type: Number,
    default: 399
  },
  annualDiscountPrice: {
    type: Number,
    default: 999
  },
  annualStrikePrice: {
    type: Number,
    default: 1200
  },
  indicatorMode: {
    type: String,
    enum: ['prebook', 'booknow'],
    default: 'prebook'
  },
  countdownTargetDate: {
    type: Date,
    default: null
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  globalDiscountPercent: {
    type: Number,
    default: 0
  }
}, { strict: true });

// Influencer referral tracking schema
const referralSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  discountPercent: {
    type: Number,
    default: 10
  },
  clicks: {
    type: Number,
    default: 0
  },
  bookingsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: true });

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    default: '1920062715'
  }
}, { strict: true });

const indicatorSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  desc: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    default: 'Coming Soon'
  },
  monthlyStrikePrice: {
    type: Number,
    default: 399
  },
  monthlyDiscountPrice: {
    type: Number,
    default: 299
  },
  annualStrikePrice: {
    type: Number,
    default: 1200
  },
  annualDiscountPrice: {
    type: Number,
    default: 999
  },
  price1Month: {
    type: Number,
    default: 1749
  },
  strike1Month: {
    type: Number,
    default: 3499
  },
  price3Months: {
    type: Number,
    default: 3999
  },
  strike3Months: {
    type: Number,
    default: 7999
  },
  price6Months: {
    type: Number,
    default: 6999
  },
  strike6Months: {
    type: Number,
    default: 13999
  },
  price1Year: {
    type: Number,
    default: 11499
  },
  strike1Year: {
    type: Number,
    default: 22999
  },
  countdownTargetDate: {
    type: Date,
    default: null
  },
  bookingsCount: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: 'trend'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: true });

const webContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'landing_page_copy'
  },
  heroBadge: { type: String, default: 'Ciper AI Platform' },
  heroTitle1: { type: String, default: 'Automate' },
  heroTitle2: { type: String, default: 'Your Market Edge' },
  heroDesc: { type: String, default: 'Ciper uses advanced neural networks to map out the market in real-time. Detects support/resistance zones, high-probability convergence areas, and breakouts automatically.' },
  
  heroSlide2Badge: { type: String, default: 'Featured Indicator' },
  heroSlide2Title1: { type: String, default: 'Ciper Eye' },
  heroSlide2Title2: { type: String, default: 'Signal Engine' },
  heroSlide2Desc: { type: String, default: 'Generates high-probability buy/sell signals. Integrate it with your existing strategy to get precise entry, take profit (TP), and stop loss (SL) levels.' },

  accuracyValue: { type: Number, default: 94 },
  
  stat1Num: { type: String, default: '730K' },
  stat1Label: { type: String, default: 'Calculations/sec' },
  stat1Desc: { type: String, default: 'Real-time compute nodes analyzing micro-structure changes.' },
  
  stat2Num: { type: String, default: '94%' },
  stat2Label: { type: String, default: 'Model Accuracy' },
  stat2Desc: { type: String, default: 'Historical test results on multi-timeframe breakouts.' },
  
  stat3Num: { type: String, default: '12K+' },
  stat3Label: { type: String, default: 'Global Backtests' },
  stat3Desc: { type: String, default: 'Simulated market cycles across major tokens and assets.' },
  
  faqs: {
    type: Array,
    default: [
      { q: "How does Ciper detect pattern zones?", a: "Ciper scans historical and real-time candlestick data across multiple timeframes, calculating mathematical standard deviations and liquidity imbalances to map pattern zones." },
      { q: "Is Ciper suitable for beginners?", a: "Yes. Ciper takes complex institutional concepts (like support/resistance nodes and multi-indicator convergence) and translates them into simple, clean visual cues on your chart." },
      { q: "Which assets and platforms does Ciper support?", a: "Ciper works across major asset classes including Cryptocurrencies, Forex, and Stocks. It is designed to integrate seamlessly with major charting platforms like TradingView." },
      { q: "What does the early access waitlist include?", a: "Joining the waitlist secures your early access slot, exclusive discounted pricing upon launch, and access to private beta testing groups." }
    ]
  },
  
  reviews: {
    type: Array,
    default: [
      { quote: "Works like absolute magic. The neural pattern scanner marks structural zones in seconds. Completely optimized my entries and exit speeds.", user: "@Mishatrading", avatar: "MT", role: "Pro Crypto Trader" },
      { quote: "The auto support & resistance overlays are incredibly precise. It maps liquidity pools exactly where institutional orders sit. Highly recommend.", user: "@NazarBuch", avatar: "NB", role: "Forex Specialist" },
      { quote: "Ciper's convergence metrics have saved me hours of analysis. Seeing multiple mathematical indicators align in real-time is a complete cheat code.", user: "@CryptoApex", avatar: "CA", role: "Equity Analyst" }
    ]
  }
}, { strict: true });

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // automatic TTL expiration after 7 days
  }
}, { strict: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true
  },
  tradingViewUsername: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: true });

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: true });

const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

const Prebooking = mongoose.model('Prebooking', prebookingSchema);
const Config = mongoose.model('Config', configSchema);
const Referral = mongoose.model('Referral', referralSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Indicator = mongoose.model('Indicator', indicatorSchema);
const WebContent = mongoose.model('WebContent', webContentSchema);
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

// Setup default configuration if not exists helper
async function ensureDefaultConfig() {
  try {
    await Config.updateOne(
      { key: 'system_settings' },
      {
        $setOnInsert: {
          monthlyDiscountPrice: 149,
          monthlyStrikePrice: 199,
          annualDiscountPrice: 499,
          annualStrikePrice: 599,
          indicatorMode: 'prebook',
          countdownTargetDate: null,
          maintenanceMode: false
        }
      },
      { upsert: true }
    );
    // Force update existing system settings to 50% price
    await Config.updateOne(
      { key: 'system_settings' },
      {
        $set: {
          monthlyDiscountPrice: 149,
          monthlyStrikePrice: 199,
          annualDiscountPrice: 499,
          annualStrikePrice: 599
        }
      }
    );
    console.log('Default system settings configuration initialized and updated.');
  } catch (err) {
    if (err.code === 11000) {
      console.log('Default system settings already initialized (duplicate key handled).');
    } else {
      console.error('Error initializing default configuration:', err);
    }
  }
}

// Seeding default indicators on startup
async function ensureDefaultIndicators() {
  try {
    const count = await Indicator.countDocuments();
    if (count === 0) {
      const defaultIndicators = [
        {
          title: "Ciper Eye",
          desc: "Generates high-probability buy/sell signals. Integrate it with your existing strategy to get precise entry, take profit (TP), and stop loss (SL) levels.",
          status: "Beta Testing",
          icon: "trend",
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
          strike1Year: 22999
        },
        {
          title: "Ciper Volume Profile",
          desc: "Visualizes institutional volume distribution, Point of Control (POC), and high-volume nodes directly on your Y-axis.",
          status: "Coming Soon",
          icon: "volume",
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
          strike1Year: 22999
        },
        {
          title: "Ciper Liquidity Grab",
          desc: "Tracks retail stop-loss clusters and alerts you to potential stop-hunts and manipulation zones prior to major market pivots.",
          status: "Coming Soon",
          icon: "liquidity",
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
          strike1Year: 22999
        }
      ];
      await Indicator.insertMany(defaultIndicators);
      console.log('Default indicators seeded successfully.');
    } else {
      // Migrate existing indicators to add plan price defaults if missing
      await Indicator.updateMany(
        { price1Month: { $exists: false } },
        {
          $set: {
            price1Month: 1749,
            strike1Month: 3499,
            price3Months: 3999,
            strike3Months: 7999,
            price6Months: 6999,
            strike6Months: 13999,
            price1Year: 11499,
            strike1Year: 22999
          }
        }
      );

      // Force update existing indicators to 50% price (monthly/annual)
      await Indicator.updateMany({}, {
        $set: {
          monthlyStrikePrice: 199,
          monthlyDiscountPrice: 149,
          annualStrikePrice: 599,
          annualDiscountPrice: 499
        }
      });
      // Rename any indicator with TL/Trend Line title to Ciper Eye and update description
      await Indicator.updateMany(
        { title: { $regex: /Ciper TL|Trend Line/i } },
        {
          $set: {
            title: "Ciper Eye",
            desc: "Generates high-probability buy/sell signals. Integrate it with your existing strategy to get precise entry, take profit (TP), and stop loss (SL) levels."
          }
        }
      );
      console.log('Existing indicators updated to new prices & Ciper Eye branding.');
    }
  } catch (err) {
    console.error('Error seeding default indicators:', err);
  }
}

// Setup default WebContent if not exists helper
async function ensureDefaultWebContent() {
  try {
    await WebContent.updateOne(
      { key: 'landing_page_copy' },
      {
        $setOnInsert: {
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
        }
      },
      { upsert: true }
    );
    // Force rename any existing WebContent values referring to Ciper TL
    await WebContent.updateOne(
      { key: 'landing_page_copy' },
      {
        $set: {
          heroSlide2Title1: "Ciper Eye",
          heroSlide2Title2: "Signal Engine",
          heroSlide2Desc: "Generates high-probability buy/sell signals. Integrate it with your existing strategy to get precise entry, take profit (TP), and stop loss (SL) levels."
        }
      }
    );
    console.log('Default Web Content copy configuration initialized & branded.');
  } catch (err) {
    if (err.code === 11000) {
      console.log('Default Web Content copy configuration already initialized (duplicate key handled).');
    } else {
      console.error('Error initializing default web content:', err);
    }
  }
}

let dbInitialized = false;

// Check connection to run config initialization
mongoose.connection.on('connected', () => {
  if (dbInitialized) return;
  dbInitialized = true;
  setTimeout(() => {
    ensureDefaultConfig();
    ensureDefaultIndicators();
    ensureDefaultWebContent();
  }, 500);
});

module.exports = { Prebooking, Config, Referral, Admin, Indicator, WebContent, RefreshToken, User, Subscription };



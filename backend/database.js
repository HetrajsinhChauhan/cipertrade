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
});

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
  }
});

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
});

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
});

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
});

const Prebooking = mongoose.model('Prebooking', prebookingSchema);
const Config = mongoose.model('Config', configSchema);
const Referral = mongoose.model('Referral', referralSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Indicator = mongoose.model('Indicator', indicatorSchema);

// Setup default configuration if not exists helper
async function ensureDefaultConfig() {
  try {
    const exists = await Config.findOne({ key: 'system_settings' });
    if (!exists) {
      const defaultConfig = new Config({ key: 'system_settings' });
      await defaultConfig.save();
      console.log('Default system settings configuration initialized.');
    }
  } catch (err) {
    console.error('Error initializing default configuration:', err);
  }
}

// Seeding default indicators on startup
async function ensureDefaultIndicators() {
  try {
    const count = await Indicator.countDocuments();
    if (count === 0) {
      const defaultIndicators = [
        {
          title: "Ciper TL (Trend Line)",
          desc: "Plots high-probability trend lines and automatically highlights chart pattern breakout vectors in H1/H4 timeframes.",
          status: "Beta Testing",
          icon: "trend",
          monthlyStrikePrice: 399,
          monthlyDiscountPrice: 299,
          annualStrikePrice: 1200,
          annualDiscountPrice: 999
        },
        {
          title: "Ciper Volume Profile",
          desc: "Visualizes institutional volume distribution, Point of Control (POC), and high-volume nodes directly on your Y-axis.",
          status: "Coming Soon",
          icon: "volume",
          monthlyStrikePrice: 399,
          monthlyDiscountPrice: 299,
          annualStrikePrice: 1200,
          annualDiscountPrice: 999
        },
        {
          title: "Ciper Liquidity Grab",
          desc: "Tracks retail stop-loss clusters and alerts you to potential stop-hunts and manipulation zones prior to major market pivots.",
          status: "Coming Soon",
          icon: "liquidity",
          monthlyStrikePrice: 399,
          monthlyDiscountPrice: 299,
          annualStrikePrice: 1200,
          annualDiscountPrice: 999
        }
      ];
      await Indicator.insertMany(defaultIndicators);
      console.log('Default indicators seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding default indicators:', err);
  }
}

// Check connection to run config initialization
mongoose.connection.on('connected', () => {
  setTimeout(() => {
    ensureDefaultConfig();
    ensureDefaultIndicators();
  }, 500);
});

module.exports = { Prebooking, Config, Referral, Admin, Indicator };



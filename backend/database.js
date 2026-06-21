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

const Prebooking = mongoose.model('Prebooking', prebookingSchema);
const Config = mongoose.model('Config', configSchema);
const Referral = mongoose.model('Referral', referralSchema);

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

// Check connection to run config initialization
mongoose.connection.on('connected', () => {
  setTimeout(ensureDefaultConfig, 500);
});

module.exports = { Prebooking, Config, Referral };



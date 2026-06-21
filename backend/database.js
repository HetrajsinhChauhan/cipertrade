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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Prebooking = mongoose.model('Prebooking', prebookingSchema);

module.exports = Prebooking;


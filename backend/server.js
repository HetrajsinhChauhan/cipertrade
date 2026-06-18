const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Prebooking = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API endpoint to handle pre-bookings
app.post('/api/prebook', async (req, res) => {
  const { name, email, tradingViewUsername, phone } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    const newPrebook = new Prebooking({
      name,
      email,
      tradingView: tradingViewUsername || '',
      phone: phone || ''
    });
    
    await newPrebook.save();
    res.status(201).json({ message: 'Pre-booking successful!', id: newPrebook._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered for pre-booking' });
    }
    console.error('Error saving pre-booking:', err);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


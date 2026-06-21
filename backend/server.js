const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
      info: 'If you are looking for the frontend website, check your Vercel deployment.'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


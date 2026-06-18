const mongoose = require('mongoose');
require('dotenv').config();
const Prebooking = require('./database');

async function viewLeads() {
  try {
    console.log('\n==================================================================');
    console.log('                CIPER AI - ACTIVE WAITLIST LEADS');
    console.log('==================================================================\n');

    const leads = await Prebooking.find({}).sort({ createdAt: -1 });

    if (leads.length === 0) {
      console.log('No pre-bookings found yet. Please open the website, click "Get Started" / "Secure Early Access", and submit the form to add leads.');
    } else {
      const formatted = leads.map((lead, index) => ({
        index,
        id: lead._id.toString(),
        name: lead.name,
        email: lead.email,
        tradingView: lead.tradingView,
        phone: lead.phone,
        created_at: lead.createdAt.toISOString()
      }));
      console.table(formatted);
      console.log(`Total Leads Count: ${leads.length}\n`);
    }
  } catch (err) {
    console.error('Error querying MongoDB database:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Wait until connection is open to run the query
mongoose.connection.on('connected', () => {
  // Give a small delay to make sure connection messages don't overlap or just run it directly
  setTimeout(viewLeads, 100);
});


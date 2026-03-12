const axios = require('axios');

const names = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 
  'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia'
];

async function simulate() {
  console.log('🚀 Starting simulation: Adding 10 clients to the queue...');
  
  for (const name of names) {
    try {
      const res = await axios.post('http://localhost:3001/api/queue/join', {
        name: name,
        phone: `555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
      });
      console.log(`✅ Joined: ${name.padEnd(10)} | Ticket: #${res.data.ticketNumber.toString().padStart(4, '0')}`);
      
      // Small delay to make it look realistic in the UI
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`❌ Failed to join ${name}:`, err.message);
      console.log('Make sure the server is running on http://localhost:3001');
      break;
    }
  }
  
  console.log('\n✨ Simulation complete. Check your Admin Dashboard!');
}

simulate();

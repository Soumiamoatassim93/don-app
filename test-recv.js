// test-bob.js
const io = require('socket.io-client');

// ⚠️ REMPLACE AVEC LE TOKEN DE BOB (deuxième utilisateur)
const MON_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic291bWlhbW9hdGFzc2ltNDJAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzYyNDQzODEsImV4cCI6MTc3NjMzMDc4MX0.arMo_7wG-0t2gKJytSVgm-Ir0PECuII2PW8k3UmzVtI';  // ← Token du 2ème utilisateur

const socket = io('http://localhost:3000/messaging', {
    auth: { token: MON_TOKEN }
});

socket.on('connect', () => {
    console.log('✅ Bob connecté - prêt à recevoir');
});

socket.on('new_message', (msg) => {
    console.log('📨 BOB a reçu un message:', msg.content);
    console.log('   De:', msg.senderId);
});

socket.on('connect_error', (err) => {
    console.error('❌ Erreur:', err.message);
});
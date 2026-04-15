// test.js - copie-colle ce code exactement
const io = require('socket.io-client');

// CHANGE JUSTE CES 2 LIGNES avec tes vraies infos
const TON_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc2MjQzOTQ0LCJleHAiOjE3NzYzMzAzNDR9.Vz7Rgdp7jG42sg_FQr2LJZvAJ4H_UZn7_JBgSIscSyY';  // ← Mets ton token ici
const ID_DESTINATAIRE = '3';       // ← Mets l'ID de qui doit recevoir

// Connexion à la socket
const socket = io('http://localhost:3000/messaging', {
    auth: { token: TON_TOKEN }
});

// Quand connecté
socket.on('connect', () => {
    console.log('✅ Connecté !');
    
    // Envoie un message
    socket.emit('send_message', {
        receiverId: ID_DESTINATAIRE,
        content: 'Test de ma socket',
        type: 'text'
    });
    console.log('📤 Message envoyé');
});

// Quand tu reçois un message
socket.on('new_message', (msg) => {
    console.log('📨 Message reçu:', msg);
});

// En cas d'erreur
socket.on('connect_error', (err) => {
    console.error('❌ Erreur:', err.message);
});
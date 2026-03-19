const WebSocket = require('ws');

// Test 1: Connexion simple
console.log('🧪 Test 1: Connexion Backend WS...');
const ws1 = new WebSocket('ws://localhost:4000');
ws1.on('open', () => {
  console.log('✅ WS1: Connecté');
  ws1.send(JSON.stringify({ type: 'chat', message: 'Test WS1' }));
});
ws1.on('message', (data) => console.log('📨 WS1 reçu:', data.toString()));
ws1.on('close', () => console.log('🔌 WS1 fermé'));

// Test 2: Multi-clients
console.log('🧪 Test 2: 4 clients simultanés...');
for (let i = 2; i <= 5; i++) {
  const ws = new WebSocket('ws://localhost:4000');
  ws.clientId = i;
  
  ws.on('open', () => {
    console.log(`✅ WS${i}: Connecté`);
    setTimeout(() => {
      ws.send(JSON.stringify({ 
        type: 'chat', 
        message: `Hello from client #${i}` 
      }));
    }, 1000 * i);
  });
  
  ws.on('message', (data) => {
    console.log(`📨 WS${i} reçu:`, data.toString());
  });
  
  ws.on('close', () => {
    console.log(`🔌 WS${i} fermé`);
  });
  
  // Auto-déconnexion après 5s
  setTimeout(() => ws.close(), 4000);
}

// Test 3: Messages invalides
console.log('🧪 Test 3: JSON invalide...');
const wsError = new WebSocket('ws://localhost:4000');
wsError.on('open', () => {
  console.log('✅ WS-ERROR: Connecté');
  wsError.send('JSON invalide !!!!'); // Doit logger "Invalid JSON"
  setTimeout(() => wsError.close(), 1000);
});

const fetch = require('node-fetch');

fetch('http://localhost:3000/api/clientes')
  .then(res => res.json())
  .then(data => {
    console.log('Status GET: 200');
    console.log('Resposta GET:', JSON.stringify(data, null, 2));
  })
  .catch(e => console.error('Erro GET:', e.message));

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/barbeiros',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log('Barbeiros com suas fotos:');
    console.log(JSON.stringify(parsed.barbeiros.map(b => ({
      id: b.id,
      nome: b.nome,
      fotoUrl: b.fotoUrl
    })), null, 2));
  });
});

req.on('error', (e) => {
  console.error(`Erro: ${e.message}`);
});

req.end();

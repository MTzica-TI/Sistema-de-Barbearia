fetch('http://localhost:3000/')
  .then(r => r.text())
  .then(html => {
    const lines = html.split('\n');
    console.log('=== Primeiras linhas HTML ===');
    console.log(lines.slice(0, 5).join('\n'));
    console.log('\n=== Procurando por erros ===');
    const hasError = html.includes('error') || html.includes('Error');
    console.log('Tem error:', hasError);
    const hasScript = html.includes('<script');
    console.log('Tem <script>:', hasScript);
    console.log('Tamanho HTML:', html.length);
  })
  .catch(e => console.log('Erro fetch:', e.message));

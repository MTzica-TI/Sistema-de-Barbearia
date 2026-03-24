// Script para testar API de serviços
async function testarAPI() {
  console.log("Testando /api/servicos...\n");
  
  try {
    const response = await fetch("http://localhost:3000/api/servicos", {
      headers: { "Accept": "application/json" }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const dados = await response.json();
    
    console.log(`\nDados retornados:`);
    console.log(JSON.stringify(dados, null, 2));
    
    console.log(`\nTipo de dados: ${Array.isArray(dados) ? 'Array' : typeof dados}`);
    console.log(`Quantidade: ${Array.isArray(dados) ? dados.length : 'N/A'}`);
  } catch (error) {
    console.error("Erro ao chamar API:", error);
  }
}

testarAPI();

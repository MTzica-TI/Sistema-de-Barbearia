const apiBase = 'http://localhost:3000';

async function test() {
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@teste.com`;
  const testTelefone = '11999999999';
  const testSenha = 'senha123';

  console.log('=== TESTE CADASTRO ===');
  console.log('Email:', testEmail);

  const resSignup = await fetch(`${apiBase}/api/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Cliente Teste',
      email: testEmail,
      telefone: testTelefone,
      senha: testSenha,
    }),
  });

  const signupData = await resSignup.json();
  console.log('Status:', resSignup.status);
  console.log('Resposta:', JSON.stringify(signupData, null, 2));

  if (!resSignup.ok) {
    console.log('❌ Cadastro falhou');
    return;
  }

  console.log('✅ Cadastro bem-sucedido');

  console.log('\n=== TESTE LOGIN ===');
  const resLogin = await fetch(`${apiBase}/api/clientes/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      senha: testSenha,
    }),
  });

  const loginData = await resLogin.json();
  console.log('Status:', resLogin.status);
  console.log('Resposta:', JSON.stringify(loginData, null, 2));

  if (!resLogin.ok) {
    console.log('❌ Login falhou');
    return;
  }

  console.log('✅ Login bem-sucedido');

  console.log('\n=== TESTE EDITAR PERFIL ===');
  const resPatch = await fetch(`${apiBase}/api/clientes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOriginal: testEmail,
      nome: 'Cliente Teste Alterado',
      email: testEmail,
      telefone: testTelefone,
      fotoUrl: '/images/clientes/default.svg',
    }),
  });

  const patchData = await resPatch.json();
  console.log('Status:', resPatch.status);
  console.log('Resposta:', JSON.stringify(patchData, null, 2));

  if (!resPatch.ok) {
    console.log('❌ Edição falhou');
    return;
  }

  console.log('✅ Edição bem-sucedida');

  console.log('\n=== TESTE LISTAR CLIENTES ===');
  const resList = await fetch(`${apiBase}/api/clientes`, {
    method: 'GET',
  });

  const listData = await resList.json();
  console.log('Status:', resList.status);
  console.log('Total de clientes:', listData.clientes?.length);
  const clienteTeste = listData.clientes?.find(c => c.email === testEmail);
  if (clienteTeste) {
    console.log('Cliente encontrado:', JSON.stringify(clienteTeste, null, 2));
    console.log('✅ Cliente aparece na lista');
  } else {
    console.log('❌ Cliente não encontrado na lista');
  }

  console.log('\n=== TESTE RECUPERAR SENHA ===');
  const resReset = await fetch(`${apiBase}/api/clientes/recuperar-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      telefone: testTelefone,
      novaSenha: 'novasenha456',
    }),
  });

  const resetData = await resReset.json();
  console.log('Status:', resReset.status);
  console.log('Resposta:', JSON.stringify(resetData, null, 2));

  if (!resReset.ok) {
    console.log('❌ Recuperação de senha falhou');
    return;
  }

  console.log('✅ Recuperação de senha bem-sucedida');

  console.log('\n=== TESTE LOGIN COM NOVA SENHA ===');
  const resLoginNova = await fetch(`${apiBase}/api/clientes/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      senha: 'novasenha456',
    }),
  });

  const loginNovaData = await resLoginNova.json();
  console.log('Status:', resLoginNova.status);
  console.log('Resposta:', JSON.stringify(loginNovaData, null, 2));

  if (!resLoginNova.ok) {
    console.log('❌ Login com nova senha falhou');
    return;
  }

  console.log('✅ Login com nova senha bem-sucedido');
}

test().catch(e => console.error('Erro:', e.message));

# Sistema Barbearia (Barber Pro)

Sistema web em Next.js para operacao de barbearia, com site institucional,
agendamento online, painel administrativo, area do cliente e modulo de assinaturas.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (via better-sqlite3)

## Funcionalidades principais

- Site institucional com paginas publicas
- Agendamento com validacao de conflito por data/horario/barbeiro
- Controle de barbeiros ativos/inativos
- Gestao de servicos no banco
- Dashboard admin com resumo operacional e exportacao CSV
- Area do cliente com perfil, cancelamento de agendamentos e status de assinatura
- Configuracao de planos/formas de pagamento persistida no banco
- Assinatura real por cliente (ativa/cancelada)

## Paginas

- `/` Home
- `/servicos`
- `/agendamento`
- `/assinaturas`
- `/login`
- `/area-cliente`
- `/contato`
- `/admin`
- `/admin/login`
- `/barbeiro`

## API

### Agendamentos

- `GET /api/agendamentos`
	- Lista agendamentos
- `GET /api/agendamentos?data=YYYY-MM-DD&barbeiroId=...`
	- Retorna horarios ocupados para bloqueio da agenda
- `POST /api/agendamentos`
	- Cria agendamento com validacoes de horario, conflito e barbeiro ativo
	- Quando plano for `Mensal` ou `Premium`, cria/reativa assinatura do cliente
- `PATCH /api/agendamentos/:id/cancelar`
	- Cancela agendamento

### Assinaturas

- `GET /api/assinaturas?clienteTelefone=...`
	- Consulta assinatura do cliente
- `POST /api/assinaturas`
	- Cria ou reativa assinatura de cliente
- `PATCH /api/assinaturas`
	- Cancela assinatura (`acao: "cancelar"`)

### Configuracao de assinaturas

- `GET /api/assinaturas-config`
	- Retorna planos e formas de pagamento ativas
- `PUT /api/assinaturas-config`
	- Atualiza planos e formas de pagamento

### Outros endpoints

- `/api/barbeiros`
- `/api/servicos`
- `/api/debug/servicos`

## Modelo de dados (resumo)

- `Agendamento`
- `Barbeiro`
- `Servico`
- `PlanoAssinatura`
- `FormaPagamentoAssinatura`
- `AssinaturaCliente`

Veja schema completo em `prisma/schema.prisma`.

## Regras de negocio

- Nao permite dois agendamentos confirmados no mesmo horario para o mesmo barbeiro
- Nao permite agendar para horario que ja passou
- Nao permite agendar com barbeiro inativo
- Assinatura do cliente e ativada/reativada quando agendamento usa plano assinavel

## Como rodar localmente

No PowerShell deste ambiente, use `npm.cmd` e `npx.cmd`.

1. Instalar dependencias

```powershell
npm.cmd install
```

2. Aplicar migrations

```powershell
npx.cmd prisma migrate dev
```

3. Subir ambiente de desenvolvimento

```powershell
npm.cmd run dev
```

4. Abrir no navegador

- http://localhost:3000

## Scripts uteis

- `npm.cmd run dev` - desenvolvimento
- `npm.cmd run build` - build de producao
- `npm.cmd run start` - iniciar build de producao
- `npm.cmd run lint` - validar lint
- `npx.cmd prisma migrate dev` - criar/aplicar migration
- `npx.cmd prisma generate` - regenerar Prisma Client

## Status atual

- Build e lint estao verdes
- Persistencia principal em SQLite local
- Autenticacao e pagamentos ainda em modo MVP

# Sistema Barbearia (Barber Pro)

Projeto em Next.js para barbearia com foco em:

- Site institucional
- Agendamento online com bloqueio de horario
- Area do cliente para consulta/cancelamento
- Painel administrativo
- Painel do barbeiro

## Tecnologias

- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS
- API Routes do Next.js

## Paginas implementadas

- `/` Home
- `/servicos` Lista de servicos e precos
- `/agendamento` Fluxo de agendamento
- `/login` Login/Cadastro (MVP de interface)
- `/area-cliente` Consulta e cancelamento de agendamentos
- `/contato` Endereco e WhatsApp
- `/admin` Dashboard administrativo
- `/barbeiro` Agenda pessoal por barbeiro

## API implementada

- `GET /api/agendamentos`
	- Lista todos os agendamentos
- `GET /api/agendamentos?data=YYYY-MM-DD&barbeiroId=...`
	- Retorna horarios ocupados para bloqueio na agenda
- `POST /api/agendamentos`
	- Cria agendamento, validando conflito de horario
- `PATCH /api/agendamentos/:id/cancelar`
	- Cancela agendamento

## Regra principal de negocio

O sistema nao permite dois clientes no mesmo horario para o mesmo barbeiro.

## Rodando localmente

No PowerShell deste ambiente, use `npm.cmd` em vez de `npm`:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra http://localhost:3000

## Observacoes do MVP

- Os dados estao em memoria (sem banco definitivo ainda)
- Login e pagamento estao como base de interface/fluxo
- Proximo passo recomendado: integrar PostgreSQL + Prisma + auth real

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteNome" TEXT NOT NULL,
    "clienteTelefone" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "servicoNome" TEXT NOT NULL,
    "barbeiroId" TEXT NOT NULL,
    "barbeiroNome" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Confirmado',
    "pagamentoStatus" TEXT NOT NULL DEFAULT 'Pendente',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Agendamento_data_barbeiroId_status_idx" ON "Agendamento"("data", "barbeiroId", "status");

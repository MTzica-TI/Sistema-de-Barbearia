-- CreateTable
CREATE TABLE "AssinaturaCliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteNome" TEXT NOT NULL,
    "clienteTelefone" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "iniciadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximaCobrancaEm" DATETIME,
    "canceladoEm" DATETIME,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaCliente_clienteTelefone_key" ON "AssinaturaCliente"("clienteTelefone");

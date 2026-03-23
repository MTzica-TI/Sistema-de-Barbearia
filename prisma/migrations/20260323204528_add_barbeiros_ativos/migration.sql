-- CreateTable
CREATE TABLE "Barbeiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

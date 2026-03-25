-- Add senha por perfil de barbeiro
ALTER TABLE "Barbeiro" ADD COLUMN "senha" TEXT NOT NULL DEFAULT 'barber123';

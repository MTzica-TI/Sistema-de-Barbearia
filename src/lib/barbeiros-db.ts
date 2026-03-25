import { prisma } from "@/lib/prisma";
import { barbeiros as barbeirosPadrao } from "@/lib/mock-data";
import { obterFotoBarbeiro } from "@/lib/barbeiros-fotos";

/**
 * Função desabilitada para permitir criação manual de barbeiros
 * Os barbeiros devem ser criados via admin panel, não auto-criados
 */
export async function garantirBarbeirosNoBanco() {
  // Função vazia - barbeiros devem ser criados manualmente
  return;
}

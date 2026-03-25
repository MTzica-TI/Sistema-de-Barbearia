import { prisma } from "@/lib/prisma";
import { barbeiros as barbeirosPadrao } from "@/lib/mock-data";

const FOTO_BARBEIRO_PADRAO = "/images/barbeiros/default.svg";

export async function garantirBarbeirosNoBanco() {
  const total = await prisma.barbeiro.count();
  if (total > 0) {
    return;
  }

  try {
    await prisma.barbeiro.createMany({
      data: barbeirosPadrao.map((item) => ({
        id: item.id,
        nome: item.nome,
        especialidade: item.especialidade,
        fotoUrl: item.fotoUrl || FOTO_BARBEIRO_PADRAO,
        senha: "barber123",
        ativo: item.ativo,
      })),
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "";
    if (!mensagem.includes("Unknown argument `senha`")) {
      throw error;
    }

    // Compatibilidade temporaria para instancia dev com client antigo em memoria.
    await prisma.barbeiro.createMany({
      data: barbeirosPadrao.map((item) => ({
        id: item.id,
        nome: item.nome,
        especialidade: item.especialidade,
        fotoUrl: item.fotoUrl || FOTO_BARBEIRO_PADRAO,
        ativo: item.ativo,
      })),
    });
  }
}

import { prisma } from "@/lib/prisma";
import { barbeiros as barbeirosPadrao } from "@/lib/mock-data";

export async function garantirBarbeirosNoBanco() {
  const total = await prisma.barbeiro.count();
  if (total > 0) {
    return;
  }

  await prisma.barbeiro.createMany({
    data: barbeirosPadrao.map((item) => ({
      id: item.id,
      nome: item.nome,
      especialidade: item.especialidade,
      fotoUrl: item.fotoUrl,
      senha: "barber123",
      ativo: item.ativo,
    })),
  });
}

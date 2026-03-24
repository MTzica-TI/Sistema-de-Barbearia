import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function main() {
  const servicos = [
    { id: "s1", nome: "Corte", preco: 45, duracaoMinutos: 30 },
    { id: "s2", nome: "Barba", preco: 35, duracaoMinutos: 30 },
    { id: "s3", nome: "Corte + Barba", preco: 70, duracaoMinutos: 60 },
    { id: "s4", nome: "Pigmentacao", preco: 55, duracaoMinutos: 45 },
    { id: "s5", nome: "Sobrancelha", preco: 20, duracaoMinutos: 15 },
  ];

  for (const servico of servicos) {
    const existe = await prisma.servico.findUnique({
      where: { nome: servico.nome },
    });

    if (!existe) {
      await prisma.servico.create({ data: servico });
      console.log(`✓ Serviço criado: ${servico.nome}`);
    } else {
      console.log(`- Serviço já existe: ${servico.nome}`);
    }
  }

  const total = await prisma.servico.count();
  console.log(`\nTotal de serviços no banco: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

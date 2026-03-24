import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function main() {
  console.log("=== VERIFICANDO BANCO DE DADOS ===\n");

  try {
    const servicos = await prisma.servico.findMany();
    console.log(`✓ Total de serviços: ${servicos.length}`);
    console.log("\nServiços encontrados:");
    servicos.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.nome} - R$ ${s.preco.toFixed(2)} (${s.duracaoMinutos}min)`);
    });

    if (servicos.length === 0) {
      console.log("  ⚠️  Nenhum serviço encontrado!");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar serviços:", error);
  }

  await prisma.$disconnect();
}

main();

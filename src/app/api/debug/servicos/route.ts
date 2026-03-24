import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

export async function GET() {
  try {
    const total = await prisma.servico.count();
    const servicos = await prisma.servico.findMany({
      orderBy: { criadoEm: "asc" },
    });

    return NextResponse.json({
      status: "ok",
      total,
      servicos,
      message: `Encontrados ${total} serviços no banco de dados`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "erro",
        error: errorMessage,
        message: "Erro ao buscar serviços",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";

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

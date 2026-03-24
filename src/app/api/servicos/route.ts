import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // @ts-expect-error - Prisma adapter type issue
    const servicos = await prisma.servico.findMany({
      orderBy: { criadoEm: "asc" },
    });
    return NextResponse.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, preco, duracaoMinutos } = body;

    if (!nome || preco === undefined || !duracaoMinutos) {
      return NextResponse.json(
        { error: "Nome, preço e duração são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o serviço já existe
    // @ts-expect-error - Prisma adapter type issue
    const servicoExistente = await prisma.servico.findUnique({
      where: { nome },
    });

    if (servicoExistente) {
      return NextResponse.json(
        { error: "Serviço com este nome já existe" },
        { status: 400 }
      );
    }

    // @ts-expect-error - Prisma adapter type issue
    const novoServico = await prisma.servico.create({
      data: {
        id: `s${Date.now()}`,
        nome,
        preco: parseFloat(preco),
        duracaoMinutos: parseInt(duracaoMinutos),
      },
    });

    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço" },
      { status: 500 }
    );
  }
}

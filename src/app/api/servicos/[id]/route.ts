import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, preco, duracaoMinutos } = body;

    if (!nome || preco === undefined || !duracaoMinutos) {
      return NextResponse.json(
        { error: "Nome, preço e duração são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o serviço existe
    const servicoExistente = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servicoExistente) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se novo nome já existe (se for diferente)
    if (nome !== servicoExistente.nome) {
      const servicoDuplicado = await prisma.servico.findUnique({
        where: { nome },
      });

      if (servicoDuplicado) {
        return NextResponse.json(
          { error: "Já existe um serviço com este nome" },
          { status: 400 }
        );
      }
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: {
        nome,
        preco: parseFloat(String(preco)),
        duracaoMinutos: parseInt(String(duracaoMinutos)),
      },
    });

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o serviço existe
    const servicoExistente = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servicoExistente) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    await prisma.servico.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Serviço removido com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao remover serviço:", error);
    return NextResponse.json(
      { error: "Erro ao remover serviço" },
      { status: 500 }
    );
  }
}

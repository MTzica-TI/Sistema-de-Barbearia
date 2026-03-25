import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

export async function POST(request: NextRequest) {
  await garantirBarbeirosNoBanco();

  const body = (await request.json()) as {
    id?: string;
    senha?: string;
  };

  const id = body.id?.trim() ?? "";
  const senha = body.senha ?? "";

  if (!id || !senha) {
    return NextResponse.json(
      { error: "Informe barbeiro e senha para entrar." },
      { status: 400 }
    );
  }

  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      ativo: true,
      senha: true,
    },
  });

  if (!barbeiro || !barbeiro.ativo) {
    return NextResponse.json(
      { error: "Barbeiro inativo ou nao encontrado." },
      { status: 401 }
    );
  }

  if (barbeiro.senha !== senha) {
    return NextResponse.json({ error: "Senha de barbeiro invalida." }, { status: 401 });
  }

  return NextResponse.json({
    barbeiro: {
      id: barbeiro.id,
      nome: barbeiro.nome,
    },
  });
}

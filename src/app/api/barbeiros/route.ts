import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

export async function GET(request: NextRequest) {
  await garantirBarbeirosNoBanco();

  const { searchParams } = new URL(request.url);
  const somenteAtivos = searchParams.get("ativos") === "1";

  const barbeiros = await prisma.barbeiro.findMany({
    where: somenteAtivos ? { ativo: true } : undefined,
    orderBy: {
      nome: "asc",
    },
  });

  return NextResponse.json({ barbeiros });
}

export async function PATCH(request: NextRequest) {
  await garantirBarbeirosNoBanco();

  const body = (await request.json()) as {
    id?: string;
    ativo?: boolean;
    nome?: string;
    especialidade?: string;
    fotoUrl?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Informe o id do barbeiro." }, { status: 400 });
  }

  const temAtualizacao =
    typeof body.ativo === "boolean" ||
    typeof body.nome === "string" ||
    typeof body.especialidade === "string" ||
    typeof body.fotoUrl === "string";

  if (!temAtualizacao) {
    return NextResponse.json(
      { error: "Informe ao menos um campo para atualizar o barbeiro." },
      { status: 400 }
    );
  }

  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id: body.id },
    select: { id: true },
  });

  if (!barbeiro) {
    return NextResponse.json({ error: "Barbeiro nao encontrado." }, { status: 404 });
  }

  const data: {
    ativo?: boolean;
    nome?: string;
    especialidade?: string;
    fotoUrl?: string;
  } = {};

  if (typeof body.ativo === "boolean") {
    data.ativo = body.ativo;
  }

  if (typeof body.nome === "string") {
    const nome = body.nome.trim();
    if (!nome) {
      return NextResponse.json({ error: "Nome do barbeiro e obrigatorio." }, { status: 400 });
    }
    data.nome = nome;
  }

  if (typeof body.especialidade === "string") {
    const especialidade = body.especialidade.trim();
    if (!especialidade) {
      return NextResponse.json({ error: "Especialidade e obrigatoria." }, { status: 400 });
    }
    data.especialidade = especialidade;
  }

  if (typeof body.fotoUrl === "string") {
    const fotoUrl = body.fotoUrl.trim();
    if (!fotoUrl) {
      return NextResponse.json({ error: "URL da foto e obrigatoria." }, { status: 400 });
    }
    data.fotoUrl = fotoUrl;
  }

  const atualizado = await prisma.barbeiro.update({
    where: { id: body.id },
    data,
  });

  return NextResponse.json({ barbeiro: atualizado });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

function gerarIdBarbeiro(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 30);

  return `barb-${base || "perfil"}-${Math.random().toString(36).slice(2, 8)}`;
}

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

export async function POST(request: NextRequest) {
  await garantirBarbeirosNoBanco();

  const body = (await request.json()) as {
    nome?: string;
    especialidade?: string;
    fotoUrl?: string;
    senha?: string;
    ativo?: boolean;
  };

  const nome = body.nome?.trim() ?? "";
  const especialidade = body.especialidade?.trim() ?? "";
  const fotoUrl = body.fotoUrl?.trim() ?? "";
  const senha = body.senha?.trim() ?? "";

  if (!nome) {
    return NextResponse.json({ error: "Nome do barbeiro e obrigatorio." }, { status: 400 });
  }

  if (!especialidade) {
    return NextResponse.json({ error: "Especialidade e obrigatoria." }, { status: 400 });
  }

  if (senha.length < 4) {
    return NextResponse.json(
      { error: "A senha do barbeiro deve ter ao menos 4 caracteres." },
      { status: 400 }
    );
  }

  const barbeiro = await prisma.barbeiro.create({
    data: {
      id: gerarIdBarbeiro(nome),
      nome,
      especialidade,
      fotoUrl: fotoUrl || "/images/barbeiros/default.jpg",
      senha,
      ativo: typeof body.ativo === "boolean" ? body.ativo : true,
    },
  });

  return NextResponse.json({ barbeiro }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  await garantirBarbeirosNoBanco();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "Informe o id do barbeiro." }, { status: 400 });
  }

  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id },
    select: { id: true, nome: true },
  });

  if (!barbeiro) {
    return NextResponse.json({ error: "Barbeiro nao encontrado." }, { status: 404 });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const agendamentoFuturo = await prisma.agendamento.findFirst({
    where: {
      barbeiroId: id,
      status: "Confirmado",
      data: {
        gte: hoje,
      },
    },
    select: { id: true },
  });

  if (agendamentoFuturo) {
    return NextResponse.json(
      {
        error:
          "Este barbeiro possui agendamentos confirmados futuros. Desative o perfil para bloquear novos agendamentos.",
      },
      { status: 409 }
    );
  }

  await prisma.barbeiro.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    message: `Perfil de ${barbeiro.nome} excluido com sucesso.`,
  });
}

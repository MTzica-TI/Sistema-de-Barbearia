import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

export async function POST(request: NextRequest) {
  try {
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

    try {
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
    } catch (errorBusca) {
      const mensagemBusca =
        errorBusca instanceof Error ? errorBusca.message : "Falha ao buscar barbeiro.";

      if (!mensagemBusca.includes("senha")) {
        throw errorBusca;
      }

      // Compatibilidade temporaria para runtime antigo do Prisma em memoria.
      const rows = await prisma.$queryRaw<
        Array<{ id: string; nome: string; ativo: boolean; senha: string | null }>
      >`
        SELECT "id", "nome", "ativo", "senha"
        FROM "Barbeiro"
        WHERE "id" = ${id}
        LIMIT 1
      `;

      const barbeiro = rows[0];

      if (!barbeiro || !barbeiro.ativo) {
        return NextResponse.json(
          { error: "Barbeiro inativo ou nao encontrado." },
          { status: 401 }
        );
      }

      if (!barbeiro.senha || barbeiro.senha !== senha) {
        return NextResponse.json({ error: "Senha de barbeiro invalida." }, { status: 401 });
      }

      return NextResponse.json({
        barbeiro: {
          id: barbeiro.id,
          nome: barbeiro.nome,
        },
      });
    }
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao autenticar barbeiro.";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

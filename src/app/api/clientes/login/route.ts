import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FOTO_CLIENTE_PADRAO = "/images/clientes/default.svg";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      senha?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const senha = body.senha ?? "";

    if (!email || !senha) {
      return NextResponse.json({ error: "Informe email e senha." }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { email },
      select: {
        nome: true,
        email: true,
        telefone: true,
        fotoUrl: true,
        senha: true,
      },
    });

    if (!cliente || cliente.senha !== senha) {
      return NextResponse.json({ error: "Email ou senha invalidos." }, { status: 401 });
    }

    return NextResponse.json({
      cliente: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        fotoUrl: cliente.fotoUrl?.trim() ? cliente.fotoUrl : FOTO_CLIENTE_PADRAO,
      },
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao autenticar cliente.";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

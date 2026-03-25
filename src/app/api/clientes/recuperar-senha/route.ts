import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarTelefone(valor: string) {
  return (valor ?? "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      telefone?: string;
      novaSenha?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const telefone = normalizarTelefone(body.telefone?.trim() ?? "");
    const novaSenha = body.novaSenha ?? "";

    if (!email || !telefone || !novaSenha) {
      return NextResponse.json(
        { error: "Informe email, telefone e nova senha." },
        { status: 400 }
      );
    }

    if (novaSenha.length < 4) {
      return NextResponse.json(
        { error: "A nova senha deve ter ao menos 4 caracteres." },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findFirst({
      where: { email, telefone },
      select: { id: true },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Nao encontramos uma conta com esse email e telefone." },
        { status: 404 }
      );
    }

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { senha: novaSenha },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao redefinir senha.";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

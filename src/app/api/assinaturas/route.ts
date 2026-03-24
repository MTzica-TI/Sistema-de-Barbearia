import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Plano } from "@/types";

function planoAssinavel(plano: Plano) {
  return plano === "Mensal" || plano === "Premium";
}

function dataProximaCobranca() {
  const hoje = new Date();
  const proxima = new Date(hoje);
  proxima.setDate(proxima.getDate() + 30);
  return proxima;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clienteTelefone = (searchParams.get("clienteTelefone") ?? "").trim();

  if (!clienteTelefone) {
    return NextResponse.json({ assinatura: null });
  }

  const assinatura = await prisma.assinaturaCliente.findUnique({
    where: { clienteTelefone },
  });

  return NextResponse.json({ assinatura });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      clienteNome?: string;
      clienteTelefone?: string;
      plano?: Plano;
    };

    const clienteNome = (body.clienteNome ?? "").trim();
    const clienteTelefone = (body.clienteTelefone ?? "").trim();
    const plano = body.plano ?? "Avulso";

    if (!clienteNome || !clienteTelefone) {
      return NextResponse.json(
        { error: "Cliente e telefone sao obrigatorios." },
        { status: 400 }
      );
    }

    if (!planoAssinavel(plano)) {
      return NextResponse.json(
        { error: "Plano informado nao gera assinatura." },
        { status: 400 }
      );
    }

    const assinatura = await prisma.assinaturaCliente.upsert({
      where: { clienteTelefone },
      update: {
        clienteNome,
        plano,
        status: "Ativa",
        canceladoEm: null,
        proximaCobrancaEm: dataProximaCobranca(),
      },
      create: {
        id: `assinatura-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        clienteNome,
        clienteTelefone,
        plano,
        status: "Ativa",
        proximaCobrancaEm: dataProximaCobranca(),
      },
    });

    return NextResponse.json({ assinatura }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar/reativar assinatura:", error);
    return NextResponse.json(
      { error: "Nao foi possivel criar a assinatura." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      clienteTelefone?: string;
      acao?: "cancelar";
    };

    const clienteTelefone = (body.clienteTelefone ?? "").trim();

    if (!clienteTelefone) {
      return NextResponse.json(
        { error: "Telefone do cliente e obrigatorio." },
        { status: 400 }
      );
    }

    const assinaturaAtual = await prisma.assinaturaCliente.findUnique({
      where: { clienteTelefone },
    });

    if (!assinaturaAtual) {
      return NextResponse.json(
        { error: "Assinatura nao encontrada." },
        { status: 404 }
      );
    }

    if (body.acao !== "cancelar") {
      return NextResponse.json(
        { error: "Acao invalida para assinatura." },
        { status: 400 }
      );
    }

    const assinatura = await prisma.assinaturaCliente.update({
      where: { clienteTelefone },
      data: {
        status: "Cancelada",
        canceladoEm: new Date(),
      },
    });

    return NextResponse.json({ assinatura });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json(
      { error: "Nao foi possivel atualizar a assinatura." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import {
  DEFAULT_ASSINATURA_CONFIG,
  type AssinaturaConfig,
} from "@/lib/assinaturas-config";
import { Plano } from "@/types";

function normalizarPlano(valor: unknown): Plano {
  if (valor === "Mensal" || valor === "Premium") {
    return valor;
  }

  return "Avulso";
}

async function garantirConfigPadrao() {
  const [totalPlanos, totalFormas] = await Promise.all([
    prisma.planoAssinatura.count(),
    prisma.formaPagamentoAssinatura.count(),
  ]);

  const operacoes = [];

  if (totalPlanos === 0) {
    operacoes.push(
      prisma.planoAssinatura.createMany({
        data: DEFAULT_ASSINATURA_CONFIG.planos.map((plano, index) => ({
          id: `plano-${index + 1}`,
          tipo: plano.tipo,
          nome: plano.nome,
          preco: plano.preco,
          ciclo: plano.ciclo,
          destaque: plano.destaque,
          beneficiosTexto: plano.beneficios.join("\n"),
          ordem: index,
          ativo: true,
        })),
      })
    );
  }

  if (totalFormas === 0) {
    operacoes.push(
      prisma.formaPagamentoAssinatura.createMany({
        data: DEFAULT_ASSINATURA_CONFIG.formasPagamento.map((descricao, index) => ({
          id: `forma-${index + 1}`,
          descricao,
          ordem: index,
          ativo: true,
        })),
      })
    );
  }

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes);
  }
}

async function lerConfigDoBanco(): Promise<AssinaturaConfig> {
  await garantirConfigPadrao();

  const [planos, formasPagamento] = await Promise.all([
    prisma.planoAssinatura.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    }),
    prisma.formaPagamentoAssinatura.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    }),
  ]);

  return {
    planos: planos.map((plano) => ({
      tipo: normalizarPlano(plano.tipo),
      nome: plano.nome,
      preco: plano.preco,
      ciclo: plano.ciclo,
      destaque: plano.destaque,
      beneficios: plano.beneficiosTexto
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    })),
    formasPagamento: formasPagamento.map((item) => item.descricao),
  };
}

export async function GET() {
  try {
    const config = await lerConfigDoBanco();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao carregar config de assinaturas:", error);
    return NextResponse.json(DEFAULT_ASSINATURA_CONFIG);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as AssinaturaConfig;

    if (!Array.isArray(body?.planos) || !Array.isArray(body?.formasPagamento)) {
      return NextResponse.json(
        { error: "Payload invalido para configuracao de assinaturas." },
        { status: 400 }
      );
    }

    const planos = body.planos
      .map((plano) => ({
        tipo: normalizarPlano(plano.tipo),
        nome: (plano.nome ?? "").trim(),
        preco: (plano.preco ?? "").trim(),
        ciclo: (plano.ciclo ?? "").trim() || "/mes",
        destaque: Boolean(plano.destaque),
        beneficios: Array.isArray(plano.beneficios)
          ? plano.beneficios.map((item) => item.trim()).filter(Boolean)
          : [],
      }))
      .filter((plano) => plano.nome && plano.preco && plano.beneficios.length > 0);

    const formasPagamento = body.formasPagamento
      .map((item) => item.trim())
      .filter(Boolean);

    if (planos.length === 0) {
      return NextResponse.json(
        { error: "E necessario manter ao menos um plano valido." },
        { status: 400 }
      );
    }

    if (formasPagamento.length === 0) {
      return NextResponse.json(
        { error: "E necessario manter ao menos uma forma de pagamento." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.planoAssinatura.deleteMany(),
      prisma.formaPagamentoAssinatura.deleteMany(),
      prisma.planoAssinatura.createMany({
        data: planos.map((plano, index) => ({
          id: `plano-${Date.now()}-${index + 1}`,
          tipo: plano.tipo,
          nome: plano.nome,
          preco: plano.preco,
          ciclo: plano.ciclo,
          destaque: plano.destaque,
          beneficiosTexto: plano.beneficios.join("\n"),
          ordem: index,
          ativo: true,
        })),
      }),
      prisma.formaPagamentoAssinatura.createMany({
        data: formasPagamento.map((descricao, index) => ({
          id: `forma-${Date.now()}-${index + 1}`,
          descricao,
          ordem: index,
          ativo: true,
        })),
      }),
    ]);

    const configAtualizada = await lerConfigDoBanco();
    return NextResponse.json(configAtualizada);
  } catch (error) {
    console.error("Erro ao salvar config de assinaturas:", error);
    return NextResponse.json(
      { error: "Nao foi possivel salvar a configuracao de assinaturas." },
      { status: 500 }
    );
  }
}

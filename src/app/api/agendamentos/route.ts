import { NextRequest, NextResponse } from "next/server";
import { Agendamento } from "@/types";
import { prisma } from "@/lib/prisma-client";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

function agendamentoJaPassou(data: string, horario: string) {
  const dataHora = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dataHora.getTime()) || dataHora <= new Date();
}

function planoAssinavel(plano: Agendamento["plano"]) {
  return plano === "Mensal" || plano === "Premium";
}

function assinaturaEmDia(proximaCobrancaEm: Date | null) {
  if (!proximaCobrancaEm) {
    return false;
  }

  return proximaCobrancaEm.getTime() >= Date.now();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const barbeiroId = searchParams.get("barbeiroId");

  if (data && barbeiroId) {
    const ocupados = await prisma.agendamento.findMany({
      where: {
        data,
        barbeiroId,
        status: "Confirmado",
      },
      select: {
        horario: true,
      },
      orderBy: {
        horario: "asc",
      },
    });

    return NextResponse.json({
      // @ts-ignore - item tipado pelo Prisma
      horariosOcupados: ocupados.map((item) => item.horario),
    });
  }

  const agendamentos = await prisma.agendamento.findMany({
    orderBy: {
      criadoEm: "desc",
    },
  });

  return NextResponse.json({ agendamentos });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Agendamento;
  await garantirBarbeirosNoBanco();

  if (agendamentoJaPassou(body.data, body.horario)) {
    return NextResponse.json(
      { error: "Nao e possivel agendar para horarios que ja passaram." },
      { status: 409 }
    );
  }

  const barbeiroAtivo = await prisma.barbeiro.findFirst({
    where: {
      id: body.barbeiroId,
      ativo: true,
    },
    select: {
      id: true,
    },
  });

  if (!barbeiroAtivo) {
    return NextResponse.json(
      { error: "Barbeiro indisponivel no momento. Escolha outro profissional." },
      { status: 409 }
    );
  }

  const conflito = await prisma.agendamento.findFirst({
    where: {
      barbeiroId: body.barbeiroId,
      data: body.data,
      horario: body.horario,
      status: "Confirmado",
    },
    select: {
      id: true,
    },
  });

  if (conflito) {
    return NextResponse.json(
      { error: "Horario indisponivel para esse barbeiro." },
      { status: 409 }
    );
  }

  if (planoAssinavel(body.plano)) {
    const assinatura = await prisma.assinaturaCliente.findUnique({
      where: {
        clienteTelefone: body.clienteTelefone,
      },
      select: {
        plano: true,
        status: true,
        proximaCobrancaEm: true,
      },
    });

    if (!assinatura) {
      return NextResponse.json(
        {
          error:
            "Voce precisa ter uma assinatura ativa para agendar com plano mensal ou premium.",
        },
        { status: 403 }
      );
    }

    if (assinatura.status !== "Ativa") {
      return NextResponse.json(
        { error: "Sua assinatura esta inativa. Regularize para continuar agendando." },
        { status: 403 }
      );
    }

    if (assinatura.plano !== body.plano) {
      return NextResponse.json(
        { error: "O plano selecionado nao corresponde ao plano ativo da sua assinatura." },
        { status: 403 }
      );
    }

    if (!assinaturaEmDia(assinatura.proximaCobrancaEm)) {
      return NextResponse.json(
        {
          error:
            "Sua assinatura nao esta em dia. Regularize o pagamento para liberar novos agendamentos.",
        },
        { status: 403 }
      );
    }
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      id: body.id,
      clienteNome: body.clienteNome,
      clienteTelefone: body.clienteTelefone,
      plano: body.plano,
      servicoId: body.servicoId,
      servicoNome: body.servicoNome,
      barbeiroId: body.barbeiroId,
      barbeiroNome: body.barbeiroNome,
      data: body.data,
      horario: body.horario,
      status: body.status,
      pagamentoStatus: body.pagamentoStatus,
    },
  });

  return NextResponse.json({ agendamento }, { status: 201 });
}

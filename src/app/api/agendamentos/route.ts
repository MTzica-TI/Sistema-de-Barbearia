import { NextRequest, NextResponse } from "next/server";
import { Agendamento } from "@/types";
import { prisma } from "@/lib/prisma";
import { garantirBarbeirosNoBanco } from "@/lib/barbeiros-db";

function agendamentoJaPassou(data: string, horario: string) {
  const dataHora = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dataHora.getTime()) || dataHora <= new Date();
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

  if (body.plano === "Mensal" || body.plano === "Premium") {
    try {
      const proximaCobrancaEm = new Date();
      proximaCobrancaEm.setDate(proximaCobrancaEm.getDate() + 30);

      await prisma.assinaturaCliente.upsert({
        where: {
          clienteTelefone: body.clienteTelefone,
        },
        update: {
          clienteNome: body.clienteNome,
          plano: body.plano,
          status: "Ativa",
          canceladoEm: null,
          proximaCobrancaEm,
        },
        create: {
          id: `assinatura-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          clienteNome: body.clienteNome,
          clienteTelefone: body.clienteTelefone,
          plano: body.plano,
          status: "Ativa",
          proximaCobrancaEm,
        },
      });
    } catch (error) {
      console.error("Erro ao sincronizar assinatura do cliente:", error);
    }
  }

  return NextResponse.json({ agendamento }, { status: 201 });
}

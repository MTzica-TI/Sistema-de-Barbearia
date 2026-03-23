import { NextRequest, NextResponse } from "next/server";
import { Agendamento } from "@/types";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ agendamento }, { status: 201 });
}

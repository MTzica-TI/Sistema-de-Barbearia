import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";

const ADMIN_EMAIL = "admin@gmail.com";

function lerContextoAuth(request: Request) {
  const adminEmail = request.headers.get("x-admin-email")?.trim().toLowerCase() ?? "";
  const barbeiroId = request.headers.get("x-barbeiro-id")?.trim() ?? "";

  return {
    isAdmin: adminEmail === ADMIN_EMAIL,
    barbeiroId,
  };
}

function agendamentoJaPassou(data: string, horario: string) {
  const dataHora = new Date(`${data}T${horario}:00`);
  return Number.isNaN(dataHora.getTime()) || dataHora <= new Date();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = lerContextoAuth(request);
  const body = (await request.json()) as {
    data?: string;
    horario?: string;
    barbeiroId?: string;
  };

  const agendamentoAtual = await prisma.agendamento.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      data: true,
      horario: true,
      barbeiroId: true,
      barbeiroNome: true,
    },
  });

  if (!agendamentoAtual) {
    return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
  }

  if (!auth.isAdmin && auth.barbeiroId !== agendamentoAtual.barbeiroId) {
    return NextResponse.json(
      { error: "Voce nao tem permissao para editar este agendamento." },
      { status: 403 }
    );
  }

  if (agendamentoAtual.status !== "Confirmado") {
    return NextResponse.json(
      { error: "Somente agendamentos confirmados podem ser alterados." },
      { status: 409 }
    );
  }

  const novaData = body.data?.trim() || agendamentoAtual.data;
  const novoHorario = body.horario?.trim() || agendamentoAtual.horario;
  const novoBarbeiroId = body.barbeiroId?.trim() || agendamentoAtual.barbeiroId;

  if (!novaData || !novoHorario || !novoBarbeiroId) {
    return NextResponse.json(
      { error: "Informe data, horario e barbeiro validos para reagendar." },
      { status: 400 }
    );
  }

  if (agendamentoJaPassou(novaData, novoHorario)) {
    return NextResponse.json(
      { error: "Nao e possivel reagendar para horarios que ja passaram." },
      { status: 409 }
    );
  }

  const barbeiro = await prisma.barbeiro.findFirst({
    where: {
      id: novoBarbeiroId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
    },
  });

  if (!barbeiro) {
    return NextResponse.json(
      { error: "Barbeiro indisponivel no momento. Escolha outro profissional." },
      { status: 409 }
    );
  }

  const conflito = await prisma.agendamento.findFirst({
    where: {
      id: {
        not: id,
      },
      barbeiroId: novoBarbeiroId,
      data: novaData,
      horario: novoHorario,
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

  const atualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      data: novaData,
      horario: novoHorario,
      barbeiroId: barbeiro.id,
      barbeiroNome: barbeiro.nome,
    },
  });

  return NextResponse.json({ agendamento: atualizado });
}

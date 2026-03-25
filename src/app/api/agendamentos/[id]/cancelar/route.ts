import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";

const ADMIN_EMAIL = "admin@gmail.com";

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, "");
}

function lerContextoAuth(request: Request) {
  const adminEmail = request.headers.get("x-admin-email")?.trim().toLowerCase() ?? "";
  const barbeiroId = request.headers.get("x-barbeiro-id")?.trim() ?? "";
  const clienteTelefone = request.headers.get("x-cliente-telefone")?.trim() ?? "";

  return {
    isAdmin: adminEmail === ADMIN_EMAIL,
    barbeiroId,
    clienteTelefone,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = lerContextoAuth(request);

  const existe = await prisma.agendamento.findUnique({
    where: { id },
    select: {
      id: true,
      barbeiroId: true,
      clienteTelefone: true,
    },
  });

  if (!existe) {
    return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
  }

  const autorizadoComoCliente =
    Boolean(auth.clienteTelefone) &&
    normalizarTelefone(auth.clienteTelefone) === normalizarTelefone(existe.clienteTelefone);
  const autorizadoComoBarbeiro = Boolean(auth.barbeiroId) && auth.barbeiroId === existe.barbeiroId;

  if (!auth.isAdmin && !autorizadoComoCliente && !autorizadoComoBarbeiro) {
    return NextResponse.json(
      { error: "Voce nao tem permissao para cancelar este agendamento." },
      { status: 403 }
    );
  }

  await prisma.agendamento.update({
    where: { id },
    data: { status: "Cancelado" },
  });

  return NextResponse.json({ ok: true });
}

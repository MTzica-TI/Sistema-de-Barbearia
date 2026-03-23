import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existe = await prisma.agendamento.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existe) {
    return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
  }

  await prisma.agendamento.update({
    where: { id },
    data: { status: "Cancelado" },
  });

  return NextResponse.json({ ok: true });
}

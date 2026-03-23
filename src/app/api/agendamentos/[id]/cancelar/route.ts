import { NextResponse } from "next/server";
import { cancelarAgendamento } from "@/lib/agendamentos-store";

export async function PATCH(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const resultado = cancelarAgendamento(id);

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
